import type { JSX } from "@solidjs/web";
import { mainScreenName, packageName } from "aia-kit";
import { navigationGraph } from "aia-kit/analysis";
import { For, Show, createMemo } from "solid-js";
import { useApp } from "../state.ts";
import { Badge, Card, Empty } from "./ui.tsx";

export function PropertiesView(): JSX.Element {
  const app = useApp();

  const rows = createMemo(() => {
    const project = app.project();
    if (!project) return [];
    const { extra: _extra, ...known } = project.properties;
    return [
      ...Object.entries(known).map(([key, value]) => [key, String(value)] as const),
      ["package", packageName(project)] as const,
    ];
  });
  const extra = () => Object.entries(app.project()?.properties.extra ?? {});

  return (
    <div class="flex flex-col gap-4">
      <Card title="Project properties">
        <Table rows={rows()} />
      </Card>
      <Show when={extra().length > 0}>
        <Card title="Other keys">
          <Table rows={extra()} />
        </Card>
      </Show>
      <Show when={(app.project()?.otherFiles.length ?? 0) > 0}>
        <Card title="Other files in the archive">
          <For each={app.project()?.otherFiles ?? []}>
            {(file) => <div class="py-0.5 font-mono text-xs">{file.path}</div>}
          </For>
        </Card>
      </Show>
    </div>
  );
}

function Table(props: { rows: readonly (readonly [string, string])[] }): JSX.Element {
  return (
    <For each={props.rows}>
      {([key, value]) => (
        <div class="flex justify-between gap-6 border-b border-zinc-100 py-1 text-sm last:border-0 dark:border-zinc-800">
          <span class="shrink-0 text-zinc-600 dark:text-zinc-400">{key}</span>
          <span class="min-w-0 text-right font-mono text-xs break-all">{value}</span>
        </div>
      )}
    </For>
  );
}

export function NavigationView(): JSX.Element {
  const app = useApp();

  const graph = createMemo(() => {
    const project = app.project();
    return project ? navigationGraph(project) : { screens: [], edges: [] };
  });
  const main = () => {
    const project = app.project();
    return project ? mainScreenName(project) : "";
  };
  const targetsOf = (screen: string) =>
    graph()
      .edges.filter((edge) => edge.from === screen)
      .map((edge) => edge.to);
  const isOpened = (screen: string) => graph().edges.some((edge) => edge.to === screen);

  return (
    <Card title="Which screens open which">
      <p class="mb-4 text-sm text-zinc-600 dark:text-zinc-400">
        Built from "open another screen" blocks whose target is a literal screen name.
      </p>
      <div class="flex flex-col gap-2">
        <For each={graph().screens}>
          {(screen) => (
            <div class="flex flex-wrap items-center gap-2 rounded-md border border-zinc-200 px-3 py-2 dark:border-zinc-800">
              <button
                type="button"
                class="text-sm font-medium hover:underline"
                onClick={() => app.selectComponent(screen)}
              >
                {screen}
              </button>
              <Show when={screen === main()}>
                <Badge tone="accent">start</Badge>
              </Show>
              <Show when={screen !== main() && !isOpened(screen)}>
                <Badge tone="warning">never opened</Badge>
              </Show>
              <span class="flex-1" />
              <For each={targetsOf(screen)} fallback={<Empty>opens nothing</Empty>}>
                {(target) => (
                  <button
                    type="button"
                    class="text-sm text-blue-600 hover:underline dark:text-blue-400"
                    onClick={() => app.selectComponent(target)}
                  >
                    → {target}
                  </button>
                )}
              </For>
            </div>
          )}
        </For>
      </div>
    </Card>
  );
}
