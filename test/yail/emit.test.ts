import { describe, expect, it } from "vitest";
import { emitLiteral, escapeSchemeString, lines } from "#/yail/emit.js";

describe("escapeSchemeString", () => {
  it("escapes backslash", () => {
    expect(escapeSchemeString("a\\b")).toBe("a\\\\b");
    expect(escapeSchemeString("\\")).toBe("\\\\");
  });

  it("escapes double quote", () => {
    expect(escapeSchemeString('say "hi"')).toBe('say \\"hi\\"');
  });

  it("escapes newlines as \\n", () => {
    expect(escapeSchemeString("a\nb")).toBe("a\\nb");
  });

  it("normalizes CRLF and lone CR to \\n", () => {
    expect(escapeSchemeString("a\r\nb")).toBe("a\\nb");
    expect(escapeSchemeString("a\rb")).toBe("a\\nb");
  });

  it("combines quotes, literal newlines, and backslashes", () => {
    expect(escapeSchemeString('"\n\\')).toBe('\\"\\n\\\\');
  });

  it("leaves simple text unchanged", () => {
    expect(escapeSchemeString("hello")).toBe("hello");
  });
});

describe("emitLiteral", () => {
  it("quotes text and escapes edge characters", () => {
    expect(emitLiteral('a"b\\c', "text")).toBe('"a\\"b\\\\c"');
    expect(emitLiteral("x\ny", "text")).toBe('"x\\ny"');
  });

  it("emits unquoted numbers when valid", () => {
    expect(emitLiteral("42", "number")).toBe("42");
    expect(emitLiteral("-3.14", "number")).toBe("-3.14");
    expect(emitLiteral("1e-6", "number")).toBe("1e-6");
    expect(emitLiteral(" .5 ", "number")).toBe(".5");
  });

  it("falls back to quoted text for invalid numbers", () => {
    expect(emitLiteral("12abc", "number")).toBe('"12abc"');
    expect(emitLiteral("", "number")).toBe('""');
  });

  it("emits #t/#f for booleans", () => {
    expect(emitLiteral("true", "boolean")).toBe("#t");
    expect(emitLiteral("false", "boolean")).toBe("#f");
    expect(emitLiteral("TRUE", "boolean")).toBe("#t");
    expect(emitLiteral("#t", "boolean")).toBe("#t");
  });

  it("falls back to quoted text for unknown boolean strings", () => {
    expect(emitLiteral("maybe", "boolean")).toBe('"maybe"');
  });
});

describe("lines", () => {
  it("joins with no indent", () => {
    expect(lines(["a", "b"], 0)).toBe("a\nb");
  });

  it("indents each line by 2 spaces per level", () => {
    expect(lines(["(foo)", "(bar)"], 1)).toBe("  (foo)\n  (bar)");
    expect(lines(["x"], 2)).toBe("    x");
  });

  it("treats negative indent as 0", () => {
    expect(lines(["z"], -1)).toBe("z");
  });
});
