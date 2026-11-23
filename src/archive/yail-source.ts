import type { Block, Component } from "../types.ts";

/** YAIL found in an archive, valid only while the screen it was compiled from is unchanged. */
const sources = new WeakMap<Component, { blocks: readonly Block[]; yail: string }>();

export function rememberYail(form: Component, blocks: readonly Block[], yail: string): void {
  sources.set(form, { blocks, yail });
}

export function originalYail(form: Component, blocks: readonly Block[]): string | undefined {
  const source = sources.get(form);
  return source?.blocks === blocks ? source.yail : undefined;
}
