import { ParseError } from "../errors.ts";
import { simpleName } from "../internal/names.ts";
import type {
  BlockPropertyDescriptor,
  ComponentDescriptor,
  EventDescriptor,
  JsonValue,
  MethodDescriptor,
  ParamDescriptor,
  PropertyDescriptor,
} from "../types.ts";

/**
 * Parses component descriptor JSON: the content of `simple_components.json`,
 * or an extension's `components.json` / `component.json` (array or single object).
 * @throws {ParseError} if an entry is not a component descriptor.
 */
export function parseComponentDescriptors(json: unknown): ComponentDescriptor[] {
  return (Array.isArray(json) ? json : [json]).map(toDescriptor);
}

function toDescriptor(raw: unknown): ComponentDescriptor {
  if (!isRecord(raw) || typeof raw["type"] !== "string" || raw["type"] === "") {
    throw new ParseError("descriptor", "Component descriptor has no `type`");
  }
  const type = raw["type"];
  const minSdk = Number(raw["androidMinSdk"]);
  return {
    type,
    name: str(raw["name"]) || simpleName(type),
    external: bool(raw["external"]),
    version: Number(raw["version"]) || 1,
    category: str(raw["categoryString"]),
    helpString: str(raw["helpString"]),
    showOnPalette: bool(raw["showOnPalette"], true),
    nonVisible: bool(raw["nonVisible"]),
    iconName: str(raw["iconName"]),
    ...(Number.isFinite(minSdk) && minSdk > 0 && { androidMinSdk: minSdk }),
    properties: list(raw["properties"]).map((p): PropertyDescriptor => ({
      name: str(p["name"]),
      editorType: str(p["editorType"]),
      defaultValue: str(p["defaultValue"]),
      editorArgs: Array.isArray(p["editorArgs"]) ? (p["editorArgs"] as JsonValue[]) : [],
    })),
    blockProperties: list(raw["blockProperties"]).map((p): BlockPropertyDescriptor => ({
      name: str(p["name"]),
      description: str(p["description"]),
      type: str(p["type"]),
      access: access(p["rw"]),
      deprecated: bool(p["deprecated"]),
    })),
    events: list(raw["events"]).map(toEvent),
    methods: list(raw["methods"]).map((m): MethodDescriptor => ({
      ...toEvent(m),
      ...(typeof m["returnType"] === "string" && { returnType: m["returnType"] }),
    })),
  };
}

function toEvent(raw: Record<string, unknown>): EventDescriptor {
  return {
    name: str(raw["name"]),
    description: str(raw["description"]),
    deprecated: bool(raw["deprecated"]),
    params: list(raw["params"]).map((p): ParamDescriptor => ({
      name: str(p["name"]),
      type: str(p["type"]),
    })),
  };
}

function access(value: unknown): BlockPropertyDescriptor["access"] {
  return value === "read-only" || value === "write-only" || value === "invisible"
    ? value
    : "read-write";
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function list(value: unknown): Record<string, unknown>[] {
  return Array.isArray(value) ? value.filter(isRecord) : [];
}

function str(value: unknown): string {
  return typeof value === "string" ? value : "";
}

/** Descriptor JSON encodes booleans as the strings "true" / "false". */
function bool(value: unknown, fallback = false): boolean {
  if (typeof value === "boolean") return value;
  if (typeof value === "string") return value.toLowerCase() === "true";
  return fallback;
}
