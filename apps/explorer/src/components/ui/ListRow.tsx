import type { JSX } from "@solidjs/web";
import { Show } from "solid-js";
import { Icon, type IconData } from "./Icon.tsx";

/** One selectable row of a navigation list or tree. */
export function ListRow(props: {
  selected?: boolean;
  onClick: () => void;
  icon?: IconData;
  /** Tooltip, for labels that may be truncated. */
  title?: string;
  /** Nesting level, for trees. */
  depth?: number;
  /** Muted text after the label, e.g. a type. */
  secondary?: JSX.Element;
  /** Right-aligned content, e.g. a badge. */
  trailing?: JSX.Element;
  children: JSX.Element;
}): JSX.Element {
  return (
    <button
      type="button"
      title={props.title}
      aria-current={props.selected ? "true" : undefined}
      onClick={() => props.onClick()}
      style={{ "padding-left": `${(props.depth ?? 0) * 14 + 8}px` }}
      class={[
        "flex w-full items-center gap-2 rounded-md py-1 pr-2 text-left text-sm",
        props.selected
          ? "bg-zinc-200 text-zinc-950 dark:bg-zinc-700 dark:text-white"
          : "text-zinc-700 hover:bg-zinc-200/60 dark:text-zinc-300 dark:hover:bg-zinc-800",
      ]}
    >
      <Show when={props.icon}>
        {(icon) => <Icon icon={icon()} size={14} class="text-zinc-400 dark:text-zinc-500" />}
      </Show>
      <span class="min-w-0 truncate">{props.children}</span>
      <Show when={props.secondary !== undefined}>
        <span class="min-w-0 truncate text-xs text-zinc-500 dark:text-zinc-400">
          {props.secondary}
        </span>
      </Show>
      <Show when={props.trailing !== undefined}>
        <span class="ml-auto flex shrink-0 items-center gap-1">{props.trailing}</span>
      </Show>
    </button>
  );
}
