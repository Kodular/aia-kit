import type { JSX } from "@solidjs/web";
import { Show } from "solid-js";
import { Icon, type IconData, type ClassValue } from "./Icon.tsx";

type Variant = "primary" | "secondary" | "ghost" | "link";

const VARIANT: Readonly<Record<Variant, string>> = {
  primary:
    "rounded-md bg-zinc-900 px-3 font-medium text-white hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300",
  secondary:
    "rounded-md border border-zinc-300 px-3 hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800",
  ghost:
    "rounded-md px-2 text-zinc-600 hover:bg-zinc-200/60 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100",
  link: "text-blue-600 hover:underline dark:text-blue-400",
};

/**
 * The app's button. `link` is for in-text navigation to another part of the
 * project; the others are controls.
 */
export function Button(props: {
  variant?: Variant;
  size?: "sm" | "md";
  icon?: IconData;
  iconEnd?: IconData;
  /** Tooltip, and the accessible name when the button has no text. */
  title?: string;
  class?: ClassValue;
  onClick: (event: MouseEvent) => void;
  children?: JSX.Element;
}): JSX.Element {
  const variant = () => props.variant ?? "secondary";
  const small = () => (props.size ?? "md") === "sm";

  return (
    <button
      type="button"
      title={props.title}
      aria-label={props.children === undefined ? props.title : undefined}
      onClick={(event) => props.onClick(event)}
      class={[
        "inline-flex items-center gap-1.5 text-left",
        small() ? "text-xs" : "text-sm",
        variant() === "link" ? "" : small() ? "py-0.5" : "py-1.5",
        VARIANT[variant()],
        props.class,
      ]}
    >
      <Show when={props.icon}>{(icon) => <Icon icon={icon()} size={small() ? 14 : 16} />}</Show>
      {props.children}
      <Show when={props.iconEnd}>{(icon) => <Icon icon={icon()} size={small() ? 14 : 16} />}</Show>
    </button>
  );
}
