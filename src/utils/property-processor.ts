import type { ComponentProperty } from "../component.js";
import type { ComponentDescriptorJson, ComponentJson } from "../types.js";

export function resolveProperties(
  componentDescriptor: ComponentDescriptorJson,
  propertyJSON: ComponentJson,
): ComponentProperty[] {
  return componentDescriptor.properties.map(property => {
    // If the property is defined in the JSON, use its value.
    // Otherwise, use the default value defined in the descriptor.

    const propertyName = property.name;
    const propertyValue = propertyJSON[propertyName] ?? property.defaultValue;

    return {
      name: propertyName,
      value: propertyValue,
      editorType: property.editorType,
    };
  });
}
