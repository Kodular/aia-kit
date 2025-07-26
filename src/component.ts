import type { Environment } from "./Environment.js";
import type { ComponentJson } from "./types.js";
import { resolveProperties } from "./utils/property-processor.js";

export type ComponentProperty = {
  name: string;
  value: string;
  editorType: string;
}

type ComponentOrigin = "BUILT-IN" | "EXTENSION";

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
  private origin: ComponentOrigin;
  visible: boolean;
  /**
   * Array of property name-value pairs of this component. Properties are loaded
   * asynchronously in AIScreen::generateComponent.
   */
  properties: ComponentProperty[];
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
  constructor(name: string, type: string, uid: string, origin: ComponentOrigin) {
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
   * type in the environment's component descriptors to the properties saved in the AIA. 
   * This lets us generate the full list of properties for this component.
   *
   * @param properties  JSON array describing the properties of this
   *                    component that have a non-default value.
   * @param environment The environment containing component descriptors.
   *
   * @return A Promise object, that when resolved, yields the complete
   *                   array of properties of this component.
   */
  loadProperties(
    properties: ComponentJson,
    environment: Environment,
  ): { name: string; value: string; editorType?: string }[] {
    try {
      const descriptor = environment.getComponentDescriptor(this.type);

      if (!descriptor) {
        throw new Error(`Component descriptor not found for type: ${this.type}`);
      }

      this.visible = descriptor.nonVisible === "false";

      return resolveProperties(descriptor, properties);
    } catch (_error: unknown) {
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
