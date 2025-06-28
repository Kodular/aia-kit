import { Component } from "./component.js";
import simpleComponentsJson from "./environments/kodular/simple_components.json" with {
  type: "json",
};
import type { ComponentJson, ScmJson } from "./types.js";

/**
 * Class that describes a screen in an App Inventor project.
 */
export class Screen {
  name: string;
  form: Component;
  blocks: string;

  constructor(name: string, form: Component, blocks: string) {
    this.name = name;
    this.form = form;
    this.blocks = blocks;
  }

  /**
   * Creates a new AIScreen object asynchronously.
   *
   * Asynchronously creating this object, as opposed to using a constructor, lets
   * us generate all screens in a project simultaneously. This greatly reduces
   * the overall load time of the page, especially in case of large AIAs, as the
   * @see AIAReader::read function will not have to wait for the components of
   * this screen to load before starting with the next.
   *
   * @param scm     The scheme data for this screen as fetched from the AIA.
   * @param blk     The stringified Blockly XML for this screen as fetched from the AIA.
   * @param name    The name of this screen.
   * @return New AIScreen object.
   */
  static async init(name: string, scm: string, blk: string): Promise<Screen> {
    const form = await Screen.generateSchemeData(scm);

    return new Screen(name, form, blk);
  }

  /**
   * Takes the raw scheme input from the AIA, parses it as a JSON array, and then
   * generates all the component and property objects for this screen.
   *
   * @param scmJSON The raw scheme text fetched from the .scm file of the AIA.
   * @return The Form component of this screen.
   */
  static async generateSchemeData(scmJSON: string): Promise<Component> {
    const componentsJSON = JSON.parse(scmJSON.slice(9, -3)) as ScmJson;
    return Screen.buildComponentTree(componentsJSON.Properties);
  }

  /**
   * Takes the JSON description of a component and asynchronously
   * creates a new @see Component class representing it. Also recursively calls
   * itself for every child of this component.
   *
   * @param componentJSON The JSON object describing this component.
   * @return An object representing this component's properties and children.
   */
  static async buildComponentTree(
    componentJSON: ComponentJson,
  ): Promise<Component> {
    // Check if the component is an instance of an extension.
    const extType = simpleComponentsJson.find(
      (x) => x.name.split(".").pop() === componentJSON.$Type,
    );

    // If it is an extension, give it a custom descriptor JSON object that will
    // be used to generate its properties.
    // If it's not an extension, no JSON will be provided and the service's
    // simple_components.json file will be used instead.
    const origin = extType === undefined ? "EXTENSION" : "BUILT-IN";

    const component = new Component(
      componentJSON.$Name,
      componentJSON.$Type,
      componentJSON.Uuid, //Screens do not have a Uuid property.
      origin,
    );

    component.properties = await component.loadProperties(
      componentJSON,
      extType as any,
    );

    for (const childComponent of componentJSON.$Components || []) {
      component.addChild(await Screen.buildComponentTree(childComponent));
    }
    return component;
  }
}
