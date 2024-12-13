import {BlobWriter, type Entry, TextWriter} from "@zip.js/zip.js";

export async function getTextFileContent(file: Entry): Promise<string> {
    return await file.getData!(new TextWriter())
}

export async function getBlobFileContent(file: Entry): Promise<Blob> {
    return await file.getData!(new BlobWriter())
}
