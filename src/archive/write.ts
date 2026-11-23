import { serializeBky } from "../formats/bky.ts";
import { serializeProperties } from "../formats/properties.ts";
import { serializeScm } from "../formats/scm.ts";
import { sourceDirectory } from "../internal/names.ts";
import type { ArchiveFile, Extension, Project } from "../types.ts";
import { originalYail } from "./yail-source.ts";
import { textFile, zip } from "./zip.ts";

/**
 * Writes a project as an `.aia` archive.
 *
 * Parts that were read and not changed are written back byte-for-byte. A
 * screen's `.yail` is kept only while that screen is unchanged, because
 * aia-kit does not regenerate YAIL (App Inventor does so on import).
 */
export function writeAia(project: Project): Promise<Blob> {
  const files: ArchiveFile[] = [
    textFile("youngandroidproject/project.properties", serializeProperties(project.properties)),
  ];

  const dir = sourceDirectory(project.properties);
  for (const screen of project.screens) {
    const path = `${dir}/${screen.name}`;
    files.push(
      textFile(`${path}.scm`, serializeScm({ form: screen.form, meta: screen.meta.form })),
      textFile(`${path}.bky`, serializeBky({ blocks: screen.blocks, meta: screen.meta.blocks })),
    );
    const yail = originalYail(screen.form, screen.blocks);
    if (yail !== undefined) files.push(textFile(`${path}.yail`, yail));
  }

  for (const asset of project.assets) {
    files.push({ path: `assets/${asset.name}`, blob: asset.blob });
  }
  for (const extension of project.extensions) {
    for (const file of extension.files) {
      files.push({
        path: `assets/external_comps/${extension.packageName}/${file.path}`,
        blob: file.blob,
      });
    }
  }
  files.push(...project.otherFiles);

  return zip(files);
}

/** Writes an extension as a standalone `.aix` archive. */
export function writeAix(extension: Extension): Promise<Blob> {
  return zip(
    extension.files.map((file) => ({
      path: `${extension.packageName}/${file.path}`,
      blob: file.blob,
    })),
  );
}
