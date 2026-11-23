import type { JSX } from "@solidjs/web";
import type { Component } from "aia-kit";
import { For, Show } from "solid-js";
import { simpleName } from "../lib/format.ts";
import { componentIcon } from "../lib/icons.ts";
import { useApp } from "../state.ts";
import { ListRow } from "./ui/index.ts";

/** One row for a component in a list or tree. */
export function ComponentRow(props: { screen: string; component: Component }): JSX.Element {
  const app = useApp();
  return (
    <ListRow
      icon={componentIcon(props.component.type)}
      secondary={simpleName(props.component.type)}
      onClick={() => app.selectComponent(props.screen, props.component.name)}
      onHover={(hovering) => app.hover(hovering ? props.component.name : undefined)}
    >
      {props.component.name}
    </ListRow>
  );
}

/**
 * A component and its descendants as a tree, with a guide line per level.
 * Non-visible components are left out.
 */
export function ComponentTree(props: { screen: string; component: Component }): JSX.Element {
  const app = useApp();
  const children = () => props.component.children.filter((child) => !app.isNonVisible(child));

  return (
    <>
      <ComponentRow screen={props.screen} component={props.component} />
      <Show when={children().length > 0}>
        {/* The guide sits under the centre of the parent's icon. */}
        <div class="ml-[14px] border-l border-zinc-200 pl-1 dark:border-zinc-800">
          <For each={children()}>
            {(child) => <ComponentTree screen={props.screen} component={child} />}
          </For>
        </div>
      </Show>
    </>
  );
}
