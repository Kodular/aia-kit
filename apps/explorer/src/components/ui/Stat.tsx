import type { JSX } from "@solidjs/web";
import { For, Show } from "solid-js";

/** One headline number with its label, and an optional note under it. */
export function Stat(props: {
  label: string;
  value: JSX.Element;
  note?: JSX.Element;
}): JSX.Element {
  return (
    <div class="rounded-lg border border-zinc-200 bg-white px-4 py-3 dark:border-zinc-800 dark:bg-zinc-900">
      <div class="text-xs text-zinc-500 dark:text-zinc-400">{props.label}</div>
      <div class="mt-0.5 text-2xl font-medium tabular-nums">{props.value}</div>
      <Show when={props.note !== undefined}>
        <div class="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">{props.note}</div>
      </Show>
    </div>
  );
}

export interface BarItem {
  readonly label: string;
  readonly value: number;
  /** The value as text, e.g. with a unit. Defaults to the number. */
  readonly display?: string;
  readonly onClick?: () => void;
}

/**
 * A ranked list of horizontal bars for comparing magnitudes. One hue, bars
 * anchored to the left baseline, and every value written out, so nothing is
 * carried by colour or length alone.
 */
export function BarList(props: { items: readonly BarItem[]; mono?: boolean }): JSX.Element {
  const max = () => Math.max(1, ...props.items.map((item) => item.value));

  return (
    <div class="flex flex-col gap-1.5">
      <For each={props.items}>
        {(item) => {
          const display = () => item.display ?? String(item.value);
          const row = (
            <>
              <span
                class={["min-w-0 truncate text-left", { "font-mono text-xs": props.mono === true }]}
              >
                {item.label}
              </span>
              <span class="h-2 overflow-hidden">
                <span
                  class="block h-full min-w-0.5 rounded-r-sm bg-sky-600 dark:bg-sky-500"
                  style={{ width: `${(item.value / max()) * 100}%` }}
                />
              </span>
              <span class="text-right text-zinc-600 tabular-nums dark:text-zinc-400">
                {display()}
              </span>
            </>
          );
          const layout =
            "grid w-full grid-cols-[minmax(0,2fr)_minmax(0,3fr)_auto] items-center gap-3 text-sm";
          return (
            <Show
              when={item.onClick}
              fallback={
                <div class={layout} title={`${item.label}: ${display()}`}>
                  {row}
                </div>
              }
            >
              {(onClick) => (
                <button
                  type="button"
                  class={[layout, "rounded hover:bg-zinc-100 dark:hover:bg-zinc-800"]}
                  title={`${item.label}: ${display()}`}
                  onClick={() => onClick()()}
                >
                  {row}
                </button>
              )}
            </Show>
          );
        }}
      </For>
    </div>
  );
}
