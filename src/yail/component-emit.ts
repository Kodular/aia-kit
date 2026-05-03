import type { ComponentPropertyDescriptor } from '#/component-descriptor/descriptors.js'
import type { ComponentProperty, ModelComponent } from '#/model/types.js'
import { emitLiteral, lines } from "./emit.js";

type Coercion = "text" | "number" | "boolean";

/**
 * Maps designer metadata to YAIL coercion tags (`'text` | `'number` | `'boolean`).
 *
 * Mapping table (MVP):
 *
 * | Source | `'number` | `'boolean` | `'text` (default, includes colors) |
 * |--------|-----------|-------------|-----------------------------------|
 * | ComponentPropertyDescriptor.editorType | integer, float, non_negative_integer, non_negative_float, latitude, longitude, unit_coordinate, … | boolean | string, text, textArea, color, asset, visibility, enums, unknown |
 * | ComponentPropertyDescriptor.propertyType | number, floating-point … | boolean | absent / string / component / other |
 * | blockProperties[].type | number | boolean | text, Any, component, … |
 *
 * **`color` designer values:** Often `&H` + hex digits (Android `ARGB`) — keep as Scheme strings and coerce with **`'text`** (safest MVP; runtime parses hex).
 */
export function emitComponentSection(
  screenName: string,
  form: ModelComponent,
): string {
  const chunks: string[] = [];
  chunks.push(emitFormRoot(screenName, form));
  for (const child of form.children) {
    chunks.push(emitDescendant(child, form.name, 0));
  }
  return chunks.join("\n\n");
}

function emitFormRoot(screenName: string, form: ModelComponent): string {
  const parts: string[] = [];
  parts.push(lines([`;;; ${screenName}`], 0));
  parts.push(lines(["(do-after-form-creation"], 0));
  for (const p of form.properties) {
    parts.push(lines([emitPropertySet(form.name, p, form)], 1));
  }
  parts.push(lines([")"], 0));
  return parts.join("\n");
}

function emitDescendant(
  component: ModelComponent,
  parentSymbol: string,
  indent: number,
): string {
  const parts: string[] = [];
  parts.push(lines([`;;; ${component.name}`], indent));
  parts.push(
    lines(
      [
        `(add-component ${parentSymbol} ${component.descriptor.type} ${component.name}`,
      ],
      indent,
    ),
  );
  const innerIndent = indent + 1;
  for (const p of component.properties) {
    parts.push(
      lines([emitPropertySet(component.name, p, component)], innerIndent),
    );
  }
  for (const ch of component.children) {
    parts.push(emitDescendant(ch, component.name, innerIndent));
  }
  parts.push(lines([")"], indent));
  return parts.join("\n");
}

function emitPropertySet(
  componentName: string,
  prop: ComponentProperty,
  host: ModelComponent,
): string {
  const { coercion, literalKind } = deriveCoercionAndLiteralKind(prop, host);
  const valueExpr = emitLiteral(prop.value, literalKind);
  return `(set-and-coerce-property! '${componentName} '${prop.name} ${valueExpr} '${coercion})`;
}

function deriveCoercionAndLiteralKind(
  prop: ComponentProperty,
  host: ModelComponent,
): { coercion: Coercion; literalKind: "text" | "number" | "boolean" } {
  const c = deriveCoercion(prop, host);
  return { coercion: c, literalKind: c };
}

function deriveCoercion(
  prop: ComponentProperty,
  host: ModelComponent,
): Coercion {
  if (prop.descriptor) {
    const fromDesc = coercionFromDescriptor(prop.descriptor);
    if (fromDesc) return fromDesc;
  }
  const blockHint = host.descriptor.blockProperties.find(
    (b) => b.name === prop.name,
  );
  if (blockHint) return coercionFromBlockPropertyType(blockHint.type);
  return "text";
}

function coercionFromDescriptor(
  desc: ComponentPropertyDescriptor,
): Coercion | null {
  const t0 = desc.editorType.toLowerCase();

  /** Designer `color` + block `number` disagree for `&H…` SCM strings — coerce as text (MVP). */
  if (t0 === "color") return "text";

  const fromPt = coercionFromPropertyTypeString(desc.propertyType);
  if (fromPt) return fromPt;

  if (t0 === "boolean") return "boolean";

  if (
    t0 === "integer" ||
    t0 === "float" ||
    t0 === "non_negative_integer" ||
    t0 === "non_negative_float" ||
    t0 === "latitude" ||
    t0 === "longitude" ||
    t0 === "unit_coordinate" ||
    t0.endsWith("_integer") ||
    t0.endsWith("_float") ||
    t0.includes("percent") ||
    t0 === "accelerometer_sensitivity"
  ) {
    return "number";
  }

  return null;
}

function coercionFromPropertyTypeString(
  pt: string | undefined,
): Coercion | null {
  if (!pt) return null;
  const s = pt.toLowerCase();
  if (s === "number" || s === "floating-point" || s === "integer")
    return "number";
  if (s === "boolean") return "boolean";
  return null;
}

function coercionFromBlockPropertyType(type: string): Coercion {
  const s = type.toLowerCase();
  if (s === "number") return "number";
  if (s === "boolean") return "boolean";
  return "text";
}
