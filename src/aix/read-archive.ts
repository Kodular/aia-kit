import { BlobReader, ZipReader, type Entry } from '@zip.js/zip.js'
import type { AiaExtension } from '#/types.js'
import { AiaZipError } from '#/errors.js'
import { extensionFromStandaloneAixEntries } from '#/aix/parse-extension-from-entries.js'
import { toBlob } from '#/utils/zip-io.js'

// TODO: zip members present under test-fixtures/aix (MIT corpus) but not surfaced by readAix (<package>/ = first path segment in that tree)
// <package>/files/AndroidRuntime.jar — not read (loadClassesJar only uses *classes.jar)
// <package>/files/component_build_info.json, <package>/files/component_build_infos.json — not read
// <package>/extension.properties — not read (file exists in every corpus .aix here)
// <package>/aiwebres/… — not read when present (BLE has no aiwebres/; others do); not read unless duplicated under …/assets/
// AixManifest.minSdk / buildVersion / permissions — placeholders, not read from archive
// First match wins: component.json vs components.json zip order; first *classes.jar; loadAssets uses basename only
// Tests (read-fixtures, aix.test.ts): do not assert the above, multi-component packs + build-info pairing, or full zip parity

/** Parse a standalone `.aix` (ZIP) into an {@link AiaExtension}. */
export async function readAix(input: Uint8Array | ArrayBuffer | Blob): Promise<AiaExtension> {
  const blob = toBlob(input)
  let entries: Entry[]
  try {
    const zr = new ZipReader(new BlobReader(blob))
    entries = await zr.getEntries()
    await zr.close()
  } catch (e) {
    throw new AiaZipError(`Cannot read AIX archive: ${e}`, e)
  }

  return extensionFromStandaloneAixEntries(entries)
}
