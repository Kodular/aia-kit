/**
 * How App Inventor's designer properties translate to CSS. The preview is
 * drawn on a nominal 320 × 520 screen, the size the designer itself uses, so
 * pixel values map one to one.
 */
import type { Component } from "aia-kit";
import { cssColor, simpleName } from "./format.ts";

export const SCREEN = { width: 320, height: 520 } as const;

export type Style = Record<string, string | undefined>;

export type Size =
  | { readonly kind: "auto" }
  | { readonly kind: "fill" }
  | { readonly kind: "px"; readonly px: number };

/**
 * A `Width` / `Height` value: `-1` automatic, `-2` fill parent, a positive
 * number of pixels, or `-1000 - n` for n percent of the screen.
 */
export function parseSize(value: string | undefined, screenExtent: number): Size {
  const n = Number(value);
  if (value === undefined || value === "" || !Number.isFinite(n) || n === -1)
    return { kind: "auto" };
  if (n === -2) return { kind: "fill" };
  if (n <= -1000) return { kind: "px", px: Math.round(((-n - 1000) / 100) * screenExtent) };
  return n >= 0 ? { kind: "px", px: n } : { kind: "auto" };
}

/** What a component sits in, which decides how "fill parent" is expressed. */
export type Parent = "row" | "column" | "table" | "canvas";

/** Width and height of a component inside the given kind of parent. */
export function sizeStyle(component: Component, parent: Parent): Style {
  const width = parseSize(component.properties["Width"], SCREEN.width);
  const height = parseSize(component.properties["Height"], SCREEN.height);
  const style: Style = {};

  if (width.kind === "px") style["width"] = `${width.px}px`;
  else if (width.kind === "fill") {
    if (parent === "row") Object.assign(style, { flex: "1 1 0", "min-width": "0" });
    else if (parent === "column") style["align-self"] = "stretch";
    else style["width"] = "100%";
  }

  if (height.kind === "px") style["height"] = `${height.px}px`;
  else if (height.kind === "fill") {
    if (parent === "column") Object.assign(style, { flex: "1 1 0", "min-height": "0" });
    else if (parent === "row") style["align-self"] = "stretch";
    else style["height"] = "100%";
  }

  // A fixed size must not be squeezed by its flex siblings.
  if (width.kind === "px" || height.kind === "px") style["flex-shrink"] = "0";
  return style;
}

const HORIZONTAL: Readonly<Record<string, string>> = {
  "1": "flex-start",
  "2": "flex-end",
  "3": "center",
};
const VERTICAL: Readonly<Record<string, string>> = {
  "1": "flex-start",
  "2": "center",
  "3": "flex-end",
};

/** `AlignHorizontal` / `AlignVertical` of a form or arrangement, as flexbox alignment. */
export function alignmentStyle(component: Component, direction: "row" | "column"): Style {
  const horizontal = HORIZONTAL[component.properties["AlignHorizontal"] ?? "1"] ?? "flex-start";
  const vertical = VERTICAL[component.properties["AlignVertical"] ?? "1"] ?? "flex-start";
  return direction === "row"
    ? { "justify-content": horizontal, "align-items": vertical }
    : { "justify-content": vertical, "align-items": horizontal };
}

/** A table arrangement's grid, and where a child sits in it. */
export function tableStyle(table: Component): Style {
  const columns = Math.max(1, Number(table.properties["Columns"] ?? 2) || 2);
  const rows = Math.max(1, Number(table.properties["Rows"] ?? 2) || 2);
  return {
    "grid-template-columns": `repeat(${columns}, auto)`,
    "grid-template-rows": `repeat(${rows}, auto)`,
  };
}

export function cellStyle(child: Component): Style {
  return {
    "grid-column": String((Number(child.properties["Column"]) || 0) + 1),
    "grid-row": String((Number(child.properties["Row"]) || 0) + 1),
  };
}

const TEXT_ALIGN: Readonly<Record<string, string>> = { "0": "left", "1": "center", "2": "right" };

/** Font and colours of a text-bearing component. `defaultAlign` differs: labels left, buttons centre. */
export function textStyle(component: Component, defaultAlign: "left" | "center"): Style {
  const p = component.properties;
  const size = Number(p["FontSize"]);
  return {
    "font-size": `${Number.isFinite(size) && size > 0 ? size : 14}px`,
    "line-height": "1.3",
    "font-weight": p["FontBold"] === "True" ? "700" : undefined,
    "font-style": p["FontItalic"] === "True" ? "italic" : undefined,
    "text-align": TEXT_ALIGN[p["TextAlignment"] ?? ""] ?? defaultAlign,
    color: cssColor(p["TextColor"] ?? ""),
    "background-color": cssColor(p["BackgroundColor"] ?? ""),
  };
}

/** Button `Shape`: 0 default, 1 rounded, 2 rectangular, 3 oval. */
export function shapeRadius(component: Component): string {
  return { "1": "12px", "2": "0", "3": "9999px" }[component.properties["Shape"] ?? ""] ?? "4px";
}

export type Kind =
  | "row"
  | "column"
  | "table"
  | "canvas"
  | "sprite"
  | "ball"
  | "button"
  | "label"
  | "input"
  | "image"
  | "check"
  | "switch"
  | "slider"
  | "list"
  | "spinner"
  | "other";

const KINDS: Readonly<Record<string, Kind>> = {
  TableArrangement: "table",
  Canvas: "canvas",
  ImageSprite: "sprite",
  Ball: "ball",
  Button: "button",
  Label: "label",
  Image: "image",
  CheckBox: "check",
  Switch: "switch",
  Slider: "slider",
  ListView: "list",
  Spinner: "spinner",
};

/** Which drawing a component gets in the preview. */
export function kindOf(component: Component): Kind {
  const type = simpleName(component.type);
  const known = KINDS[type];
  if (known) return known;
  if (type.includes("Arrangement")) return type.startsWith("Horizontal") ? "row" : "column";
  if (type.endsWith("Picker")) return "button";
  if (type.endsWith("TextBox")) return "input";
  return "other";
}

/** The parent kind a container gives its children. */
export function asParent(kind: Kind): Parent {
  if (kind === "row" || kind === "table" || kind === "canvas") return kind;
  return "column";
}
