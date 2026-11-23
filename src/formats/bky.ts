import { DOMParser, type Element as DomElement, type Node as DomNode } from "@xmldom/xmldom";
import { ParseError } from "../errors.ts";
import { deepFreeze } from "../internal/freeze.ts";
import type { Block, BlockComment, BlocksMeta, XmlElement } from "../types.ts";

/** The content of a `.bky` file. */
export interface BkyDocument {
  readonly blocks: readonly Block[];
  readonly meta: BlocksMeta;
}

const ELEMENT_NODE = 1;
const TEXT_NODE = 3;
const CDATA_NODE = 4;

const sources = new WeakMap<readonly Block[], { text: string; meta: BlocksMeta }>();

/**
 * Parses a `.bky` file. An empty file is an empty workspace.
 * @throws {ParseError} if the text is not a Blockly workspace.
 */
export function parseBky(text: string): BkyDocument {
  const doc = deepFreeze(text.trim() === "" ? { blocks: [], meta: {} } : parseWorkspace(text));
  sources.set(doc.blocks, { text, meta: doc.meta });
  return doc;
}

/** Serializes a `.bky` file. A document that was parsed and not changed yields its original text. */
export function serializeBky(doc: BkyDocument): string {
  const source = sources.get(doc.blocks);
  if (source && source.meta === doc.meta) return source.text;

  const { xmlns, versions, extra = [] } = doc.meta;
  return element(
    "xml",
    xmlns === undefined ? {} : { xmlns },
    doc.blocks.map((block) => blockToXml(block)).join("") +
      extra.map(xmlToText).join("") +
      (versions ? element("yacodeblocks", versions, "") : ""),
  );
}

// ── Parsing ─────────────────────────────────────────────────────────────────

function parseWorkspace(text: string): BkyDocument {
  let root: DomElement | null;
  try {
    const errors: string[] = [];
    const dom = new DOMParser({
      onError: (level, message) => {
        if (level !== "warning") errors.push(message);
      },
    }).parseFromString(text, "text/xml");
    if (errors.length > 0) throw new Error(errors[0]);
    root = dom.documentElement;
  } catch (cause) {
    throw new ParseError("bky", "BKY is not well-formed XML", { cause });
  }
  if (!root || root.localName !== "xml") {
    throw new ParseError("bky", "BKY has no <xml> root element");
  }

  const blocks: Block[] = [];
  const extra: XmlElement[] = [];
  let versions: Record<string, string> | undefined;
  const xmlns = root.getAttribute("xmlns");

  for (const child of elements(root)) {
    if (child.localName === "block") blocks.push(toBlock(child));
    else if (child.localName === "yacodeblocks") versions = attributes(child, xmlns);
    else extra.push(toXml(child, xmlns));
  }

  return {
    blocks,
    meta: {
      ...(xmlns !== null && { xmlns }),
      ...(versions && { versions }),
      ...(extra.length > 0 && { extra }),
    },
  };
}

function toBlock(el: DomElement): Block {
  const fields: Record<string, string> = {};
  const values: Record<string, Block> = {};
  const statements: Record<string, Block> = {};
  const extraChildren: XmlElement[] = [];
  let mutation: Record<string, string> = {};
  let mutationChildren: XmlElement[] = [];
  let next: Block | undefined;
  let comment: BlockComment | undefined;

  for (const child of elements(el)) {
    const name = child.getAttribute("name") ?? "";
    const inner = elements(child).find((c) => c.localName === "block" || c.localName === "shadow");
    switch (child.localName) {
      case "field":
      case "title": // pre-2014 name for <field>
        fields[name] = child.textContent ?? "";
        break;
      case "value":
        if (inner) values[name] = toBlock(inner);
        break;
      case "statement":
        if (inner) statements[name] = toBlock(inner);
        break;
      case "next":
        if (inner) next = toBlock(inner);
        break;
      case "mutation":
        mutation = attributes(child);
        mutationChildren = elements(child).map((c) => toXml(c));
        break;
      case "comment":
        comment = { text: child.textContent ?? "", attributes: attributes(child) };
        break;
      default:
        extraChildren.push(toXml(child));
    }
  }

  const {
    type = "",
    id = "",
    x,
    y,
    disabled,
    collapsed,
    inline,
    ...extraAttributes
  } = attributes(el);
  return {
    type,
    id,
    fields,
    mutation,
    ...(mutationChildren.length > 0 && { mutationChildren }),
    values,
    statements,
    ...(next && { next }),
    ...(x !== undefined && { x: Number(x) }),
    ...(y !== undefined && { y: Number(y) }),
    ...(disabled !== undefined && { disabled: disabled === "true" }),
    ...(collapsed !== undefined && { collapsed: collapsed === "true" }),
    ...(inline !== undefined && { inline: inline === "true" }),
    ...(el.localName === "shadow" && { shadow: true }),
    ...(comment && { comment }),
    ...(Object.keys(extraAttributes).length > 0 && { extraAttributes }),
    ...(extraChildren.length > 0 && { extraChildren }),
  };
}

function toXml(el: DomElement, inheritedXmlns?: string | null): XmlElement {
  const children: (XmlElement | string)[] = [];
  for (const node of childNodes(el)) {
    if (node.nodeType === ELEMENT_NODE) children.push(toXml(node as DomElement));
    else if (node.nodeType === TEXT_NODE || node.nodeType === CDATA_NODE) {
      const text = node.nodeValue ?? "";
      if (text.trim() !== "") children.push(text);
    }
  }
  return { tag: el.tagName, attributes: attributes(el, inheritedXmlns), children };
}

/** Attributes of an element; drops an `xmlns` that only repeats the parent's. */
function attributes(el: DomElement, inheritedXmlns?: string | null): Record<string, string> {
  const result: Record<string, string> = {};
  for (let i = 0; i < el.attributes.length; i++) {
    const attr = el.attributes.item(i);
    if (!attr || (attr.name === "xmlns" && attr.value === inheritedXmlns)) continue;
    result[attr.name] = attr.value;
  }
  return result;
}

function childNodes(el: DomElement): DomNode[] {
  const nodes: DomNode[] = [];
  for (let node = el.firstChild; node; node = node.nextSibling) nodes.push(node);
  return nodes;
}

function elements(el: DomElement): DomElement[] {
  return childNodes(el).filter((node) => node.nodeType === ELEMENT_NODE) as DomElement[];
}

// ── Serializing ─────────────────────────────────────────────────────────────

function blockToXml(block: Block): string {
  const attrs: Record<string, string> = { type: block.type };
  if (block.id !== "") attrs["id"] = block.id;
  if (block.inline !== undefined) attrs["inline"] = String(block.inline);
  if (block.collapsed !== undefined) attrs["collapsed"] = String(block.collapsed);
  if (block.disabled !== undefined) attrs["disabled"] = String(block.disabled);
  if (block.x !== undefined) attrs["x"] = String(block.x);
  if (block.y !== undefined) attrs["y"] = String(block.y);
  Object.assign(attrs, block.extraAttributes);

  const hasMutation =
    Object.keys(block.mutation).length > 0 || block.mutationChildren !== undefined;
  const named = (tag: string, inputs: Readonly<Record<string, Block>>) =>
    Object.entries(inputs)
      .map(([name, inner]) => element(tag, { name }, blockToXml(inner)))
      .join("");

  return element(
    block.shadow ? "shadow" : "block",
    attrs,
    (hasMutation
      ? element("mutation", block.mutation, (block.mutationChildren ?? []).map(xmlToText).join(""))
      : "") +
      Object.entries(block.fields)
        .map(([name, text]) => element("field", { name }, escapeText(text)))
        .join("") +
      (block.comment
        ? element("comment", block.comment.attributes, escapeText(block.comment.text))
        : "") +
      (block.extraChildren ?? []).map(xmlToText).join("") +
      named("value", block.values) +
      named("statement", block.statements) +
      (block.next ? element("next", {}, blockToXml(block.next)) : ""),
  );
}

function xmlToText(node: XmlElement | string): string {
  if (typeof node === "string") return escapeText(node);
  return element(node.tag, node.attributes, node.children.map(xmlToText).join(""));
}

function element(tag: string, attrs: Readonly<Record<string, string>>, body: string): string {
  const attrText = Object.entries(attrs)
    .map(([name, value]) => ` ${name}="${escapeText(value).replaceAll('"', "&quot;")}"`)
    .join("");
  return `<${tag}${attrText}>${body}</${tag}>`;
}

function escapeText(text: string): string {
  return text.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
}
