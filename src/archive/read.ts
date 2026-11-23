import { AiaKitError, ArchiveError } from "../errors.ts";
import { parseBky } from "../formats/bky.ts";
import { parseComponentDescriptors } from "../formats/descriptors.ts";
import { parseProperties } from "../formats/properties.ts";
import { parseScm } from "../formats/scm.ts";
import { simpleName } from "../internal/names.ts";
import type { Problem } from "../problems.ts";
import type { ArchiveFile, Asset, Extension, Project, Screen } from "../types.ts";
import { rememberYail } from "./yail-source.ts";
import { unzip, type ArchiveInput } from "./zip.ts";

export interface ReadResult {
  readonly project: Project;
  /**
   * Things that could not be read. The affected files are kept in
   * `project.otherFiles`, so writing the project back loses nothing.
   */
  readonly problems: readonly Problem[];
}

const PROPERTIES_PATH = "youngandroidproject/project.properties";
const EXTENSIONS_DIR = "assets/external_comps/";

/**
 * Reads an `.aia` project archive.
 * @throws {ArchiveError} if the input is not a ZIP or has no `project.properties`.
 */
export async function readAia(input: ArchiveInput): Promise<ReadResult> {
  const files = await unzip(input, "AIA");
  const problems: Problem[] = [];
  const otherFiles: ArchiveFile[] = [];

  const propertiesFile = files.find((file) => file.path === PROPERTIES_PATH);
  if (!propertiesFile) throw new ArchiveError(`AIA has no ${PROPERTIES_PATH}`);
  let properties;
  try {
    properties = parseProperties(await propertiesFile.blob.text());
  } catch (cause) {
    throw new ArchiveError(`AIA has an unreadable ${PROPERTIES_PATH}`, { cause });
  }

  const screenFiles = new Map<string, Partial<Record<"scm" | "bky" | "yail", ArchiveFile>>>();
  const extensionFiles = new Map<string, ArchiveFile[]>();
  const assets: Asset[] = [];

  for (const file of files) {
    const { path } = file;
    const screenFile = /^src\/(?:.*\/)?([^/]+)\.(scm|bky|yail)$/.exec(path);
    if (path === PROPERTIES_PATH) continue;
    if (screenFile) {
      const [, name = "", kind] = screenFile;
      const group = screenFiles.get(name) ?? {};
      group[kind as "scm" | "bky" | "yail"] = file;
      screenFiles.set(name, group);
    } else if (path.startsWith(EXTENSIONS_DIR)) {
      const rest = path.slice(EXTENSIONS_DIR.length);
      const slash = rest.indexOf("/");
      if (slash === -1) {
        otherFiles.push(file);
        continue;
      }
      const packageName = rest.slice(0, slash);
      const group = extensionFiles.get(packageName) ?? [];
      group.push({ path: rest.slice(slash + 1), blob: file.blob });
      extensionFiles.set(packageName, group);
    } else if (path.startsWith("assets/")) {
      assets.push({ name: path.slice("assets/".length), blob: file.blob });
    } else {
      otherFiles.push(file);
    }
  }

  const mainScreen = simpleName(properties.main);
  const screens: Screen[] = [];
  for (const [name, group] of screenFiles) {
    const result = await readScreen(name, group);
    if ("problem" in result) {
      problems.push(result.problem);
      otherFiles.push(...Object.values(group));
    } else if (name === mainScreen) screens.unshift(result.screen);
    else screens.push(result.screen);
  }

  const extensions: Extension[] = [];
  for (const [packageName, group] of extensionFiles) {
    try {
      extensions.push(await extensionFromFiles(packageName, group));
    } catch (error) {
      problems.push({
        code: "unreadable-extension",
        severity: "error",
        extension: packageName,
        message: `Extension "${packageName}" could not be read: ${messageOf(error)}`,
      });
      for (const file of group) {
        otherFiles.push({ path: `${EXTENSIONS_DIR}${packageName}/${file.path}`, blob: file.blob });
      }
    }
  }

  return { project: { properties, screens, assets, extensions, otherFiles }, problems };
}

/**
 * Reads a standalone `.aix` extension archive.
 * @throws {ArchiveError} if the input is not a ZIP or is not an extension.
 */
export async function readAix(input: ArchiveInput): Promise<Extension> {
  const files = await unzip(input, "AIX");
  const packageName = files[0]?.path.split("/")[0] ?? "";
  const prefix = `${packageName}/`;
  if (packageName === "" || !files.every((file) => file.path.startsWith(prefix))) {
    throw new ArchiveError("AIX must contain exactly one top-level extension directory");
  }
  try {
    return await extensionFromFiles(
      packageName,
      files.map((file) => ({ path: file.path.slice(prefix.length), blob: file.blob })),
    );
  } catch (cause) {
    throw new ArchiveError(`AIX is not a valid extension: ${messageOf(cause)}`, { cause });
  }
}

async function readScreen(
  name: string,
  files: Partial<Record<"scm" | "bky" | "yail", ArchiveFile>>,
): Promise<{ screen: Screen } | { problem: Problem }> {
  const unreadable = (
    reason: Extract<Problem, { code: "unreadable-screen" }>["reason"],
    detail: string,
  ): { problem: Problem } => ({
    problem: {
      code: "unreadable-screen",
      severity: "error",
      screen: name,
      reason,
      message: `Screen "${name}" could not be read: ${detail}`,
    },
  });

  if (!files.scm) return unreadable("missing-scm", "it has no .scm file");
  if (!files.bky) return unreadable("missing-bky", "it has no .bky file");

  let scm, bky;
  try {
    scm = parseScm(await files.scm.blob.text());
  } catch (error) {
    return unreadable("malformed-scm", messageOf(error));
  }
  try {
    bky = parseBky(await files.bky.blob.text());
  } catch (error) {
    return unreadable("malformed-bky", messageOf(error));
  }

  if (files.yail) rememberYail(scm.form, bky.blocks, await files.yail.blob.text());
  return {
    screen: {
      name,
      form: scm.form,
      blocks: bky.blocks,
      meta: { form: scm.meta, blocks: bky.meta },
    },
  };
}

async function extensionFromFiles(packageName: string, files: ArchiveFile[]): Promise<Extension> {
  const descriptorFile =
    files.find((file) => file.path === "components.json") ??
    files.find((file) => file.path === "component.json");
  if (!descriptorFile) throw new AiaKitError("it has no components.json");

  let json: unknown;
  try {
    json = JSON.parse(await descriptorFile.blob.text());
  } catch {
    throw new AiaKitError(`${descriptorFile.path} is not valid JSON`);
  }
  return { packageName, components: parseComponentDescriptors(json), files };
}

function messageOf(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
