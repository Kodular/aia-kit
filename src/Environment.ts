import type { ExtensionDescriptorJson } from "./types.js";
import { type ComponentDescriptor, type ComponentDescriptors, ComponentDescriptorsSchema } from "./validators/component-descriptor.js";

export class Environment {
  constructor(
    public readonly name: string,
    public readonly componentDescriptors: ComponentDescriptors,
  ) { }

  isComponentSupported(componentName: string): boolean {
    return this.componentDescriptors.some(
      (comp) => comp.name === componentName,
    );
  }

  getComponentDescriptor(componentType: string): ComponentDescriptor | null {
    return (
      this.componentDescriptors.find((comp) => comp.type === componentType) ??
      null
    );
  }

  cloneWithExtensions(extensions: ExtensionDescriptorJson[]): Environment {
    const extendedComponents = [...this.componentDescriptors];

    for (const extension of extensions) {
      extendedComponents.push(extension);
    }

    return new Environment(this.name, extendedComponents);
  }

  static async kodularCreator(): Promise<Environment> {
    const environmentName = "Kodular Creator";
    const simpleComponentsJSON = (
      await import("./environments/kodular-creator/simple_components.json", {
        with: { type: "json" },
      })
    ).default;

    // Validate the JSON structure using Zod
    const validationResult = await ComponentDescriptorsSchema.safeParseAsync(simpleComponentsJSON);
    if (!validationResult.success) {
      throw new Error(
        `Invalid component descriptor JSON for ${environmentName}: ${validationResult.error.message}`
      );
    }

    return new Environment(environmentName, validationResult.data);
  }

  static async mitAppInventor(): Promise<Environment> {
    const environmentName = "MIT App Inventor";
    const simpleComponentsJSON = (
      await import("./environments/mit-app-inventor/simple_components.json", {
        with: { type: "json" },
      })
    ).default;

    // Validate the JSON structure using Zod
    const validationResult = await ComponentDescriptorsSchema.safeParseAsync(simpleComponentsJSON);
    if (!validationResult.success) {
      throw new Error(
        `Invalid component descriptor JSON for ${environmentName}: ${validationResult.error.message}`
      );
    }

    return new Environment(environmentName, validationResult.data);
  }
}
