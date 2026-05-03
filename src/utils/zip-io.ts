import { BlobWriter, TextWriter, type Entry, type FileEntry } from '@zip.js/zip.js'

export function toBlob(input: Uint8Array | ArrayBuffer | Blob): Blob {
  if (input instanceof Blob) return input
  if (input instanceof ArrayBuffer) return new Blob([input])
  return new Blob([input.buffer as ArrayBuffer])
}

export async function readZipEntryText(entry: Entry): Promise<string> {
  return (entry as FileEntry).getData(new TextWriter())
}

export async function readZipEntryBlob(entry: Entry): Promise<Blob> {
  return (entry as FileEntry).getData(new BlobWriter())
}
