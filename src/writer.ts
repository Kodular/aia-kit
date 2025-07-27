import { BlobWriter, TextReader, ZipWriter } from "@zip.js/zip.js";
import type { Component } from "./component.js";
import type { Project } from "./project.js";
import { getPackageName, propertiesObjectToString } from "./utils/utils.js";
import type { RawComponent, ScmJson } from "./validators/scm.js";

export async function writeAia(project: Project): Promise<Blob> {
  const zw = new ZipWriter(new BlobWriter("application/zip"));

  // Add project.properties
  await zw.add(
    "youngandroidproject/project.properties",
    new TextReader(propertiesObjectToString(project.properties)),
  );

  const packageName = getPackageName(project.properties.main);
  if (!packageName) {
    throw new Error('Package name not found in project properties. Cannot generate YAIL without a valid package name.');
  }

  // Add screens
  for (const screen of project.screens) {
    const screenDir = `src/${packageName.replaceAll(".", "/")}`;
    await zw.add(
      `${screenDir}/${screen.name}.scm`,
      new TextReader(serializeScmJson({
        authURL: ["aia-kit"],
        YaVersion: 1,
        Source: "Form",
        Properties: jsonifyComponentTree(screen.form),
      })),
    );
    await zw.add(
      `${screenDir}/${screen.name}.bky`,
      new TextReader(screen.bkyContent),
    );
    await zw.add(
      `${screenDir}/${screen.name}.yail`,
      new TextReader(screen.getOrGenerateYail()),
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

function jsonifyComponentTree(component: Component): RawComponent {
  const json: RawComponent = {
    $Name: component.name,
    $Type: component.type,
    Uuid: component.uid,
    $Version: 1,
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

function serializeScmJson(json: ScmJson): string {
  const jsonString = JSON.stringify({
    authURL: json.authURL,
    YaVersion: String(json.YaVersion),
    Source: json.Source,
    Properties: json.Properties,
  });
  // Wrap the JSON in a comment block to match the expected format
  return `#|\n$JSON\n${jsonString}\n|#`;
}
