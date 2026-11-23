import type { JSX } from "@solidjs/web";
import type { Component } from "aia-kit";
import { For } from "solid-js";
import { simpleName } from "../lib/format.ts";
import { useApp } from "../state.ts";

export function ComponentTree(props: {
  screen: string;
  component: Component;
  depth?: number;
}): JSX.Element {
  const app = useApp();
  const depth = () => props.depth ?? 0;

  return (
    <div>
      <button
        type="button"
        onClick={() => app.selectComponent(props.screen, props.component.name)}
        style={{ "padding-left": `${depth() * 14 + 8}px` }}
        class={[
          "flex w-full items-baseline gap-2 rounded-md py-0.5 pr-2 text-left text-sm",
          app.component() === props.component
            ? "bg-blue-100 text-blue-950 dark:bg-blue-900/50 dark:text-blue-100"
            : "hover:bg-zinc-100 dark:hover:bg-zinc-800",
        ]}
      >
        <span class="truncate">{props.component.name}</span>
        <span class="truncate text-xs text-zinc-500 dark:text-zinc-400">
          {simpleName(props.component.type)}
        </span>
      </button>
      <For each={props.component.children}>
        {(child) => <ComponentTree screen={props.screen} component={child} depth={depth() + 1} />}
      </For>
    </div>
  );
}
