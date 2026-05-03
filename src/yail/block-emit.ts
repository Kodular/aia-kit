import type { BlockAst, BlockNode } from "#/bky/ast.js";
import type { BuiltinBlockRegistry } from '#/environment/builtin-blocks.js'
import { isEventHandlerBlock } from "#/utils/block-types.js";
import { emitLiteral, lines } from "./emit.js";

/**
 * Depth-first walk over `values`, `statements`, and `next` (same shape as
 * `forEachBlock` in `src/analysis/cross-cutting.ts`).
 */
export function forEachBlock(
  node: BlockNode | null,
  visit: (n: BlockNode) => void,
): void {
  if (!node) return;
  visit(node);
  for (const child of Object.values(node.values)) {
    forEachBlock(child, visit);
  }
  for (const child of Object.values(node.statements)) {
    forEachBlock(child, visit);
  }
  forEachBlock(node.next, visit);
}

/** Align with `isHatBlock` in cross-cutting.ts, plus `component_event` (event hat). */
export function isEventHat(node: BlockNode): boolean {
  return node.type === "component_event" || isEventHandlerBlock(node.type);
}

function unsupportedBlockLine(block: BlockNode): string {
  return `;;; aia-kit: unsupported block ${block.type} id=${block.id}`;
}

function isExpressionLeaf(n: BlockNode): boolean {
  return (
    n.type === "math_number" || n.type === "text" || n.type === "logic_boolean"
  );
}

function emitLeafExpression(n: BlockNode): string {
  if (n.type === "math_number") {
    const raw =
      n.fields.NUMERIC_VALUE ??
      n.fields.NUM ??
      Object.values(n.fields).find((v) => v.trim() !== "") ??
      "0";
    return emitLiteral(raw, "number");
  }
  if (n.type === "text") {
    const raw = n.fields.TEXT ?? "";
    return emitLiteral(raw, "text");
  }
  if (n.type === "logic_boolean") {
    const raw =
      n.fields.BOOL ?? n.fields.TOOLTIP ?? Object.values(n.fields)[0] ?? "";
    return emitLiteral(raw, "boolean");
  }
  return emitLiteral("", "text");
}

/**
 * Statement stack: walk `next` at each level; for each node emit a leaf literal
 * or an unsupported line, then recurse into `values` (tree) and nested
 * `statements` (chains).
 */
function emitStatementChain(head: BlockNode | null): string[] {
  const acc: string[] = [];
  for (let cur: BlockNode | null = head; cur; cur = cur.next) {
    acc.push(...emitNodeInChain(cur));
  }
  return acc;
}

function emitNodeInChain(n: BlockNode): string[] {
  if (isExpressionLeaf(n)) return [emitLeafExpression(n)];
  const acc: string[] = [unsupportedBlockLine(n)];
  for (const v of Object.values(n.values)) {
    if (v) acc.push(...emitValueTree(v));
  }
  for (const s of Object.values(n.statements)) {
    if (s) acc.push(...emitStatementChain(s));
  }
  return acc;
}

function emitValueTree(n: BlockNode | null): string[] {
  if (!n) return [];
  if (isExpressionLeaf(n)) return [emitLeafExpression(n)];
  const acc: string[] = [unsupportedBlockLine(n)];
  for (const v of Object.values(n.values)) {
    if (v) acc.push(...emitValueTree(v));
  }
  for (const s of Object.values(n.statements)) {
    if (s) acc.push(...emitStatementChain(s));
  }
  return acc;
}

function procedureBodyEntry(block: BlockNode): BlockNode | null {
  return block.statements.STACK ?? block.statements.DO ?? null;
}

/**
 * MVP `global_declaration`: emit `(define-variable '<name> #f)` as an
 * init stub (real binding semantics are platform/runtime-specific).
 */
function emitGlobalDeclaration(block: BlockNode): string {
  const name = (block.fields.NAME ?? "").trim();
  if (!name) {
    return unsupportedBlockLine(block);
  }
  return `(define-variable '${name} #f)`;
}

function emitProcedure(block: BlockNode): string {
  const name = (block.fields.NAME ?? "").trim() || "anonymous_procedure";
  const innerRaw: string[] = [];

  if (block.type === "procedures_defreturn" && block.values.RETURN) {
    innerRaw.push(...emitValueTree(block.values.RETURN));
  }

  const stackRoot = procedureBodyEntry(block);
  innerRaw.push(...emitStatementChain(stackRoot));

  if (innerRaw.length === 0) {
    return `(define (${name})\n)`;
  }
  const inner = lines(innerRaw, 1);
  return [`(define (${name})`, inner, ")"].join("\n");
}

function emitEventHat(block: BlockNode): string {
  const instance = block.mutation.instance_name?.trim() || "???";
  const eventName = block.mutation.event_name?.trim() || "???";
  const bodyRoot = block.statements.DO ?? block.statements.STACK ?? null;
  const innerRaw = emitStatementChain(bodyRoot);
  const head = `(define-event ${instance} ${eventName} ()`;
  if (innerRaw.length === 0) {
    return `${head}\n)`;
  }
  const inner = lines(innerRaw, 1);
  return [head, inner, ")"].join("\n");
}

/**
 * Emit YAIL-ish text for all top-level Blockly blocks: **events**, then
 * **procedures**, then **globals**, then **unsupported** top-level blocks
 * (each group keeps source order). Intended to follow the component section
 * when concatenating full-screen YAIL.
 */
export function emitBlockSection(ast: BlockAst, blockRegistry: BuiltinBlockRegistry): string {
  const events: string[] = [];
  const procedures: string[] = [];
  const globals: string[] = [];
  const unsupportedTop: string[] = [];

  for (const b of ast.blocks) {
    if (isEventHat(b)) {
      events.push(emitEventHat(b));
    } else if (blockRegistry.lookup(b.type)?.category === 'procedures') {
      procedures.push(emitProcedure(b));
    } else if (b.type === "global_declaration") {
      globals.push(emitGlobalDeclaration(b));
    } else {
      const known = blockRegistry.lookup(b.type);
      unsupportedTop.push(
        known
          ? `;;; aia-kit: builtin block ${b.type} (${known.category}) not yet emitted`
          : unsupportedBlockLine(b)
      );
    }
  }

  const chunks = [...events, ...procedures, ...globals, ...unsupportedTop];
  return chunks.join("\n\n");
}
