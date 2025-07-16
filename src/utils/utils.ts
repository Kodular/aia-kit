import type { Entry } from "@zip.js/zip.js";
import { getProperties } from "properties-file";
import simpleComponentsJson from "../environments/kodular-creator/simple_components.json" with {
  type: "json"
};
import type { Project } from "../project.js";
import { getTextFileContent } from "./zipjs.js";

/**
 * Convert the color in &HAARRGGBB format to #RRGGBBAA format
 */
export function parseAiColor(color: string) {
  return `#${color.substring(4, 10)}${color.substring(2, 4)}`;
}

export function parseAiBoolean(bool: string) {
  return bool === "True";
}

export function getFileInfo(file: Entry): [string, string] {
  // return name and type
  const a = file.filename.lastIndexOf("/");
  const b = file.filename.lastIndexOf(".");
  return [file.filename.substring(a + 1, b), file.filename.substring(b + 1)];
}

export async function readProjectProperties(file: Entry) {
  const content = await getTextFileContent(file);

  return getProperties(content);
}

export function propertiesObjectToString(properties: { [key: string]: string }): string {
  return Object.entries(properties)
    .map(([key, value]) => `${key}=${value}`)
    .join("\n");
}

export function getDescriptor(componentType: string, project: Project) {
  // First check built-in components
  const descriptor = simpleComponentsJson.find(
    (x) =>
      x.type === `com.google.appinventor.components.runtime.${componentType}`,
  );
  if (descriptor !== undefined) {
    return descriptor;
  }

  // Then check extensions
  for (const extension of project.extensions) {
    if (extension.name.split(".").pop() === componentType) {
      return extension.descriptorJSON;
    }
  }

  return null;
}
