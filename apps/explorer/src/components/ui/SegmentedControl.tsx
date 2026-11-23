import type { JSX } from "@solidjs/web";
import { For } from "solid-js";

/** A compact either/or switch for a setting with a few named options. */
export function SegmentedControl<T extends string>(props: {
  /** What the setting is, for assistive technology and the tooltip. */
  label: string;
  value: T;
  onChange: (id: T) => void;
  items: readonly { readonly id: T; readonly label: string }[];
}): JSX.Element {
  return (
    <div
      role="radiogroup"
      aria-label={props.label}
      title={props.label}
      class="inline-flex shrink-0 rounded-md border border-zinc-300 p-0.5 dark:border-zinc-700"
    >
      <For each={props.items}>
        {(item) => (
          <button
            type="button"
            role="radio"
            aria-checked={props.value === item.id ? "true" : "false"}
            onClick={() => props.onChange(item.id)}
            class={[
              "rounded px-2 py-0.5 text-xs whitespace-nowrap",
              props.value === item.id
                ? "bg-zinc-200 font-medium text-zinc-950 dark:bg-zinc-700 dark:text-white"
                : "text-zinc-600 hover:text-zinc-950 dark:text-zinc-400 dark:hover:text-white",
            ]}
          >
            {item.label}
          </button>
        )}
      </For>
    </div>
  );
}
