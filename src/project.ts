/**
 * Defines classes used to manage App Inventor project data.
 *
 * Contains several classes that together represent an AI project. Each AI
 * project consists of screens, extensions, and assets. Each Screen in a project
 * is represented by its Form, child components, and blocks. Extensions are
 * simple objects containing their names and descriptions.
 * Together, these classes fully describe the content of an AIA file.
 *
 * @file   This file defines the AIProject, AIScreen, Component, AIExtension,
 *         AIAsset, and BlocklyWorkspace classes.
 * @author vishwas@kodular.io (Vishwas Adiga)
 * @since  1.0.0
 * @license
 */

import type { Asset } from "./asset.js";
import type { Environment } from "./Environment.js";
import type { Extension } from "./extension.js";
import type { Screen } from "./screen.js";

/**
 * Class that describes an App Inventor project.
 */
export class Project {
  /**
   * Name of the project this class represents.
   */
  name: string;
  properties: { [key: string]: string };
  /**
   * Array of Screen objects this project contains.
   */
  screens: Screen[];
  /**
   * Array of extensions used by this project.
   */
  extensions: Extension[];
  /**
   * Array of AIAsset objects this project contains.
   */
  assets: Asset[];

  environment: Environment;

  /**
   * Creates a new AIProject object with the given name.
   *
   * @param name Name of the project.
   * @return New AIProject object.
   */
  constructor(name: string, environment: Environment) {
    this.name = name;
    this.properties = {};
    this.screens = [];
    this.extensions = [];
    this.assets = [];
    this.environment = environment;
  }

  static from(properties: typeof Project.prototype.properties, environment: Environment): Project {
    const project = new Project(properties.name ?? "Unnamed Project", environment);
    project.properties = properties;
    return project;
  }

  /**
   * Adds a single asset to this project's array of assets.
   *
   * @param asset Asset object.
   */
  addAsset(asset: Asset) {
    this.assets.push(asset);
  }

  /**
   * Adds a single screen to this project's array of screens.
   *
   * @param screen Screen object.
   */
  addScreen(screen: Screen) {
    if (screen.name === "Screen1") {
      this.screens.unshift(screen);
    } else {
      this.screens.push(screen);
    }
  }

  /**
   * Adds a single extension to this project's array of extensions.
   *
   * @param extension Extension object.
   */
  addExtension(extension: Extension) {
    this.extensions.push(extension);
  }
}
