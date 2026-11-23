import type { JSX } from "@solidjs/web";
import type { Block } from "aia-kit";
import { For, Show } from "solid-js";
import { CATEGORY_CLASS, categoryOf, labelOf, stackOf } from "../lib/blocks.ts";

/** A stack of blocks (a block and everything attached below it) as an indented outline. */
export function BlockStack(props: { block: Block }): JSX.Element {
  return (
    <div class="flex flex-col items-start gap-1">
      <For each={stackOf(props.block)}>{(block) => <BlockNode block={block} />}</For>
    </div>
  );
}

function BlockNode(props: { block: Block }): JSX.Element {
  const inputs = () => [
    ...Object.entries(props.block.values).map(([name, block]) => ({ name, block })),
    ...Object.entries(props.block.statements).map(([name, block]) => ({ name, block })),
  ];

  return (
    <div
      class={["flex flex-col items-start gap-1", { "opacity-50": props.block.disabled === true }]}
    >
      <div
        class={["rounded-md px-2 py-1 font-mono text-xs", CATEGORY_CLASS[categoryOf(props.block)]]}
        title={props.block.comment?.text ?? props.block.type}
      >
        {labelOf(props.block)}
        <Show when={props.block.comment}>
          <span class="ml-2 opacity-60">// {props.block.comment?.text}</span>
        </Show>
      </div>
      <Show when={inputs().length > 0}>
        <div class="ml-3 flex flex-col items-start gap-1 border-l border-zinc-300 pl-3 dark:border-zinc-700">
          <For each={inputs()}>
            {(input) => (
              <div class="flex items-start gap-2">
                <Show when={inputs().length > 1}>
                  <span class="pt-1 font-mono text-[11px] text-zinc-400 lowercase">
                    {input.name}
                  </span>
                </Show>
                <BlockStack block={input.block} />
              </div>
            )}
          </For>
        </div>
      </Show>
    </div>
  );
}
