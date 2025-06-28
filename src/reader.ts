/**
 * Defines functions used to extract components, extensions, and assets from
 * an AIA file.
 *
 *
 * @file   This file defines the AIAReader class.
 * @author vishwas@kodular.io (Vishwas Adiga)
 * @since  1.0.0
 * @license
 */

import { BlobReader, type Entry, HttpReader, ZipReader } from "@zip.js/zip.js";
import { Asset } from "./asset.js";
import { Extension } from "./extension.js";
import { AiaFileStructure } from "./file_structures.js";
import { Project } from "./project.js";
import { Screen } from "./screen.js";
import type {
  ExtensionBuildInfoJson,
  ExtensionDescriptorJson,
} from "./types.js";
import { getFileInfo, readProjectProperties } from "./utils/utils.js";
import { getBlobFileContent, getTextFileContent } from "./utils/zipjs.js";
import type { Environment } from "./Environment.js";

/**
 * Unzips and reads every file in an AIA and then parses it.
 *
 * @param fileOrUrl The AIA file, or a URL pointing to it.
 * @return A Promise object, when resolved, yields the parsed Project object.
 */
export async function parseAia(fileOrUrl: Blob | string, environment: Environment): Promise<Project> {
  const readerObj =
    fileOrUrl instanceof Blob
      ? new BlobReader(fileOrUrl)
      : new HttpReader(fileOrUrl);
  const zr = new ZipReader(readerObj);
  const entries = await zr.getEntries();

  const projectPropertiesFile = entries.find(
    (x) => x.filename === AiaFileStructure.projectProperties,
  );
  if (!projectPropertiesFile) {
    throw new Error("Invalid AIA file: project.properties not found");
  }

  const projectProperties = await readProjectProperties(projectPropertiesFile);

  const project = Project.from(projectProperties, environment);

  // Extensions are loaded first so that instances of extensions can
  // later fetch the correct descriptor JSON files.
  for (const extension of await generateExtensions(
    entries.filter((x) => getFileInfo(x)[1] === "json"),
  )) {
    project.addExtension(extension);
  }

  // Screens are loaded asynchronously.
  for (const screen of await generateScreens(
    entries.filter(
      (x) => getFileInfo(x)[1] === "scm" || getFileInfo(x)[1] === "bky",
    ),
  )) {
    project.addScreen(screen);
  }

  // Finally, all the assets are loaded.
  for (const asset of await generateAssets(
    entries.filter(
      (x) =>
        x.filename.split("/")[0] === "assets" &&
        x.filename.split("/")[2] === undefined,
    ),
  )) {
    project.addAsset(asset);
  }

  return project;
}

/**
 * Asynchronously reads every screen in the project.
 *
 * @param files   An array of files that have a filetype .scm or .bky.
 * @return A Promise object, when resolved, yields the parsed
 */
async function generateScreens(files: Entry[]): Promise<Screen[]> {
  const schemes: { name: string; scm: string }[] = [];
  const blocks: { name: string; bky: string }[] = [];

  // First, we load all the scheme files into the schemes array and the Blockly
  // files into the blocks array.
  for (const file of files) {
    const content = await getTextFileContent(file);
    const [fileName, fileType] = getFileInfo(file);
    if (fileType === "scm") {
      schemes.push({
        name: fileName,
        scm: content,
      });
    } else if (fileType === "bky") {
      blocks.push({
        name: fileName,
        bky: content,
      });
    }
  }

  const screens: Promise<Screen>[] = [];

  // Then, for each scheme file, we create a new AIScreen and initialise it with
  // the corresponding Blockly file.
  for (const scheme of schemes) {
    const block = blocks.find((x) => x.name === scheme.name);
    if (!block) continue;
    screens.push(Screen.init(scheme.name, scheme.scm, block.bky));
  }

  return Promise.all(screens);
}

/**
 * Asynchronously reads every extension used in the project.
 *
 * @param files An array of files that have a filetype .json.
 * @return An array of AIExtension objects for the project being read.
 */
async function generateExtensions(files: Entry[]): Promise<Extension[]> {
  const buildInfos: { name: string; info: ExtensionBuildInfoJson[] }[] = [];
  const descriptors: {
    name: string;
    descriptor: ExtensionDescriptorJson[];
  }[] = [];

  // The component_build_info and component descriptor files are being read.
  // Some extensions describe the component as a JSON array, while some as a
  // JSON object. We collect both files at the same time and handle them
  // separately later.
  for (const file of files) {
    const content = await getTextFileContent(file);
    const fileName = getFileInfo(file)[0];
    const extName = file.filename.split("/")[2];
    if (fileName === "component_build_infos") {
      buildInfos.push({
        name: extName,
        info: JSON.parse(content) as ExtensionBuildInfoJson[],
      });
    } else if (fileName === "component_build_info") {
      buildInfos.push({
        name: extName,
        info: [JSON.parse(content)] as ExtensionBuildInfoJson[],
      });
    } else if (fileName === "components") {
      descriptors.push({
        name: extName,
        descriptor: JSON.parse(content) as ExtensionDescriptorJson[],
      });
    } else if (fileName === "component") {
      descriptors.push({
        name: extName,
        descriptor: [JSON.parse(content)] as ExtensionDescriptorJson[],
      });
    }
  }

  const extensions: Extension[] = [];

  // If the build info is an array, then the extension is a pack
  // (a collection of extensions bundled into one file). In such a case, we
  // iterate through each element in the array and create a new AIExtension for
  // every extension defined in the pack.
  // If the build info is a JSON object, then the extension is standalone, and
  // we handle it as such.
  for (const buildInfo of buildInfos) {
    for (const [i, ext] of buildInfo.info.entries()) {
      const desc = descriptors.find((x) => x.name === buildInfo.name);
      if (!desc) continue;
      extensions.push(new Extension(ext.type, desc.descriptor[i]));
    }
  }

  return extensions;
}

/**
 * Asynchronously reads every asset uploaded to the project.
 *
 * @param files An array of files present in the assets folderr of the AIA.
 * @return An array of AIAsset objects for the project being read.
 */
async function generateAssets(files: Entry[]): Promise<Asset[]> {
  const assets: Asset[] = [];
  for (const file of files) {
    // TODO: Lazily read the file content.
    const content = await getBlobFileContent(file);
    const [fileName, fileType] = getFileInfo(file);
    assets.push(new Asset(fileName, fileType, content));
  }
  return assets;
}
