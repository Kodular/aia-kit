import type { ComponentDescriptor } from "./validators/component-descriptor.js";

/**
 * Class that describes an extension.
 */
export class Extension {
  /**
   * Package name of this extension (eg: com.google.SearchBoxExtension).
   */
  name: string;
  /**
   * Custom descriptor JSON used by components to populate their list of
   * properties
   */
  descriptorJSON: ComponentDescriptor;

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
  constructor(name: string, descriptorJSON: ComponentDescriptor) {
    this.name = name;
    this.descriptorJSON = descriptorJSON;
  }
}
