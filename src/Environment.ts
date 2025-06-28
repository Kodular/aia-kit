import type {
  ComponentDescriptorJson,
  ExtensionDescriptorJson,
} from "./types.js";

export class Environment {
  constructor(
    public readonly name: string,
    public readonly componentDescriptors: ComponentDescriptorJson[],
  ) {}

  isComponentSupported(componentName: string): boolean {
    return this.componentDescriptors.some(
      (comp) => comp.name === componentName,
    );
  }

  getComponentDescriptor(
    componentName: string,
  ): ComponentDescriptorJson | null {
    return (
      this.componentDescriptors.find((comp) => comp.name === componentName) ||
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
    const simpleComponentsJSON = (
      await import("./environments/kodular/simple_components.json", {
        with: { type: "json" },
      })
    ).default;
    // TODO: Use Zod to validate the JSON structure
    return new Environment(
      "Kodular Creator",
      simpleComponentsJSON as ComponentDescriptorJson[],
    );
  }
}
