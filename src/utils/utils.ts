import {Entry} from "@zip.js/zip.js";
import simpleComponentsJson from '../simple_components.json'
import {getTextFileContent} from "./zipjs.js";
import {getProperties} from "properties-file";

/**
 * Convert the color in &HAARRGGBB format to #RRGGBBAA format
 * @param color
 */
export function parseAiColor(color: string) {
    return '#' + color.substring(4, 10) + color.substring(2, 4);
}

export function parseAiBoolean(bool: string) {
    return bool === 'True'
}

export function getFileInfo(file: Entry): [string, string] {
    // return name and type
    const a = file.filename.lastIndexOf('/')
    const b = file.filename.lastIndexOf('.')
    return [file.filename.substring(a + 1, b), file.filename.substring(b + 1)]
}

export async function readProjectProperties(file: Entry) {
    const content = await getTextFileContent(file);

    return getProperties(content)
}


export function getDescriptor(componentType: string) {
    let descriptor = simpleComponentsJson.find(x => x.type === 'com.google.appinventor.components.runtime.' + componentType);
    if (descriptor !== undefined) {
        return descriptor;
    }
    // for (let extension of AIProject.extensions) {
    //     if (extension.name.split('.').pop() === componentType) {
    //         return extension.descriptorJSON;
    //     }
    // }
    return null
}
