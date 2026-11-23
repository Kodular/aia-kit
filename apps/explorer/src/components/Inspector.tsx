import type { JSX } from "@solidjs/web";
import { componentReference, walkBlocks, type Component, type Problem } from "aia-kit";
import { lookupComponent } from "aia-kit/platforms";
import { For, Show, createMemo } from "solid-js";
import { cssColor, plural, simpleName } from "../lib/format.ts";
import { useApp } from "../state.ts";
import { Badge, Empty } from "./ui.tsx";

export function Inspector(): JSX.Element {
  const app = useApp();

  return (
    <aside class="flex min-h-0 flex-col overflow-auto border-l border-zinc-200 dark:border-zinc-800">
      <div class="border-b border-zinc-200 p-4 dark:border-zinc-800">
        <Show
          when={app.component()}
          fallback={<Empty>Select a screen and a component to see its properties.</Empty>}
        >
          {(component) => <ComponentDetails component={component()} />}
        </Show>
      </div>
      <Problems />
    </aside>
  );
}

function ComponentDetails(props: { component: Component }): JSX.Element {
  const app = useApp();

  const descriptor = () => {
    const platform = app.platform();
    return platform ? lookupComponent(props.component.type, platform, app.project()) : undefined;
  };
  const help = () =>
    descriptor()
      ?.helpString.replace(/<[^>]+>/g, "")
      .trim() ?? "";
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

function Problems(): JSX.Element {
  const app = useApp();

  const open = (problem: Problem) => {
    if (!("screen" in problem) || !app.project()?.screens.some((s) => s.name === problem.screen))
      return;
    if (problem.code === "dangling-block-reference") {
      app.selectComponent(problem.screen);
      app.setTab("blocks");
    } else {
      app.selectComponent(problem.screen, "component" in problem ? problem.component : undefined);
      app.setTab("designer");
    }
  };

  return (
    <div class="p-4">
      <h3 class="mb-2 text-xs font-medium text-zinc-500 dark:text-zinc-400">
        Problems · {app.problems().length}
      </h3>
      <div class="flex flex-col gap-2">
        <For each={app.problems()} fallback={<Empty>None found.</Empty>}>
          {(problem) => (
            <button
              type="button"
              onClick={() => open(problem)}
              class={[
                "rounded-md px-2.5 py-1.5 text-left text-xs",
                problem.severity === "error"
                  ? "bg-red-50 text-red-900 hover:bg-red-100 dark:bg-red-950/60 dark:text-red-200"
                  : "bg-amber-50 text-amber-900 hover:bg-amber-100 dark:bg-amber-950/50 dark:text-amber-200",
              ]}
            >
              {problem.message}
            </button>
          )}
        </For>
      </div>
    </div>
  );
}
