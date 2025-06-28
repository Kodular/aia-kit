import type { ExtensionDescriptorJson } from "./types.js";

/**
 * Class that describes an extension.
 */
export class Extension {
  name: string;
  descriptorJSON: Record<string, any>;

  /**
   * Creates a new AIExtension object.
   *
   * @class
   * @param name              The full package name of this extension.
   * @param descriptorJSON    The custom JSON used to load the properties
   *                                   of any instances of this extension.
   *
   * @return New Extension object.
   */
  constructor(name: string, descriptorJSON: ExtensionDescriptorJson) {
    /**
     * Package name of this extension (eg: com.google.SearchBoxExtension).
     */
    this.name = name;

    /**
     * Custom descriptor JSON used by components to populate their list of
     * properties
     */
    this.descriptorJSON = descriptorJSON;
  }
}
