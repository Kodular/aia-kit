import { BlobWriter, TextReader, ZipWriter } from "@zip.js/zip.js";
import type { Project } from "./project.js";
import { propertiesObjectToString } from "./utils/utils.js";
import type { ComponentJson, ScmJson } from "./types.js";
import type { Component } from "./component.js";

export async function writeAia(project: Project): Promise<Blob> {
  const zw = new ZipWriter(new BlobWriter("application/zip"));

  // Add project.properties
  await zw.add(
    "youngandroidproject/project.properties",
    new TextReader(propertiesObjectToString(project.properties)),
  );

  const packageName = project.properties.main;

  // Add screens
  for (const screen of project.screens) {
    await zw.add(
      `src/${packageName.replaceAll(".", "/")}/${screen.name}.scm`,
      new TextReader(
        "#|\n$JSON\n" +
          JSON.stringify({
            authURL: [],
            YaVersion: "1",
            Source: "...",
            Properties: jsonifyComponentTree(screen.form),
          } as ScmJson) +
          "\n|#",
      ),
    );
    await zw.add(
      `src/com/google/appinventor/components/runtime/${screen.name}.bky`,
      new TextReader(screen.bkyContent),
    );
  }

  // Add assets
  for (const asset of project.assets) {
    await zw.add(`assets/${asset.name}`, asset.getBlob().stream());
  }

  // Add extensions
  for (const extension of project.extensions) {
    await zw.add(
      `assets/external_comps/${extension.name}/component.json`,
      new TextReader(JSON.stringify(extension.descriptorJSON)),
    );
  }

  return zw.close();
}

function jsonifyComponentTree(component: Component): ComponentJson {
  const json: ComponentJson = {
    $Name: component.name,
    $Type: component.type,
    Uuid: component.uid,
    $Version: "1",
    $Components: [],
  };

  // Add properties
  for (const { name, value } of component.properties) {
    json[name] = value;
  }

  // Add children
  for (const child of component.children) {
    json.$Components?.push(jsonifyComponentTree(child));
  }

  return json;
}