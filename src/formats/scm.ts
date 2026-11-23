import { ParseError } from "../errors.ts";
import { deepFreeze } from "../internal/freeze.ts";
import type { Component, JsonValue } from "../types.ts";

/** The content of a `.scm` file. */
export interface ScmDocument {
  readonly form: Component;
  /** Header fields other than the component tree: `authURL`, `YaVersion`, `Source`. */
  readonly meta: Readonly<Record<string, JsonValue>>;
}

const WRAPPER = /^\s*#\|\s*\$JSON\s*([\s\S]*?)\s*\|#\s*$/;

/** Original text of documents produced by `parseScm`, so untouched screens write back byte-for-byte. */
const sources = new WeakMap<Component, { text: string; meta: ScmDocument["meta"] }>();

/**
 * Parses a `.scm` file.
 * @throws {ParseError} if the text is not a valid SCM document.
 */
export function parseScm(text: string): ScmDocument {
  const match = WRAPPER.exec(text);
  if (!match) throw new ParseError("scm", "SCM is missing its `#| $JSON … |#` wrapper");

  let json: unknown;
  try {
    json = JSON.parse(match[1] ?? "");
  } catch (cause) {
    throw new ParseError("scm", "SCM does not contain valid JSON", { cause });
  }
  if (!isRecord(json) || !isRecord(json["Properties"])) {
    throw new ParseError("scm", "SCM has no `Properties` object");
  }

  const { Properties, ...meta } = json;
  const doc = deepFreeze({ form: toComponent(Properties), meta: meta as ScmDocument["meta"] });
  sources.set(doc.form, { text, meta: doc.meta });
  return doc;
}

/** Serializes a `.scm` file. A document that was parsed and not changed yields its original text. */
export function serializeScm(doc: ScmDocument): string {
  const source = sources.get(doc.form);
  if (source && source.meta === doc.meta) return source.text;
  return `#|\n$JSON\n${JSON.stringify({ ...doc.meta, Properties: fromComponent(doc.form) })}\n|#`;
}

function toComponent(raw: unknown): Component {
  if (!isRecord(raw)) throw new ParseError("scm", "SCM component is not an object");
  const name = raw["$Name"];
  const type = raw["$Type"];
  if (typeof name !== "string" || typeof type !== "string") {
    throw new ParseError("scm", "SCM component is missing `$Name` or `$Type`");
  }

  const properties: Record<string, string> = {};
  const extra: Record<string, JsonValue> = {};
  let version: string | undefined;
  let uuid = "";
  let children: Component[] = [];

  for (const [key, value] of Object.entries(raw)) {
    if (key === "$Name" || key === "$Type") continue;
    if (key === "$Components" && Array.isArray(value)) children = value.map(toComponent);
    else if (key === "$Version" && isScalar(value)) version = String(value);
    else if (key === "Uuid" && isScalar(value)) uuid = String(value);
    else if (typeof value === "string" && !key.startsWith("$")) properties[key] = value;
    else extra[key] = value as JsonValue;
  }

  return {
    name,
    type,
    ...(version !== undefined && { version }),
    uuid,
    properties,
    children,
    ...(Object.keys(extra).length > 0 && { extra }),
  };
}

function fromComponent(component: Component): Record<string, JsonValue> {
  return {
    $Name: component.name,
    $Type: component.type,
    ...(component.version !== undefined && { $Version: component.version }),
    ...(component.uuid !== "" && { Uuid: component.uuid }),
    ...component.properties,
    ...component.extra,
    ...(component.children.length > 0 && { $Components: component.children.map(fromComponent) }),
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isScalar(value: unknown): value is string | number {
  return typeof value === "string" || typeof value === "number";
}
