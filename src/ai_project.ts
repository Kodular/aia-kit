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

import {AIScreen} from "./ai_screen.js";
import {AIExtension} from "./ai_extension.js";
import {AIAsset} from "./ai_asset.js";

/**
 * Class that describes an App Inventor project.
 *
 * @since  1.0.0
 * @access public
 */
export class AIProject {
    /**
     * Name of the project this class represents.
     * @since  1.0.0
     * @type   {String}
     */
    name: string;
    properties: { [key: string]: string };
    /**
     * Array of Screen objects this project contains.
     * @since  1.0.0
     * @type   {Array<AIScreen>}
     */
    screens: AIScreen[];
    /**
     * Array of extensions used by this project.
     * @since  1.0.0
     * @type   {Array}
     */
    extensions: AIExtension[];
    /**
     * Array of AIAsset objects this project contains.
     * @since  1.0.0
     * @type   {Array}
     */
    assets: AIAsset[];

    /**
     * Creates a new AIProject object with the given name.
     *
     * @since 1.0.0
     * @access public
     *
     * @class
     * @param {String} name Name of the project.
     *
     * @return {AIProject} New AIProject object.
     */
    constructor(name: string) {
        this.name = name;
        this.properties = {}
        this.screens = [];
        this.extensions = [];
        this.assets = [];
    }

    static from(properties: typeof AIProject.prototype.properties) {
        const project = new AIProject(properties.name ?? 'Unnamed Project');
        project.properties = properties;
        return project;
    }

    /**
     * Adds a single asset to this project's array of assets.
     *
     * @since 1.0.0
     * @access public
     *
     * @param {AIAsset} asset Asset object.
     */
    addAsset(asset: AIAsset) {
        this.assets.push(asset);
    }

    /**
     * Adds a single screen to this project's array of screens.
     *
     * @since 1.0.0
     * @access public
     *
     * @param {AIScreen} screen Screen object.
     */
    addScreen(screen: AIScreen) {
        if (screen.name === 'Screen1') {
            this.screens.unshift(screen);
        } else {
            this.screens.push(screen);
        }
    }

    /**
     * Adds a single extension to this project's array of extensions.
     *
     * @since 1.0.0
     * @access public
     *
     * @param {AIExtension} extension Extension object.
     */
    addExtension(extension: AIExtension) {
        this.extensions.push(extension);
    }
}
