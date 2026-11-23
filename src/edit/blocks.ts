import type { Block, Project } from "../types.ts";
import { updateScreen } from "./internal.ts";

/**
 * Rebuilds a block forest bottom-up. `fn` receives each block after its
 * children were mapped and returns the block to keep, or `null` to delete it.
 * Deleting a block in a stack reconnects the blocks below it; deleting a
 * value block empties that input. Unchanged subtrees keep their identity.
 */
export function mapBlocks(
  blocks: readonly Block[],
  fn: (block: Block) => Block | null,
): readonly Block[] {
  let changed = false;
  const result: Block[] = [];
  for (const block of blocks) {
    const mapped = mapBlock(block, fn);
    if (mapped !== block) changed = true;
    if (mapped) result.push(mapped);
  }
  return changed ? result : blocks;
}

function mapBlock(block: Block, fn: (block: Block) => Block | null): Block | undefined {
  const values = mapInputs(block.values, fn);
  const statements = mapInputs(block.statements, fn);
  const next = block.next && mapBlock(block.next, fn);

  let rebuilt = block;
  if (values !== block.values || statements !== block.statements || next !== block.next) {
    const { next: _, ...rest } = block;
    rebuilt = { ...rest, values, statements, ...(next && { next }) };
  }
  return fn(rebuilt) ?? rebuilt.next;
}

function mapInputs(
  inputs: Readonly<Record<string, Block>>,
  fn: (block: Block) => Block | null,
): Readonly<Record<string, Block>> {
  let changed = false;
  const result: Record<string, Block> = {};
  for (const [name, block] of Object.entries(inputs)) {
    const mapped = mapBlock(block, fn);
    if (mapped !== block) changed = true;
    if (mapped) result[name] = mapped;
  }
  return changed ? result : inputs;
}

/**
 * Replaces the blocks of a screen with the result of `fn`.
 * @throws {NotFoundError} if the screen does not exist.
 */
export function updateBlocks(
  project: Project,
  screenName: string,
  fn: (blocks: readonly Block[]) => readonly Block[],
): Project {
  return updateScreen(project, screenName, (screen) => {
    const blocks = fn(screen.blocks);
    return blocks === screen.blocks ? screen : { ...screen, blocks };
  });
}

/** True if a block is tied to one of the named components. */
export function refersTo(block: Block, names: ReadonlySet<string>): boolean {
  const instance = block.mutation["instance_name"];
  if (instance !== undefined && block.mutation["is_generic"] !== "true" && names.has(instance)) {
    return true;
  }
  const selected = block.fields["COMPONENT_SELECTOR"];
  return selected !== undefined && names.has(selected);
}

/** Points every block that refers to component `from` at `to`. */
export function renameReferences(
  blocks: readonly Block[],
  from: string,
  to: string,
): readonly Block[] {
  return mapBlocks(blocks, (block) => {
    const inMutation = block.mutation["instance_name"] === from;
    const inField = block.fields["COMPONENT_SELECTOR"] === from;
    if (!inMutation && !inField) return block;
    return {
      ...block,
      ...(inMutation && { mutation: { ...block.mutation, instance_name: to } }),
      ...(inField && { fields: { ...block.fields, COMPONENT_SELECTOR: to } }),
    };
  });
}
