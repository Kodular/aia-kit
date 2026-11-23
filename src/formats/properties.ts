import { ParseError } from "../errors.ts";
import { deepFreeze } from "../internal/freeze.ts";
import { packageOf, simpleName } from "../internal/names.ts";
import type { ProjectProperties } from "../types.ts";

type Known = Exclude<keyof ProjectProperties, "extra">;

/** File key → model field, in the order App Inventor writes them. */
const KEYS: readonly (readonly [
  key: string,
  field: Known,
  kind: "string" | "number" | "boolean",
])[] = [
  ["main", "main", "string"],
  ["name", "name", "string"],
  ["versioncode", "versionCode", "number"],
  ["versionname", "versionName", "string"],
  ["useslocation", "usesLocation", "boolean"],
  ["aname", "appName", "string"],
  ["icon", "icon", "string"],
  ["sizing", "sizing", "string"],
  ["showlistsasjson", "showListsAsJson", "boolean"],
  ["actionbar", "actionBar", "boolean"],
  ["theme", "theme", "string"],
  ["color.primary", "primaryColor", "string"],
  ["color.primary.dark", "primaryColorDark", "string"],
  ["color.accent", "accentColor", "string"],
  ["defaultfilescope", "defaultFileScope", "string"],
];

/** Keys that App Inventor writes right after `name`. */
const PATH_KEYS = ["assets", "source", "build"];

const sources = new WeakMap<ProjectProperties, string>();

/**
 * Parses `project.properties`.
 * @throws {ParseError} if there is no `main` entry.
 */
export function parseProperties(text: string): ProjectProperties {
  const raw = parseJavaProperties(text);
  const main = raw.get("main");
  if (!main) throw new ParseError("properties", "project.properties has no `main` entry");

  const known: Partial<Record<Known, string | number | boolean>> = {};
  for (const [key, field, kind] of KEYS) {
    const value = raw.get(key);
    if (value === undefined) continue;
    if (kind === "string") known[field] = value;
    else if (kind === "boolean" && /^(true|false)$/i.test(value))
      known[field] = /^true$/i.test(value);
    else if (kind === "number" && /^-?\d+$/.test(value)) known[field] = Number(value);
    else continue; // Unparseable: leave it in `extra` so it is not lost.
    raw.delete(key);
  }

  const properties = deepFreeze({
    name: simpleName(packageOf(main)) || simpleName(main),
    ...known,
    main,
    extra: Object.fromEntries(raw),
  } as ProjectProperties);
  sources.set(properties, text);
  return properties;
}

/** Serializes `project.properties`. Unchanged parsed properties yield their original text. */
export function serializeProperties(properties: ProjectProperties): string {
  const source = sources.get(properties);
  if (source !== undefined) return source;

  const lines: string[] = [];
  const push = (key: string, value: string) =>
    lines.push(`${escape(key, true)}=${escape(value, false)}`);
  const extra = { ...properties.extra };

  for (const [key, field] of KEYS) {
    const value = properties[field];
    if (value === undefined) continue;
    push(key, typeof value === "boolean" ? (value ? "True" : "False") : String(value));
    if (key !== "name") continue;
    for (const pathKey of PATH_KEYS) {
      if (extra[pathKey] !== undefined) push(pathKey, extra[pathKey]);
      delete extra[pathKey];
    }
  }
  for (const [key, value] of Object.entries(extra)) push(key, value);
  return `${lines.join("\n")}\n`;
}

/** Minimal reader for the Java `.properties` format. */
function parseJavaProperties(text: string): Map<string, string> {
  const result = new Map<string, string>();
  const physical = text.split(/\r\n|\r|\n/);

  for (let i = 0; i < physical.length; i++) {
    let line = (physical[i] ?? "").replace(/^[ \t\f]+/, "");
    if (line === "" || line.startsWith("#") || line.startsWith("!")) continue;
    while (endsWithOddBackslashes(line) && i + 1 < physical.length) {
      i += 1;
      line = line.slice(0, -1) + (physical[i] ?? "").replace(/^[ \t\f]+/, "");
    }

    let end = 0;
    while (end < line.length && !/[=: \t\f]/.test(line[end] ?? ""))
      end += line[end] === "\\" ? 2 : 1;
    const rest = line.slice(end).replace(/^[ \t\f]*[=:]?[ \t\f]*/, "");
    result.set(unescape(line.slice(0, end)), unescape(rest));
  }
  return result;
}

function endsWithOddBackslashes(line: string): boolean {
  const trailing = /\\+$/.exec(line);
  return trailing !== null && trailing[0].length % 2 === 1;
}

const ESCAPES: Readonly<Record<string, string>> = { t: "\t", n: "\n", r: "\r", f: "\f" };

function unescape(text: string): string {
  return text.replace(/\\(u[0-9a-fA-F]{4}|.)/gs, (_, seq: string) =>
    seq.length === 5
      ? String.fromCharCode(Number.parseInt(seq.slice(1), 16))
      : (ESCAPES[seq] ?? seq),
  );
}

function escape(text: string, isKey: boolean): string {
  return text.replace(/[\\\t\n\r\f=:#!]|^ | |[^\x20-\x7e]/g, (ch, offset: number) => {
    if (ch === " ") return isKey || offset === 0 ? "\\ " : " ";
    if (ch === "\t") return "\\t";
    if (ch === "\n") return "\\n";
    if (ch === "\r") return "\\r";
    if (ch === "\f") return "\\f";
    if (ch.charCodeAt(0) > 0x7e || ch.charCodeAt(0) < 0x20) {
      return `\\u${ch.charCodeAt(0).toString(16).toUpperCase().padStart(4, "0")}`;
    }
    return `\\${ch}`;
  });
}
