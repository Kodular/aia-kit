import { componentReference, type Block } from "aia-kit";

export type Category =
  | "event"
  | "setter"
  | "getter"
  | "method"
  | "control"
  | "logic"
  | "math"
  | "text"
  | "lists"
  | "dictionaries"
  | "colors"
  | "variables"
  | "procedures"
  | "other";

/** Colours follow App Inventor's block palette. */
export const CATEGORY_CLASS: Readonly<Record<Category, string>> = {
  event: "bg-amber-100 text-amber-950 dark:bg-amber-900/50 dark:text-amber-100",
  setter: "bg-emerald-100 text-emerald-950 dark:bg-emerald-900/50 dark:text-emerald-100",
  getter: "bg-lime-100 text-lime-950 dark:bg-lime-900/40 dark:text-lime-100",
  method: "bg-violet-100 text-violet-950 dark:bg-violet-900/50 dark:text-violet-100",
  control: "bg-yellow-100 text-yellow-950 dark:bg-yellow-900/40 dark:text-yellow-100",
  logic: "bg-green-100 text-green-950 dark:bg-green-900/50 dark:text-green-100",
  math: "bg-blue-100 text-blue-950 dark:bg-blue-900/50 dark:text-blue-100",
  text: "bg-pink-100 text-pink-950 dark:bg-pink-900/50 dark:text-pink-100",
  lists: "bg-sky-100 text-sky-950 dark:bg-sky-900/50 dark:text-sky-100",
  dictionaries: "bg-indigo-100 text-indigo-950 dark:bg-indigo-900/50 dark:text-indigo-100",
  colors: "bg-zinc-200 text-zinc-900 dark:bg-zinc-700 dark:text-zinc-100",
  variables: "bg-orange-100 text-orange-950 dark:bg-orange-900/50 dark:text-orange-100",
  procedures: "bg-purple-100 text-purple-950 dark:bg-purple-900/50 dark:text-purple-100",
  other: "bg-zinc-100 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-200",
};

const PREFIX_CATEGORY: readonly (readonly [string, Category])[] = [
  ["controls_", "control"],
  ["logic_", "logic"],
  ["math_", "math"],
  ["text", "text"],
  ["lists_", "lists"],
  ["dictionaries_", "dictionaries"],
  ["color_", "colors"],
  ["global_", "variables"],
  ["lexical_", "variables"],
  ["local_", "variables"],
  ["procedures_", "procedures"],
];

export function categoryOf(block: Block): Category {
  const ref = componentReference(block);
  if (ref?.kind === "event") return "event";
  if (ref?.kind === "method") return "method";
  if (ref?.kind === "property") return ref.access === "set" ? "setter" : "getter";
  if (ref) return "getter";
  return PREFIX_CATEGORY.find(([prefix]) => block.type.startsWith(prefix))?.[1] ?? "other";
}

const OPERATORS: Readonly<Record<string, string>> = {
  math_add: "+",
  math_subtract: "−",
  math_multiply: "×",
  math_division: "÷",
  math_power: "^",
  EQ: "=",
  NEQ: "≠",
  LT: "<",
  LTE: "≤",
  GT: ">",
  GTE: "≥",
  AND: "and",
  OR: "or",
};

/**
 * The symbol of a block that reads best between its inputs (`a + b`,
 * `x = y`, `p and q`), or `undefined` for every other block.
 */
export function operatorOf(block: Block): string | undefined {
  if (
    block.type === "math_compare" ||
    block.type === "logic_compare" ||
    block.type === "logic_operation"
  ) {
    return OPERATORS[block.fields["OP"] ?? ""];
  }
  return OPERATORS[block.type];
}

/** A one-line, human-readable description of what a block does. */
export function labelOf(block: Block): string {
  const f = block.fields;
  const ref = componentReference(block);
  if (ref) {
    const target = ref.instance ?? `any ${ref.componentType}`;
    if (ref.kind === "event") return `when ${target}.${ref.member ?? "?"}`;
    if (ref.kind === "method") return `call ${target}.${ref.member ?? "?"}`;
    if (ref.kind === "property") {
      return ref.access === "set"
        ? `set ${target}.${ref.member ?? "?"} to`
        : `${target}.${ref.member ?? "?"}`;
    }
    return target;
  }

  const vars = Object.entries(f)
    .filter(([name]) => /^VAR\d*$/.test(name))
    .map(([, value]) => value);

  switch (block.type) {
    case "text":
      return JSON.stringify(f["TEXT"] ?? "");
    case "math_number":
      return f["NUM"] ?? "0";
    case "logic_boolean":
      return (f["BOOL"] ?? "").toLowerCase();
    case "global_declaration":
      return `initialize global ${f["NAME"] ?? "?"} to`;
    case "lexical_variable_get":
      return `get ${f["VAR"] ?? "?"}`;
    case "lexical_variable_set":
      return `set ${f["VAR"] ?? "?"} to`;
    case "local_declaration_statement":
    case "local_declaration_expression":
      return `initialize local ${vars.join(", ")}`;
    case "procedures_defnoreturn":
    case "procedures_defreturn":
      return `to ${f["NAME"] ?? "?"}(${vars.join(", ")})`;
    case "procedures_callnoreturn":
    case "procedures_callreturn":
      return `call ${f["PROCNAME"] ?? block.mutation["name"] ?? "?"}`;
    case "controls_if":
      return "if";
    case "controls_forEach":
      return `for each ${f["VAR"] ?? "item"} in list`;
    case "controls_forRange":
      return `for each ${f["VAR"] ?? "number"} from`;
    case "controls_while":
      return "while";
    case "math_compare":
    case "logic_compare":
    case "logic_operation":
      return OPERATORS[f["OP"] ?? ""] ?? f["OP"] ?? block.type;
  }

  const operator = OPERATORS[block.type];
  if (operator) return operator;
  if (block.type.startsWith("color_")) return `color ${block.type.slice(6).replaceAll("_", " ")}`;

  const name = block.type
    .replace(/^controls_/, "")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replaceAll("_", " ")
    .toLowerCase();
  const extras = Object.entries(f)
    .filter(([key]) => key !== "COMPONENT_SELECTOR")
    .map(([, value]) => value);
  return extras.length > 0 ? `${name} · ${extras.join(", ")}` : name;
}

/** A block and everything attached below it. */
export function stackOf(block: Block): Block[] {
  const blocks: Block[] = [];
  for (let current: Block | undefined = block; current; current = current.next)
    blocks.push(current);
  return blocks;
}

export type Group = "events" | "procedures" | "globals" | "loose";

export function groupOf(block: Block): Group {
  if (block.type === "component_event") return "events";
  if (block.type.startsWith("procedures_def")) return "procedures";
  if (block.type === "global_declaration") return "globals";
  return "loose";
}
