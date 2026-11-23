import type { JSX } from "@solidjs/web";
import { Show } from "solid-js";
import { Icon, type IconData } from "./Icon.tsx";

/** One selectable row of a navigation list or tree. Trees nest rows in indented containers. */
export function ListRow(props: {
  selected?: boolean;
  /** Marked as the counterpart of something the pointer is over elsewhere. */
  highlighted?: boolean;
  onClick: () => void;
  /** Called when the pointer or keyboard focus enters (`true`) or leaves (`false`) the row. */
  onHover?: (hovering: boolean) => void;
  icon?: IconData;
  /** Tooltip, for labels that may be truncated. */
  title?: string;
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
      onMouseEnter={() => props.onHover?.(true)}
      onMouseLeave={() => props.onHover?.(false)}
      onFocus={() => props.onHover?.(true)}
      onBlur={() => props.onHover?.(false)}
      class={[
        "flex w-full items-center gap-2 rounded-md px-2 py-1 text-left text-sm",
        props.selected
          ? "bg-zinc-200 text-zinc-950 dark:bg-zinc-700 dark:text-white"
          : "text-zinc-700 hover:bg-zinc-200/60 dark:text-zinc-300 dark:hover:bg-zinc-800",
        props.highlighted ? "outline-1 -outline-offset-1 outline-amber-500 outline-dashed" : "",
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
