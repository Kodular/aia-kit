import type { ComponentProperty } from "../component.js";
import type { ComponentDescriptor } from "../validators/component-descriptor.js";
import type { RawComponent } from "../validators/scm.js";

export function resolveProperties(
  componentDescriptor: ComponentDescriptor,
  propertyJSON: RawComponent,
): ComponentProperty[] {
  return componentDescriptor.properties.map(property => {
    // If the property is defined in the JSON, use its value.
    // Otherwise, use the default value defined in the descriptor.

    const propertyName = property.name;
    const propertyValue = propertyJSON[propertyName] as any ?? property.defaultValue;

    return {
      name: propertyName,
      value: propertyValue,
      editorType: property.editorType,
    };
  });
}
