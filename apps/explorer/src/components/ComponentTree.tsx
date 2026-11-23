import type { JSX } from "@solidjs/web";
import type { Component } from "aia-kit";
import { For } from "solid-js";
import { simpleName } from "../lib/format.ts";
import { componentIcon } from "../lib/icons.ts";
import { useApp } from "../state.ts";
import { ListRow } from "./ui/index.ts";

/** One row for a component in a list or tree. */
export function ComponentRow(props: {
  screen: string;
  component: Component;
  depth?: number;
}): JSX.Element {
  const app = useApp();
  return (
    <ListRow
      icon={componentIcon(props.component.type)}
      depth={props.depth ?? 0}
      secondary={simpleName(props.component.type)}
      onClick={() => app.selectComponent(props.screen, props.component.name)}
    >
      {props.component.name}
    </ListRow>
  );
}

/** A component and its descendants as an indented list. Non-visible components are left out. */
export function ComponentTree(props: {
  screen: string;
  component: Component;
  depth?: number;
}): JSX.Element {
  const app = useApp();
  const depth = () => props.depth ?? 0;

  return (
    <>
      <ComponentRow screen={props.screen} component={props.component} depth={depth()} />
      <For each={props.component.children.filter((child) => !app.isNonVisible(child))}>
        {(child) => <ComponentTree screen={props.screen} component={child} depth={depth() + 1} />}
      </For>
    </>
  );
}
