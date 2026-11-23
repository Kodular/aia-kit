import type { JSX } from "@solidjs/web";

export function SectionLabel(props: { children: JSX.Element }): JSX.Element {
  return (
    <div class="px-2 pt-4 pb-1 text-xs font-medium text-zinc-500 dark:text-zinc-400">
      {props.children}
    </div>
  );
}

export function Badge(props: {
  tone?: "neutral" | "warning" | "danger" | "accent";
  children: JSX.Element;
}): JSX.Element {
  return (
    <span
      class={[
        "inline-flex shrink-0 items-center rounded-full px-1.5 py-0.5 text-[11px] leading-none font-medium",
        {
          "bg-zinc-200/70 text-zinc-700 dark:bg-zinc-700/70 dark:text-zinc-200":
            (props.tone ?? "neutral") === "neutral",
          "bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-200":
            props.tone === "warning",
          "bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-200": props.tone === "danger",
          "bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-200":
            props.tone === "accent",
        },
      ]}
    >
      {props.children}
    </span>
  );
}

/** A full-width list row that can be selected. */
export function Row(props: {
  selected?: boolean;
  onClick: () => void;
  title?: string;
  children: JSX.Element;
}): JSX.Element {
  return (
    <button
      type="button"
      title={props.title}
      onClick={() => props.onClick()}
      class={[
        "flex w-full items-center gap-2 rounded-md px-2 py-1 text-left text-sm",
        props.selected
          ? "bg-zinc-200 text-zinc-950 dark:bg-zinc-700 dark:text-white"
          : "text-zinc-700 hover:bg-zinc-200/60 dark:text-zinc-300 dark:hover:bg-zinc-800",
      ]}
    >
      {props.children}
    </button>
  );
}

export function Card(props: {
  title?: string;
  class?: string;
  children: JSX.Element;
}): JSX.Element {
  return (
    <section
      class={[
        "rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900",
        props.class,
      ]}
    >
      {props.title !== undefined && <h3 class="mb-3 text-sm font-medium">{props.title}</h3>}
      {props.children}
    </section>
  );
}

export function Empty(props: { children: JSX.Element }): JSX.Element {
  return <p class="text-sm text-zinc-500 dark:text-zinc-400">{props.children}</p>;
}
