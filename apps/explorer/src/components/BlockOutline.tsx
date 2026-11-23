import type { JSX } from "@solidjs/web";
import type { Block } from "aia-kit";
import { For, Show } from "solid-js";
import { useApp } from "../state.ts";
import { CATEGORY_CLASS, categoryOf, labelOf, operatorOf, stackOf } from "../lib/blocks.ts";

/** A stack of blocks (a block and everything attached below it), one per line. */
export function BlockStack(props: { block: Block }): JSX.Element {
  return (
    <div class="flex flex-col items-start gap-1">
      <For each={stackOf(props.block)}>{(block) => <BlockNode block={block} />}</For>
    </div>
  );
}

/** Input names that say nothing: a lone value, or a numbered (positional) slot such as ARG0 or ADD1. */
const PLAIN_INPUT = /^(VALUE|TEXT|ITEM|A|B|[A-Z_]*\d+)$/;

/**
 * The operands of an operator block, in order, with `undefined` for a socket
 * nothing is plugged into. Binary operators use inputs A and B; variadic ones
 * (`+`, `×`) number their inputs and record how many in the mutation.
 */
function operandsOf(block: Block): (Block | undefined)[] {
  const count = Number(block.mutation["items"]);
  if (!Number.isInteger(count) || count < 1) return [block.values["A"], block.values["B"]];
  const byIndex = new Map(
    Object.entries(block.values).map(([name, value]) => [/\d+$/.exec(name)?.[0], value]),
  );
  return Array.from({ length: count }, (_, index) => byIndex.get(String(index)));
}

/**
 * One block, laid out like Blockly: expression inputs sit inline inside the
 * block, and statement inputs hang below it, indented.
 */
function BlockNode(props: { block: Block; nested?: boolean }): JSX.Element {
  const app = useApp();
  const values = () => Object.entries(props.block.values);
  const statements = () => Object.entries(props.block.statements);
  /** `a + b` reads better than `+ a b`. */
  const infix = () => operatorOf(props.block);

  return (
    <div
      class={[
        "inline-flex flex-col items-start gap-1",
        { "opacity-50": props.block.disabled === true },
      ]}
    >
      <div
        title={props.block.comment?.text ?? props.block.type}
        data-block-id={props.block.id === "" ? undefined : props.block.id}
        class={[
          "inline-flex flex-wrap items-center gap-x-1.5 gap-y-1 rounded-md font-mono text-xs",
          props.nested
            ? "px-1.5 py-0.5 ring-1 ring-black/10 ring-inset dark:ring-white/15"
            : "px-2 py-1",
          CATEGORY_CLASS[categoryOf(props.block)],
          app.revealedBlock() !== undefined && app.revealedBlock() === props.block.id
            ? "outline-2 outline-offset-2 outline-blue-500"
            : "",
        ]}
      >
        <Show
          when={infix()}
          fallback={
            <>
              <span>{labelOf(props.block)}</span>
              <For each={values()}>
                {([name, block]) => (
                  <>
                    <Show when={values().length > 1 && !PLAIN_INPUT.test(name)}>
                      <span class="opacity-60 lowercase">{name}</span>
                    </Show>
                    <BlockNode block={block} nested />
                  </>
                )}
              </For>
            </>
          }
        >
          {(operator) => (
            // Positional, and may hold several empty slots, so render by index.
            <For each={operandsOf(props.block)} keyed={false}>
              {(operand, index) => (
                <>
                  <Show when={index > 0}>
                    <span>{operator()}</span>
                  </Show>
                  <Show when={operand()} fallback={<EmptySocket />}>
                    {(block) => <BlockNode block={block()} nested />}
                  </Show>
                </>
              )}
            </For>
          )}
        </Show>
        <Show when={props.block.comment}>
          <span class="opacity-60">// {props.block.comment?.text}</span>
        </Show>
      </div>
      <Show when={statements().length > 0}>
        <div class="ml-3 flex flex-col items-start gap-1 border-l border-zinc-300 pl-3 dark:border-zinc-700">
          <For each={statements()}>
            {([name, block]) => (
              <>
                <Show when={statements().length > 1}>
                  <span class="font-mono text-[11px] text-zinc-400 lowercase">{name}</span>
                </Show>
                <BlockStack block={block} />
              </>
            )}
          </For>
        </div>
      </Show>
    </div>
  );
}

/** A socket with nothing plugged in. */
function EmptySocket(): JSX.Element {
  return (
    <span
      title="Nothing plugged in"
      class="inline-block h-4 w-5 rounded border border-dashed border-current opacity-40"
    />
  );
}
