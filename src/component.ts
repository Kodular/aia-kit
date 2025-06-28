import simpleComponentsJson from "./environments/kodular/simple_components.json" with {
  type: "json",
};
import { process_properties } from "./property_processor.js";
import type { ComponentJson, ExtensionDescriptorJson } from "./types.js";

/**
 * Class that describes a component with its properties and children.
 */
export class Component {
  /**
   * Name of this component. It is unique and set by the user.
   */
  name: string;
  /**
   * Internal class name of this component, as defined by the name of the Java
   * file it is declared in.
   */
  type: string;
  /**
   * Unique identifier for this component. Is internal and hidden from the user.
   * Form components have a UID of 0.
   */
  uid: string;
  /**
   * Array of Component objects that represents the children of this component.
   */
  children: Component[];
  /**
   * Origin of this component. Used in @see SummaryWriter::generateNativeShare
   * to make summary charts of component usage.
   */
  private origin: string;
  visible: boolean;
  /**
   * Array of property name-value pairs of this component. Properties are loaded
   * asynchronously in AIScreen::generateComponent.
   */
  properties: { name: string; value: string; editorType?: string }[];
  /**
   * Flag which indicates whether there was a problem parsing this component's
   * properties. @see Component::loadProperties
   */
  private faulty: boolean;

  /**
   * Creates a new Component object.
   *
   * @class
   * @param name    The user-facing name of this component.
   * @param type    The internal class name of this component.
   * @param uid     The unique ID attached to this component.
   * @param origin 'EXTENSION' if this component is the instance of an
   *                         extension, 'BUILT-IN' otherwise.
   *
   * @return New Component object.
   */
  constructor(name: string, type: string, uid: string, origin: string) {
    this.name = name;
    this.type = type;
    this.uid = uid;
    this.children = [];
    this.origin = origin;
    this.visible = true;
    this.properties = [];
    this.faulty = false;
  }

  /**
   * Generates an array of name-value pair objects describing this compoent's
   * properties.
   *
   * AIA files only store properties of a component that are not the default
   * value. Therefore, we have to map the properties defined for this component
   * type in the simple_components.json file (or custom descriptor JSON for
   * extensions) to the properties saved in the AIA. This lets us generate the
   * full list of properties for this component.
   *
   * @param properties           JSON array describing the properties of this
   *                                     component that have a non-default value.
   * @param customDescriptorJSON The full list of properties and their
   *                                     default values for this component.
   *
   * @return A Promise object, that when resolved, yields the complete
   *                   array of properties of this component.
   */
  async loadProperties(
    properties: ComponentJson,
    customDescriptorJSON: ExtensionDescriptorJson,
  ): Promise<{ name: string; value: string; editorType?: string }[]> {
    // It is not ideal to load the properties of all components in the UI thread
    // of the page, as it may cause users to see the kill page dialog when
    // loading large projects.
    // Instead, we use several web workers to do the job simultaneously in
    // separate threads and then return the complete array of properties.
    try {
      const descriptor =
        customDescriptorJSON ||
        simpleComponentsJson.find(
          (x) =>
            x.type === `com.google.appinventor.components.runtime.${this.type}`,
        );

      this.visible = descriptor.nonVisible === "false";

      return process_properties(properties, descriptor.properties);
    } catch (error: unknown) {
      // If the descriptor JSON object for this component does not exist in
      // AIProject.descriptorJSON, it means either the component has been
      // removed from the service, or that the user is trying to load an AIA
      // that was developed using a different service.
      // In either case, we continue to parse the rest of the components that
      // can be parsed, and add a "faulty" flag to the component.
      // This flag will later be used in @see node.js::ComponentNode to show the
      // user a visual indicator stating there was an error parsing the component.
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      console.log(
        `Error in ${this.name}(${this.uid} / ${this.type}), message: ${errorMessage}`,
        customDescriptorJSON,
      );
      this.faulty = true;
      return [];
    }
  }

  /**
   * Adds a child component to this component.
   *
   * @param component The child component to be added.
   */
  addChild(component: Component) {
    this.children.push(component);
  }
}
