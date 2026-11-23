import type { JSX } from "@solidjs/web";
import { walkBlocks, type Block, type Screen } from "aia-kit";
import { summarizeBlocks } from "aia-kit/analysis";
import { serializeBky, serializeScm } from "aia-kit/formats";
import { For, Match, Show, Switch, createMemo } from "solid-js";
import { groupOf, type Group } from "../lib/blocks.ts";
import { plural } from "../lib/format.ts";
import { indentXml } from "../lib/highlight.ts";
import { useApp, type Tab } from "../state.ts";
import { BlockStack } from "./BlockOutline.tsx";
import { Code } from "./Code.tsx";
import { ComponentTree } from "./ComponentTree.tsx";
import { LayoutPreview } from "./LayoutPreview.tsx";
import { Card, Empty } from "./ui.tsx";

const TABS: readonly (readonly [Tab, string])[] = [
  ["designer", "Designer"],
  ["blocks", "Blocks"],
  ["raw", "Raw files"],
];

export function ScreenView(): JSX.Element {
  const app = useApp();

  return (
    <Show when={app.screen()} fallback={<Empty>This screen no longer exists.</Empty>}>
      {(screen) => (
        <div class="flex flex-col gap-4">
          <div class="flex items-center gap-1">
            <For each={TABS}>
              {([id, label]) => (
                <button
                  type="button"
                  onClick={() => app.setTab(id)}
                  class={[
                    "rounded-md px-3 py-1 text-sm",
                    app.tab() === id
                      ? "bg-zinc-200 font-medium dark:bg-zinc-700"
                      : "text-zinc-600 hover:bg-zinc-200/60 dark:text-zinc-400 dark:hover:bg-zinc-800",
                  ]}
                >
                  {label}
                </button>
              )}
            </For>
            <span class="flex-1" />
            <span class="text-xs text-zinc-500 dark:text-zinc-400">
              {plural(summarizeBlocks(screen()).total, "block")}
            </span>
          </div>
          <Switch>
            <Match when={app.tab() === "designer"}>
              <Designer screen={screen()} />
            </Match>
            <Match when={app.tab() === "blocks"}>
              <Blocks screen={screen()} />
            </Match>
            <Match when={app.tab() === "raw"}>
              <Raw screen={screen()} />
            </Match>
          </Switch>
        </div>
      )}
    </Show>
  );
}

function Designer(props: { screen: Screen }): JSX.Element {
  const app = useApp();
  const selected = () => app.component()?.name ?? props.screen.name;

  /** Top-level blocks that mention the selected component anywhere inside them. */
  const related = createMemo(() => {
    const name = selected();
    return props.screen.blocks.filter((top) =>
      Array.from(walkBlocks(top)).some(
        (block) =>
          block.mutation["instance_name"] === name && block.mutation["is_generic"] !== "true",
      ),
    );
  });

  return (
    <div class="grid grid-cols-1 gap-4 xl:grid-cols-2">
      <div class="flex flex-col gap-4">
        <LayoutPreview screen={props.screen} />
        <Card title="Component tree">
          <ComponentTree screen={props.screen.name} component={props.screen.form} />
        </Card>
      </div>
      <Card title={`Blocks that use ${selected()}`}>
        <div class="flex flex-col gap-4 overflow-x-auto">
          <For each={related()} fallback={<Empty>No blocks refer to this component.</Empty>}>
            {(block) => <BlockStack block={block} />}
          </For>
        </div>
      </Card>
    </div>
  );
}

const GROUPS: readonly (readonly [Group, string])[] = [
  ["events", "Event handlers"],
  ["procedures", "Procedures"],
  ["globals", "Global variables"],
  ["loose", "Loose blocks (never run)"],
];

function Blocks(props: { screen: Screen }): JSX.Element {
  const grouped = createMemo(() => {
    const groups: Record<Group, Block[]> = { events: [], procedures: [], globals: [], loose: [] };
    for (const block of props.screen.blocks) groups[groupOf(block)].push(block);
    return groups;
  });

  return (
    <Show
      when={props.screen.blocks.length > 0}
      fallback={<Empty>This screen has no blocks.</Empty>}
    >
      <div class="flex flex-col gap-4">
        <For each={GROUPS}>
          {([group, title]) => (
            <Show when={grouped()[group].length > 0}>
              <Card title={`${title} · ${grouped()[group].length}`}>
                <div class="flex flex-col gap-4 overflow-x-auto">
                  <For each={grouped()[group]}>{(block) => <BlockStack block={block} />}</For>
                </div>
              </Card>
            </Show>
          )}
        </For>
      </div>
    </Show>
  );
}

function Raw(props: { screen: Screen }): JSX.Element {
  const scm = () => serializeScm({ form: props.screen.form, meta: props.screen.meta.form });
  const bky = () => serializeBky({ blocks: props.screen.blocks, meta: props.screen.meta.blocks });
  /** The SCM payload is one long JSON line; indent it for reading. */
  const prettyScm = () => {
    const text = scm();
    try {
      return JSON.stringify(
        JSON.parse(text.slice(text.indexOf("{"), text.lastIndexOf("}") + 1)),
        null,
        2,
      );
    } catch {
      return text;
    }
  };

  return (
    <div class="flex flex-col gap-4">
      <Card title={`${props.screen.name}.scm`}>
        <Code text={prettyScm()} language="json" />
      </Card>
      <Card title={`${props.screen.name}.bky`}>
        <Show
          when={bky() !== ""}
          fallback={<Empty>The file is empty: this screen has no blocks.</Empty>}
        >
          <Code text={indentXml(bky())} language="xml" />
        </Show>
      </Card>
    </div>
  );
}
