import type { JSX } from "@solidjs/web";
import { mainScreenName } from "aia-kit";
import { navigationGraph } from "aia-kit/analysis";
import { ArrowRight, Settings2, Smartphone, Workflow } from "lucide";
import { For, Show, createMemo } from "solid-js";
import { useApp } from "../state.ts";
import {
  Badge,
  Button,
  Card,
  Empty,
  Icon,
  KeyValue,
  KeyValueList,
  PageHeader,
} from "./ui/index.ts";

export function PropertiesView(): JSX.Element {
  const app = useApp();

  const rows = createMemo(() => {
    const project = app.project();
    if (!project) return [];
    const { extra: _extra, ...known } = project.properties;
    return Object.entries(known).map(([key, value]) => [key, String(value)] as const);
  });
  const extra = () => Object.entries(app.project()?.properties.extra ?? {});
  const otherFiles = () => app.project()?.otherFiles ?? [];

  return (
    <>
      <PageHeader icon={Settings2} title="Project properties" />
      <Card title="Known properties">
        <Fields rows={rows()} />
      </Card>
      <Show when={extra().length > 0}>
        <Card title="Other keys">
          <Fields rows={extra()} />
        </Card>
      </Show>
      <Show when={otherFiles().length > 0}>
        <Card title="Other files in the archive" actions={<Badge>{otherFiles().length}</Badge>}>
          <For each={otherFiles()}>
            {(file) => <div class="py-0.5 font-mono text-xs">{file.path}</div>}
          </For>
        </Card>
      </Show>
    </>
  );
}

function Fields(props: { rows: readonly (readonly [string, string])[] }): JSX.Element {
  return (
    <KeyValueList>
      <For each={props.rows}>
        {([key, value]) => (
          <KeyValue label={key} mono>
            {value}
          </KeyValue>
        )}
      </For>
    </KeyValueList>
  );
}

export function ScreenFlowView(): JSX.Element {
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
    <>
      <PageHeader icon={Workflow} title="Screen flow" />
      <Card>
        <p class="mb-4 text-sm text-zinc-600 dark:text-zinc-400">
          Which screens open which, from "open another screen" blocks whose target is a literal
          screen name.
        </p>
        <div class="flex flex-col gap-2">
          <For each={graph().screens}>
            {(screen) => (
              <div class="flex flex-wrap items-center gap-2 rounded-md border border-zinc-200 px-3 py-2 dark:border-zinc-800">
                <Icon icon={Smartphone} size={14} class="text-zinc-400" />
                <Button
                  variant="link"
                  class="font-medium text-zinc-900! dark:text-zinc-100!"
                  onClick={() => app.selectComponent(screen)}
                >
                  {screen}
                </Button>
                <Show when={screen === main()}>
                  <Badge tone="accent">start</Badge>
                </Show>
                <Show when={screen !== main() && !isOpened(screen)}>
                  <Badge tone="warning">never opened</Badge>
                </Show>
                <span class="flex-1" />
                <For each={targetsOf(screen)} fallback={<Empty>opens nothing</Empty>}>
                  {(target) => (
                    <Button
                      variant="link"
                      icon={ArrowRight}
                      onClick={() => app.selectComponent(target)}
                    >
                      {target}
                    </Button>
                  )}
                </For>
              </div>
            )}
          </For>
        </div>
      </Card>
    </>
  );
}
