const INDENT_UNIT = "  ";

/** Scheme double-quoted string: escape `\`, `"`, and newlines (as `\n`). */
export function escapeSchemeString(s: string): string {
  return s
    .replace(/\\/g, "\\\\")
    .replace(/"/g, '\\"')
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .replace(/\n/g, "\\n");
}

const NUMBER_LITERAL =
  /^[+-]?(?:0|[1-9]\d*)(?:\.\d+)?(?:[eE][+-]?\d+)?$|^[+-]?\.\d+(?:[eE][+-]?\d+)?$/;

function isValidNumberLiteral(value: string): boolean {
  const t = value.trim();
  if (t === "" || t === "+" || t === "-") return false;
  if (!NUMBER_LITERAL.test(t)) return false;
  const n = Number(t);
  return Number.isFinite(n);
}

function emitBooleanLiteral(value: string): string | null {
  const v = value.trim().toLowerCase();
  if (v === "true" || v === "#t") return "#t";
  if (v === "false" || v === "#f") return "#f";
  return null;
}

/**
 * Emit a YAIL/Scheme literal suitable for `set-and-coerce-property!` value positions.
 * Invalid numeric/boolean strings fall back to quoted text.
 */
export function emitLiteral(
  value: string,
  kind: "text" | "number" | "boolean",
): string {
  if (kind === "text") {
    return `"${escapeSchemeString(value)}"`;
  }
  if (kind === "boolean") {
    const b = emitBooleanLiteral(value);
    if (b !== null) return b;
    return `"${escapeSchemeString(value)}"`;
  }
  if (isValidNumberLiteral(value)) {
    return value.trim();
  }
  return `"${escapeSchemeString(value)}"`;
}

/** Join lines with `indent` levels of leading spaces (2 spaces per level). */
export function lines(parts: string[], indent: number): string {
  const pad = INDENT_UNIT.repeat(Math.max(0, indent));
  return parts.map((line) => pad + line).join("\n");
}
