import { BlobReader, BlobWriter, ZipReader, ZipWriter, type FileEntry } from "@zip.js/zip.js";
import { ArchiveError } from "../errors.ts";
import type { ArchiveFile } from "../types.ts";

export type ArchiveInput = Blob | ArrayBuffer | Uint8Array;

/** Reads every file of a ZIP archive, in archive order. Directories are skipped. */
export async function unzip(input: ArchiveInput, what: string): Promise<ArchiveFile[]> {
  const blob =
    input instanceof Blob ? input : new Blob([input as ArrayBuffer | Uint8Array<ArrayBuffer>]);
  const reader = new ZipReader(new BlobReader(blob));
  try {
    const entries = await reader.getEntries();
    const files = entries.filter((entry): entry is FileEntry => !entry.directory);
    return await Promise.all(
      files.map(async (entry) => ({
        path: entry.filename,
        blob: await entry.getData(new BlobWriter()),
      })),
    );
  } catch (cause) {
    throw new ArchiveError(`Cannot read ${what}: not a valid ZIP archive`, { cause });
  } finally {
    await reader.close();
  }
}

export async function zip(files: Iterable<ArchiveFile>): Promise<Blob> {
  const writer = new ZipWriter(new BlobWriter("application/zip"));
  const seen = new Set<string>();
  for (const file of files) {
    if (seen.has(file.path)) continue;
    seen.add(file.path);
    await writer.add(file.path, new BlobReader(file.blob));
  }
  return writer.close();
}

export function textFile(path: string, text: string): ArchiveFile {
  return { path, blob: new Blob([text]) };
}
