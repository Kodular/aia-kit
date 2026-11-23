import { BlobReader, BlobWriter, TextReader, ZipReader, ZipWriter } from "@zip.js/zip.js";
import { DOMParser, type Element as DomElement, type Node as DomNode } from "@xmldom/xmldom";
import { describe, expect, it } from "vitest";
import { setProperty } from "../edit/components.ts";
import { ArchiveError } from "../errors.ts";
import { parseBky, serializeBky } from "../formats/bky.ts";
import { parseScm, serializeScm } from "../formats/scm.ts";
import {
  AIA_FIXTURES,
  AIX_FIXTURES,
  BKY,
  PROPERTIES,
  SCM,
  demoProject,
  fixture,
} from "../test-helpers.ts";
import { readAia, readAix } from "./read.ts";
import { writeAia, writeAix } from "./write.ts";

async function entries(blob: Blob): Promise<Map<string, Uint8Array>> {
  const reader = new ZipReader(new BlobReader(blob));
  const result = new Map<string, Uint8Array>();
  for (const entry of await reader.getEntries()) {
    if (!entry.directory)
      result.set(entry.filename, await (await entry.getData(new BlobWriter())).bytes());
  }
  await reader.close();
  return result;
}

async function archive(files: Record<string, string>): Promise<Blob> {
  const writer = new ZipWriter(new BlobWriter());
  for (const [path, text] of Object.entries(files)) await writer.add(path, new TextReader(text));
  return writer.close();
}

/** Every element of a workspace as `tag|attributes|own text`, with legacy `<title>` normalised. */
function census(xml: string): string[] {
  if (xml.trim() === "") return ["xml||"]; // an empty file is an empty workspace
  const out: string[] = [];
  const visit = (parent: DomNode) => {
    for (let node = parent.firstChild; node; node = node.nextSibling) {
      if (node.nodeType !== 1) continue;
      const el = node as DomElement;
      const attrs: string[] = [];
      for (let i = 0; i < el.attributes.length; i++) {
        const attr = el.attributes.item(i);
        if (attr && attr.name !== "xmlns") attrs.push(`${attr.name}=${attr.value}`);
      }
      let text = "";
      for (let child = el.firstChild; child; child = child.nextSibling) {
        if (child.nodeType === 3) text += child.nodeValue?.trim() ?? "";
      }
      out.push(
        `${el.tagName === "title" ? "field" : el.tagName}|${attrs.sort().join(",")}|${text}`,
      );
      visit(el);
    }
  };
  visit(new DOMParser().parseFromString(xml, "text/xml"));
  return out.sort();
}

describe.each(AIA_FIXTURES)("fixture %s", (path) => {
  it("reads without problems and writes every file back byte-for-byte", async () => {
    const original = await fixture(path);
    const { project, problems } = await readAia(original);
    expect(problems).toEqual([]);
    expect(project.screens.length).toBeGreaterThan(0);
    expect(project.screens[0]?.name).toBe(project.properties.main.split(".").at(-1));

    expect(await entries(await writeAia(project))).toEqual(await entries(original));
  });

  it("loses nothing when screens are re-serialized", async () => {
    const files = [...(await entries(await fixture(path)))].map(
      ([name, bytes]) => [name, new TextDecoder().decode(bytes)] as const,
    );
    const json = (scm: string) => JSON.parse(scm.slice(scm.indexOf("{"), scm.lastIndexOf("}") + 1));

    for (const [, original] of files.filter(([name]) => name.endsWith(".scm"))) {
      const doc = parseScm(original);
      const text = serializeScm(structuredClone(doc));
      expect(parseScm(text)).toEqual(doc);
      expect(json(text)).toEqual(json(original));
    }
    for (const [, original] of files.filter(([name]) => name.endsWith(".bky"))) {
      const doc = parseBky(original);
      const text = serializeBky(structuredClone(doc));
      expect(parseBky(text)).toEqual(doc);
      expect(census(text)).toEqual(census(original));
    }
  });
});

describe.each(AIX_FIXTURES)("fixture %s", (path) => {
  it("reads and writes back byte-for-byte", async () => {
    const original = await fixture(path);
    const extension = await readAix(original);
    expect(extension.components.length).toBeGreaterThan(0);
    expect(extension.components[0]?.type.startsWith(`${extension.packageName}.`)).toBe(true);
    expect(extension.files.some((file) => file.path === "classes.jar")).toBe(true);
    expect(await entries(await writeAix(extension))).toEqual(await entries(original));
  });
});

describe("readAia", () => {
  it("reads bundled extensions with all their files", async () => {
    const { project } = await readAia(await fixture("mit-extension-demos/LookTest_20181124.aia"));
    const [look] = project.extensions;
    expect(look?.packageName).toBe("edu.mit.appinventor.ai.look");
    expect(look?.components[0]).toMatchObject({ name: "Look", external: true, nonVisible: true });
    expect(look?.files.map((f) => f.path)).toContain("files/AndroidRuntime.jar");
    expect(project.assets).toEqual([]);
  });

  it("accepts ArrayBuffer and Uint8Array", async () => {
    const blob = await writeAia(demoProject());
    expect((await readAia(await blob.arrayBuffer())).project.screens).toHaveLength(2);
    expect((await readAia(await blob.bytes())).project.screens).toHaveLength(2);
  });

  it("throws ArchiveError for non-archives and archives without project.properties", async () => {
    await expect(readAia(new Blob(["nope"]))).rejects.toThrow(ArchiveError);
    await expect(readAia(await archive({ "a.txt": "x" }))).rejects.toThrow(/project\.properties/);
    await expect(
      readAia(await archive({ "youngandroidproject/project.properties": "name=x" })),
    ).rejects.toThrow(ArchiveError);
  });

  it("reports unreadable parts and keeps their files", async () => {
    const dir = "src/appinventor/ai_test/Demo";
    const blob = await archive({
      "youngandroidproject/project.properties": PROPERTIES,
      [`${dir}/Screen1.scm`]: SCM,
      [`${dir}/Screen1.bky`]: BKY,
      [`${dir}/Broken.scm`]: "garbage",
      [`${dir}/Broken.bky`]: "",
      [`${dir}/Half.scm`]: SCM,
      "assets/external_comps/com.bad/components.json": "{not json",
      "assets/external_comps/com.bad/classes.jar": "jar",
      "notes/readme.txt": "hello",
    });
    const { project, problems } = await readAia(blob);

    expect(project.screens.map((s) => s.name)).toEqual(["Screen1"]);
    expect(project.extensions).toEqual([]);
    expect(problems.map((p) => [p.code, "extension" in p ? p.extension : p.screen])).toEqual([
      ["unreadable-screen", "Broken"],
      ["unreadable-screen", "Half"],
      ["unreadable-extension", "com.bad"],
    ]);
    expect(problems[0]).toMatchObject({ reason: "malformed-scm", severity: "error" });
    expect(problems[1]).toMatchObject({ reason: "missing-bky" });

    expect(await entries(await writeAia(project))).toEqual(await entries(blob));
  });
});

describe("writeAia", () => {
  it("writes a project built in memory to the expected paths", async () => {
    const files = await entries(await writeAia(demoProject()));
    expect([...files.keys()]).toEqual([
      "youngandroidproject/project.properties",
      "src/appinventor/ai_test/Demo/Screen1.scm",
      "src/appinventor/ai_test/Demo/Screen1.bky",
      "src/appinventor/ai_test/Demo/Screen2.scm",
      "src/appinventor/ai_test/Demo/Screen2.bky",
      "assets/logo.png",
      "assets/unused.mp3",
      "assets/external_comps/com.example.ext/components.json",
      "assets/external_comps/com.example.ext/classes.jar",
    ]);
  });

  it("keeps the YAIL of unchanged screens and drops it for edited ones", async () => {
    const dir = "src/appinventor/ai_test/Demo";
    const blob = await archive({
      "youngandroidproject/project.properties": PROPERTIES,
      [`${dir}/Screen1.scm`]: SCM,
      [`${dir}/Screen1.bky`]: BKY,
      [`${dir}/Screen1.yail`]: "(yail)",
    });
    const { project } = await readAia(blob);
    expect((await entries(await writeAia(project))).has(`${dir}/Screen1.yail`)).toBe(true);

    const edited = setProperty(project, "Screen1", "Button1", "Text", "Stop");
    const files = await entries(await writeAia(edited));
    expect(files.has(`${dir}/Screen1.yail`)).toBe(false);
    expect(files.get(`${dir}/Screen1.bky`)).toEqual(new TextEncoder().encode(BKY));
    expect(new TextDecoder().decode(files.get(`${dir}/Screen1.scm`))).toContain('"Text":"Stop"');
  });
});

describe("readAix", () => {
  it("throws ArchiveError for archives that are not extensions", async () => {
    await expect(readAix(await archive({ "a/x.txt": "", "b/y.txt": "" }))).rejects.toThrow(
      ArchiveError,
    );
    await expect(readAix(await archive({ "com.x/classes.jar": "" }))).rejects.toThrow(
      /components\.json/,
    );
  });
});
