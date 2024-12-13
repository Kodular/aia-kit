import type { ExtensionDescriptorJson } from "./types.js";

/**
 * Class that describes an extension.
 *
 * @since  1.0.0
 * @access public
 */
export class Extension {
    name: string;
    descriptorJSON: Record<string, any>;

    /**
     * Creates a new AIExtension object.
     *
     * @since 1.0.0
     * @access public
     *
     * @class
     * @param {String} name              The full package name of this extension.
     * @param {String} descriptorJSON    The custom JSON used to load the properties
     *                                   of any instances of this extension.
     *
     * @return {Extension} New AIExtension object.
     */
    constructor(name: string, descriptorJSON: ExtensionDescriptorJson) {

        /**
         * Package name of this extension (eg: com.google.SearchBoxExtension).
         * @since  1.0.0
         * @type   {String}
         */
        this.name = name;

        /**
         * Custom descriptor JSON used by components to populate their list of
         * properties
         * @since  1.0.0
         * @type   {Object}
         */
        this.descriptorJSON = descriptorJSON;
    }
}
