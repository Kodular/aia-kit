import type { JSX } from "@solidjs/web";
import {
  componentReference,
  walkBlocks,
  walkComponents,
  type Component,
  type Screen,
} from "aia-kit";
import { lookupComponent } from "aia-kit/platforms";
import { For, Show, createMemo } from "solid-js";
import { cssColor, plainText, plural, simpleName } from "../lib/format.ts";
import { useApp } from "../state.ts";
import { ComponentTree } from "./ComponentTree.tsx";
import { Badge, Empty } from "./ui.tsx";

/**
 * The right-hand pane. For a screen it starts as the component tree; choosing a
 * component (here or in the layout preview) swaps in its details, and Back
 * returns to the tree.
 */
export function Inspector(): JSX.Element {
  const app = useApp();

  return (
    <aside class="min-h-0 overflow-auto border-l border-zinc-200 dark:border-zinc-800">
      <div class="p-4">
        <Show when={app.screen()} fallback={<Empty>Select a screen to see its components.</Empty>}>
          {(screen) => (
            <Show when={app.component()} fallback={<ComponentList screen={screen()} />}>
              {(component) => (
                <>
                  <button
                    type="button"
                    class="mb-3 -ml-1 flex items-center gap-1 rounded-md px-1 text-xs text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
                    onClick={() => app.selectComponent(screen().name)}
                  >
                    <span aria-hidden="true">←</span> Components
                  </button>
                  <ComponentDetails component={component()} />
                </>
              )}
            </Show>
          )}
        </Show>
      </div>
    </aside>
  );
}

/** The tree of visible components, then the non-visible ones as a flat list. */
function ComponentList(props: { screen: Screen }): JSX.Element {
  const app = useApp();
  const all = () => Array.from(walkComponents(props.screen));
  const nonVisible = () => all().filter((component) => app.isNonVisible(component));

  return (
    <>
      <h2 class="mb-2 text-xs font-medium text-zinc-500 dark:text-zinc-400">
        Components · {all().length - nonVisible().length}
      </h2>
      <div class="-mx-2">
        <ComponentTree screen={props.screen.name} component={props.screen.form} />
      </div>
      <Show when={nonVisible().length > 0}>
        <h2 class="mt-4 mb-2 text-xs font-medium text-zinc-500 dark:text-zinc-400">
          Non-visible · {nonVisible().length}
        </h2>
        <div class="-mx-2">
          <For each={nonVisible()}>
            {(component) => (
              <button
                type="button"
                onClick={() => app.selectComponent(props.screen.name, component.name)}
                class="flex w-full items-baseline gap-2 rounded-md px-2 py-0.5 text-left text-sm hover:bg-zinc-100 dark:hover:bg-zinc-800"
              >
                <span class="truncate">{component.name}</span>
                <span class="truncate text-xs text-zinc-500 dark:text-zinc-400">
                  {simpleName(component.type)}
                </span>
              </button>
            )}
          </For>
        </div>
      </Show>
    </>
  );
}

function ComponentDetails(props: { component: Component }): JSX.Element {
  const app = useApp();

  const descriptor = () => {
    const platform = app.platform();
    return platform ? lookupComponent(props.component.type, platform, app.project()) : undefined;
  };
  const help = () => plainText(descriptor()?.helpString ?? "");
  const properties = () => Object.entries(props.component.properties);

  /** Blocks on the current screen that refer to this component, by kind. */
  const usage = createMemo(() => {
    const screen = app.screen();
    const events: string[] = [];
    let others = 0;
    for (const block of screen ? walkBlocks(screen) : []) {
      const ref = componentReference(block);
      if (ref?.instance !== props.component.name) continue;
      if (ref.kind === "event" && ref.member !== undefined) events.push(ref.member);
      else others += 1;
    }
    return { events, others };
  });

  return (
    <div class="flex flex-col gap-4">
      <div>
        <h2 class="text-base font-medium break-words">{props.component.name}</h2>
        <p class="text-xs text-zinc-500 dark:text-zinc-400">
          {simpleName(props.component.type)}
          <Show when={props.component.version !== undefined}> · v{props.component.version}</Show>
          <Show when={descriptor()?.external}> · extension</Show>
        </p>
        <Show when={help() !== ""}>
          <p class="mt-2 line-clamp-4 text-xs text-zinc-600 dark:text-zinc-400" title={help()}>
            {help()}
          </p>
        </Show>
      </div>

      <div>
        <h3 class="mb-1 text-xs font-medium text-zinc-500 dark:text-zinc-400">Properties</h3>
        <For each={properties()} fallback={<Empty>All defaults.</Empty>}>
          {([name, value]) => (
            <div class="flex items-baseline justify-between gap-3 border-b border-zinc-100 py-1 text-sm last:border-0 dark:border-zinc-800">
              <span class="shrink-0 text-zinc-600 dark:text-zinc-400">{name}</span>
              <PropertyValue value={value} />
            </div>
          )}
        </For>
      </div>

      <div>
        <h3 class="mb-1 text-xs font-medium text-zinc-500 dark:text-zinc-400">Used in blocks</h3>
        <Show
          when={usage().events.length + usage().others > 0}
          fallback={<Empty>No blocks refer to this component.</Empty>}
        >
          <div class="flex flex-wrap gap-1">
            <For each={usage().events}>{(event) => <Badge tone="accent">when {event}</Badge>}</For>
            <Show when={usage().others > 0}>
              <Badge>{plural(usage().others, "other block")}</Badge>
            </Show>
          </div>
        </Show>
      </div>
    </div>
  );
}

function PropertyValue(props: { value: string }): JSX.Element {
  const app = useApp();
  const color = () => cssColor(props.value);
  const isAsset = () => app.project()?.assets.some((asset) => asset.name === props.value) ?? false;

  return (
    <span class="min-w-0 text-right break-words">
      <Show when={color()}>
        <span
          class="mr-1.5 inline-block size-3 rounded-sm border border-zinc-300 align-[-1px] dark:border-zinc-600"
          style={{ "background-color": color() }}
        />
      </Show>
      <Show when={isAsset()} fallback={color() ? props.value.slice(2) : props.value}>
        <button
          type="button"
          class="text-blue-600 hover:underline dark:text-blue-400"
          onClick={() => app.select({ kind: "asset", name: props.value })}
        >
          {props.value}
        </button>
      </Show>
    </span>
  );
}
