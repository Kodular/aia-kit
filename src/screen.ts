import { Component } from "./component.js";
import YailGenerator from "./generators/yail/YailGenerator.js";
import { BkyParser } from "./parsers/BkyParser.js";
import ScmParser from "./parsers/ScmParser.js";
import type { Project } from "./project.js";
import { resolveProperties } from "./utils/property-processor.js";
import { getPackageName } from "./utils/utils.js";
import { ScmJsonSchema, type RawComponent } from "./validators/scm.js";

export type ScreenFile = {
  type: "scm" | "bky" | "yail";
  name: string;
  content: string;
}

/**
 * Class that describes a screen in an App Inventor project.
 */
export class Screen {
  name: string;
  form: Component;
  bkyContent: string;
  private scmContent: string;
  private yailContent: string | null;
  project: Project;

  constructor(project: Project, name: string, form: Component, bkyContent: string, scmContent: string, yailContent: string | null) {
    this.name = name;
    this.form = form;
    this.bkyContent = bkyContent;
    this.scmContent = scmContent;
    this.yailContent = yailContent;
    this.project = project;
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
   * @param name    The name of this screen.
   * @param scm     The scheme data for this screen as fetched from the AIA.
   * @param blk     The stringified Blockly XML for this screen as fetched from the AIA.
   * @param project The project this screen belongs to.
   * @return New AIScreen object.
   */
  static init(project: Project, scm: ScreenFile, blk: ScreenFile, yail?: ScreenFile): Screen {
    const form = Screen.generateSchemeData(scm.content, project);

    return new Screen(project, scm.name, form, blk.content, scm.content, yail?.content ?? null);
  }

  /**
   * Takes the raw scheme input from the AIA, parses it as a JSON array, and then
   * generates all the component and property objects for this screen.
   *
   * @param scmJSON The raw scheme text fetched from the .scm file of the AIA.
   * @param project The project this screen belongs to.
   * @return The Form component of this screen.
   */
  static generateSchemeData(scmJSON: string, project: Project): Component {
    const jsonString = scmJSON.slice(9, -3); // Remove the "#|\n$JSON" prefix and "|#" suffix
    const componentsJSON = ScmJsonSchema.parse(JSON.parse(jsonString));
    return Screen.buildComponentTree(componentsJSON.Properties, project);
  }

  /**
   * Takes the JSON description of a component and asynchronously
   * creates a new @see Component class representing it. Also recursively calls
   * itself for every child of this component.
   *
   * @param componentJSON The JSON object describing this component.
   * @param project The project this component belongs to.
   * @return An object representing this component's properties and children.
   */
  static buildComponentTree(
    componentJSON: RawComponent,
    project: Project,
  ): Component {
    const componentName = componentJSON.$Name;
    const componentType = componentJSON.$Type;
    const componentId = componentJSON.Uuid || ''; // Screens do not have a Uuid property.

    const componentDescriptor = project.environment.getComponentDescriptor(componentType);

    if (!componentDescriptor) {
      throw new Error(`Component descriptor for type "${componentType}" not found.`);
    }

    const component = new Component(
      componentName,
      componentType,
      componentId,
      "BUILT-IN", // TODO: Figure out how to detect extension components
    );

    component.properties = resolveProperties(
      componentDescriptor,
      componentJSON
    );

    for (const childComponent of componentJSON.$Components || []) {
      component.addChild(Screen.buildComponentTree(childComponent, project));
    }
    return component;
  }

  /**
   * Generates YAIL code for this screen.
   * 
   * @returns The generated YAIL code as a string.
   */
  generateYail(): string {
    const scmParser = ScmParser.parse(this.scmContent);
    const bkyParser = BkyParser.parse(this.bkyContent);
    const componentMetadata = this.project.getComponentMetadata();

    const packageName = getPackageName(this.project.properties.main);
    if (!packageName) {
      throw new Error('Package name not found in project properties. Cannot generate YAIL without a valid package name.');
    }

    const yailGenerator = new YailGenerator(scmParser, bkyParser, componentMetadata, packageName);
    return yailGenerator.generate();
  }

  getOrGenerateYail(): string {
    if (this.yailContent) {
      return this.yailContent;
    }
    return this.generateYail();
  }
}
