import type { JSX } from "@solidjs/web";
import { For, Show } from "solid-js";
import { Icon, type IconData } from "./Icon.tsx";

export interface TabItem<T extends string> {
  readonly id: T;
  readonly label: string;
  readonly icon?: IconData;
}

/** A row of tabs; exactly one is selected. */
export function Tabs<T extends string>(props: {
  value: T;
  onChange: (id: T) => void;
  items: readonly TabItem<T>[];
  /** Monospace labels, for file names. */
  mono?: boolean;
}): JSX.Element {
  return (
    <div role="tablist" class="flex items-center gap-1">
      <For each={props.items}>
        {(item) => (
          <button
            type="button"
            role="tab"
            aria-selected={props.value === item.id ? "true" : "false"}
            onClick={() => props.onChange(item.id)}
            class={[
              "inline-flex items-center gap-1.5 rounded-md px-2.5 py-1",
              props.mono ? "font-mono text-xs" : "text-sm",
              props.value === item.id
                ? "bg-zinc-200 font-medium text-zinc-950 dark:bg-zinc-700 dark:text-white"
                : "text-zinc-600 hover:bg-zinc-200/60 dark:text-zinc-400 dark:hover:bg-zinc-800",
            ]}
          >
            <Show when={item.icon}>{(icon) => <Icon icon={icon()} size={14} />}</Show>
            {item.label}
          </button>
        )}
      </For>
    </div>
  );
}
