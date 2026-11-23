import type { JSX } from "@solidjs/web";
import { ChevronRight } from "lucide";
import { Show, createSignal } from "solid-js";
import { Icon, type ClassValue } from "./Icon.tsx";

/** A heading that shows or hides the content below it. Open by default. */
export function Disclosure(props: {
  title: JSX.Element;
  /** Muted text after the title. */
  meta?: JSX.Element;
  /** Right-aligned content in the heading row. */
  trailing?: JSX.Element;
  defaultOpen?: boolean;
  class?: ClassValue;
  /** Classes for the heading button, e.g. padding. */
  headerClass?: string;
  children: JSX.Element;
}): JSX.Element {
  const [open, setOpen] = createSignal(() => props.defaultOpen ?? true);

  return (
    <div class={props.class}>
      <button
        type="button"
        aria-expanded={open() ? "true" : "false"}
        onClick={() => setOpen((value) => !value)}
        class={[
          "flex w-full items-center gap-1.5 rounded text-left text-xs select-none hover:bg-zinc-100 dark:hover:bg-zinc-800/60",
          props.headerClass ?? "py-0.5",
        ]}
      >
        <Icon
          icon={ChevronRight}
          size={14}
          class={["text-zinc-400 transition-transform", { "rotate-90": open() }]}
        />
        <span class="font-medium">{props.title}</span>
        <Show when={props.meta !== undefined}>
          <span class="text-zinc-500 dark:text-zinc-400">{props.meta}</span>
        </Show>
        <Show when={props.trailing !== undefined}>
          <span class="ml-auto shrink-0 text-zinc-500 dark:text-zinc-400">{props.trailing}</span>
        </Show>
      </button>
      <Show when={open()}>{props.children}</Show>
    </div>
  );
}
