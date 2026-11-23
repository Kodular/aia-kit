export type Language = "json" | "xml" | "text";

export type TokenKind =
  | "plain"
  | "key"
  | "string"
  | "number"
  | "keyword"
  | "punctuation"
  | "tag"
  | "attribute"
  | "comment";

export interface Token {
  readonly text: string;
  readonly kind: TokenKind;
}

export function languageOf(fileName: string): Language {
  const extension = fileName.slice(fileName.lastIndexOf(".") + 1).toLowerCase();
  if (extension === "json" || extension === "scm") return "json";
  if (["xml", "bky", "html", "htm", "svg"].includes(extension)) return "xml";
  return "text";
}

export function tokenize(text: string, language: Language): Token[] {
  if (language === "json") return tokenizeJson(text);
  if (language === "xml") return tokenizeXml(text);
  return [{ text, kind: "plain" }];
}

/** Runs `pattern` over `text`, classifying each match and passing the gaps through as plain text. */
function scan(
  text: string,
  pattern: RegExp,
  classify: (match: RegExpExecArray) => Token[],
): Token[] {
  const tokens: Token[] = [];
  let last = 0;
  for (const match of text.matchAll(pattern)) {
    if (match.index > last) tokens.push({ text: text.slice(last, match.index), kind: "plain" });
    tokens.push(...classify(match));
    last = match.index + match[0].length;
  }
  if (last < text.length) tokens.push({ text: text.slice(last), kind: "plain" });
  return tokens;
}

const JSON_TOKEN =
  /("(?:\\.|[^"\\])*")(\s*:)?|\b(?:true|false|null)\b|-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?|[{}[\],:]/g;

function tokenizeJson(text: string): Token[] {
  return scan(text, JSON_TOKEN, (match) => {
    const [whole, string, colon] = match;
    if (string !== undefined) {
      const tokens: Token[] = [{ text: string, kind: colon === undefined ? "string" : "key" }];
      if (colon !== undefined) tokens.push({ text: colon, kind: "punctuation" });
      return tokens;
    }
    if (/^[{}[\],:]$/.test(whole)) return [{ text: whole, kind: "punctuation" }];
    return [{ text: whole, kind: /^[tfn]/.test(whole) ? "keyword" : "number" }];
  });
}

const XML_MARKUP = /<!--[\s\S]*?-->|<[^<>]+>/g;
const XML_INSIDE_TAG = /^(<[/?!]?)([^\s/>]+)|([^\s=/>]+)(\s*=\s*)("[^"]*"|'[^']*')|[/?]?>$/g;

function tokenizeXml(text: string): Token[] {
  return scan(text, XML_MARKUP, ([markup]) => {
    if (markup.startsWith("<!--")) return [{ text: markup, kind: "comment" }];
    return scan(markup, XML_INSIDE_TAG, (match) => {
      const [whole, open, name, attribute, equals, value] = match;
      if (open !== undefined && name !== undefined) {
        return [
          { text: open, kind: "punctuation" },
          { text: name, kind: "tag" },
        ];
      }
      if (attribute !== undefined && equals !== undefined && value !== undefined) {
        return [
          { text: attribute, kind: "attribute" },
          { text: equals, kind: "punctuation" },
          { text: value, kind: "string" },
        ];
      }
      return [{ text: whole, kind: "punctuation" }];
    });
  });
}

/**
 * Indents XML that was written on one line, so it can be read. Only whitespace
 * between a closing `>` and the next `<` is added; text content is untouched.
 */
export function indentXml(text: string): string {
  if (text.includes("\n") || !text.includes("><")) return text;
  let depth = 0;
  return text
    .replaceAll("><", ">\n<")
    .split("\n")
    .map((line) => {
      const closes = line.startsWith("</");
      if (closes) depth = Math.max(0, depth - 1);
      const indented = "  ".repeat(depth) + line;
      // A line opens a level when it starts an element it does not also finish.
      if (
        !closes &&
        !line.startsWith("<?") &&
        !line.startsWith("<!") &&
        !line.endsWith("/>") &&
        !line.includes("</")
      ) {
        depth += 1;
      }
      return indented;
    })
    .join("\n");
}

/** Splits a token stream into lines; a token that spans a newline is cut in two. */
export function splitLines(tokens: readonly Token[]): Token[][] {
  const lines: Token[][] = [[]];
  for (const token of tokens) {
    const parts = token.text.split("\n");
    parts.forEach((part, index) => {
      if (index > 0) lines.push([]);
      if (part !== "") lines.at(-1)?.push({ text: part, kind: token.kind });
    });
  }
  return lines;
}

/**
 * Fold ranges by indentation. `ends[i]` is the last line hidden when line `i`
 * is folded (every following line indented deeper than `i`), or -1 if line `i`
 * has nothing to fold.
 */
export function foldEnds(lines: readonly (readonly Token[])[]): number[] {
  const indents = lines.map((line) => {
    const text = line.map((token) => token.text).join("");
    return text.trim() === "" ? -1 : text.length - text.trimStart().length;
  });
  return indents.map((indent, i) => {
    if (indent === -1) return -1;
    let end = i;
    for (let j = i + 1; j < indents.length; j++) {
      const next = indents[j] ?? -1;
      if (next === -1) continue; // blank lines belong to whichever block surrounds them
      if (next <= indent) break;
      end = j;
    }
    return end > i ? end : -1;
  });
}
