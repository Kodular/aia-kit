import type { JSX } from "@solidjs/web";
import { walkBlocks, type Block, type Screen } from "aia-kit";
import { serializeBky, serializeScm } from "aia-kit/formats";
import { Blocks as BlocksIcon, Braces, LayoutPanelTop, Smartphone } from "lucide";
import { For, Match, Show, Switch, createEffect, createMemo, createSignal } from "solid-js";
import { groupOf, type Group } from "../lib/blocks.ts";
import { plural } from "../lib/format.ts";
import { indentXml } from "../lib/highlight.ts";
import { useApp, type Tab } from "../state.ts";
import { BlockStack } from "./BlockOutline.tsx";
import { Code } from "./Code.tsx";
import { LayoutPreview } from "./LayoutPreview.tsx";
import { Badge, Card, Empty, PageHeader, Tabs, type TabItem } from "./ui/index.ts";

const TABS: readonly TabItem<Tab>[] = [
  { id: "designer", label: "Designer", icon: LayoutPanelTop },
  { id: "blocks", label: "Blocks", icon: BlocksIcon },
  { id: "raw", label: "Raw files", icon: Braces },
];

export function ScreenView(): JSX.Element {
  const app = useApp();
  return (
    <Show when={app.screen()} fallback={<Empty>This screen no longer exists.</Empty>}>
      {(screen) => (
        <>
          <PageHeader
            icon={Smartphone}
            title={screen().name}
            actions={<Tabs value={app.tab()} onChange={(tab) => app.setTab(tab)} items={TABS} />}
          >
            <Badge>{plural(Array.from(walkBlocks(screen())).length, "block")}</Badge>
          </PageHeader>
          <Switch>
            <Match when={app.tab() === "designer"}>
              <Designer screen={screen()} />
            </Match>
            <Match when={app.tab() === "blocks"}>
              <BlocksTab screen={screen()} />
            </Match>
            <Match when={app.tab() === "raw"}>
              <Raw screen={screen()} />
            </Match>
          </Switch>
        </>
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
    <div class="grid grid-cols-1 items-start gap-4 xl:grid-cols-2">
      <LayoutPreview screen={props.screen} />
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

function BlocksTab(props: { screen: Screen }): JSX.Element {
  const grouped = createMemo(() => {
    const groups: Record<Group, Block[]> = { events: [], procedures: [], globals: [], loose: [] };
    for (const block of props.screen.blocks) groups[groupOf(block)].push(block);
    return groups;
  });

  // Scroll to a block that search asked to reveal, once it is on screen.
  const app = useApp();
  createEffect(
    () => app.revealedBlock(),
    (id) => {
      if (id === undefined) return;
      requestAnimationFrame(() => {
        document
          .querySelector(`[data-block-id="${CSS.escape(id)}"]`)
          ?.scrollIntoView({ block: "center" });
      });
    },
  );

  return (
    <Show
      when={props.screen.blocks.length > 0}
      fallback={<Empty>This screen has no blocks.</Empty>}
    >
      <For each={GROUPS}>
        {([group, title]) => (
          <Show when={grouped()[group].length > 0}>
            <Card title={title} actions={<Badge>{grouped()[group].length}</Badge>}>
              <div class="flex flex-col gap-4 overflow-x-auto">
                <For each={grouped()[group]}>{(block) => <BlockStack block={block} />}</For>
              </div>
            </Card>
          </Show>
        )}
      </For>
    </Show>
  );
}

type RawFile = "scm" | "bky";

function Raw(props: { screen: Screen }): JSX.Element {
  const [file, setFile] = createSignal<RawFile>("scm");
  const files: readonly TabItem<RawFile>[] = [
    { id: "scm", label: ".scm" },
    { id: "bky", label: ".bky" },
  ];

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
    <Card>
      <div class="mb-3 border-b border-zinc-200 pb-3 dark:border-zinc-800">
        <Tabs mono value={file()} onChange={setFile} items={files} />
      </div>
      <Switch>
        <Match when={file() === "scm"}>
          <Code text={prettyScm()} language="json" />
        </Match>
        <Match when={file() === "bky"}>
          <Show
            when={bky() !== ""}
            fallback={<Empty>The file is empty: this screen has no blocks.</Empty>}
          >
            <Code text={indentXml(bky())} language="xml" />
          </Show>
        </Match>
      </Switch>
    </Card>
  );
}
