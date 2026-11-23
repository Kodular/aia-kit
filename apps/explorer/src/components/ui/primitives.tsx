import type { JSX } from "@solidjs/web";
import { Show } from "solid-js";
import { Icon, type IconData, type ClassValue } from "./Icon.tsx";

type Tone = "neutral" | "warning" | "danger" | "accent";

const TONE: Readonly<Record<Tone, string>> = {
  neutral: "bg-zinc-200/70 text-zinc-700 dark:bg-zinc-700/70 dark:text-zinc-200",
  warning: "bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-200",
  danger: "bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-200",
  accent: "bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-200",
};

/** A small pill for a count, state or fact. */
export function Badge(props: { tone?: Tone; children: JSX.Element }): JSX.Element {
  return (
    <span
      class={[
        "inline-flex shrink-0 items-center rounded-full px-1.5 py-0.5 text-[11px] leading-none font-medium",
        TONE[props.tone ?? "neutral"],
      ]}
    >
      {props.children}
    </span>
  );
}

/** A bordered surface for one group of content, with an optional heading row. */
export function Card(props: {
  title?: string;
  actions?: JSX.Element;
  class?: ClassValue;
  children: JSX.Element;
}): JSX.Element {
  return (
    <section
      class={[
        "rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900",
        props.class,
      ]}
    >
      <Show when={props.title !== undefined || props.actions !== undefined}>
        <div class="mb-3 flex items-center gap-2">
          <h3 class="min-w-0 flex-1 truncate text-sm font-medium">{props.title}</h3>
          {props.actions}
        </div>
      </Show>
      {props.children}
    </section>
  );
}

/** Muted text for "nothing here" states. */
export function Empty(props: { children: JSX.Element }): JSX.Element {
  return <p class="text-sm text-zinc-500 dark:text-zinc-400">{props.children}</p>;
}

/** A small heading above a group of rows or fields. */
export function SectionLabel(props: {
  count?: number | undefined;
  class?: ClassValue;
  children: JSX.Element;
}): JSX.Element {
  return (
    <h3
      class={[
        "flex items-baseline gap-1.5 text-xs font-medium text-zinc-500 dark:text-zinc-400",
        props.class,
      ]}
    >
      {props.children}
      <Show when={props.count !== undefined}>
        <span class="font-normal text-zinc-400 dark:text-zinc-500">{props.count}</span>
      </Show>
    </h3>
  );
}

/** The title row at the top of the main area: what you are looking at, and facts about it. */
export function PageHeader(props: {
  icon: IconData;
  title: string;
  children?: JSX.Element;
  actions?: JSX.Element;
}): JSX.Element {
  return (
    <header class="flex flex-wrap items-center gap-x-3 gap-y-2">
      <Icon icon={props.icon} size={18} class="text-zinc-500 dark:text-zinc-400" />
      <h1 class="min-w-0 truncate text-base font-medium">{props.title}</h1>
      <div class="flex flex-wrap items-center gap-1.5">{props.children}</div>
      <span class="flex-1" />
      {props.actions}
    </header>
  );
}

/** A list of label/value rows. */
export function KeyValueList(props: { children: JSX.Element }): JSX.Element {
  return <dl class="divide-y divide-zinc-100 dark:divide-zinc-800">{props.children}</dl>;
}

export function KeyValue(props: {
  label: string;
  mono?: boolean;
  children: JSX.Element;
}): JSX.Element {
  return (
    <div class="flex items-baseline justify-between gap-4 py-1 text-sm">
      <dt class="shrink-0 text-zinc-600 dark:text-zinc-400">{props.label}</dt>
      <dd
        class={[
          "min-w-0 text-right break-words",
          { "font-mono text-xs break-all": props.mono === true },
        ]}
      >
        {props.children}
      </dd>
    </div>
  );
}
