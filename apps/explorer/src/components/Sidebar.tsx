import type { JSX } from "@solidjs/web";
import { mainScreenName } from "aia-kit";
import { Puzzle, Settings2, Smartphone, Workflow } from "lucide";
import { For, Show } from "solid-js";
import { assetIcon } from "../lib/icons.ts";
import { useApp } from "../state.ts";
import { Badge, ListRow, SectionLabel } from "./ui/index.ts";

/** Project navigation: everything in the archive, grouped by kind. */
export function Sidebar(): JSX.Element {
  const app = useApp();
  const selection = () => app.selection();
  const screens = () => app.project()?.screens ?? [];
  const assets = () => app.project()?.assets ?? [];
  const extensions = () => app.project()?.extensions ?? [];

  const problemCount = (screen: string) =>
    app.problems().filter((problem) => "screen" in problem && problem.screen === screen).length;
  const isScreen = (name: string) => {
    const s = selection();
    return s?.kind === "screen" && s.screen === name;
  };
  const isAsset = (name: string) => {
    const s = selection();
    return s?.kind === "asset" && s.name === name;
  };
  const isExtension = (packageName: string) => {
    const s = selection();
    return s?.kind === "extension" && s.packageName === packageName;
  };
  const main = () => {
    const project = app.project();
    return project ? mainScreenName(project) : "";
  };

  return (
    <nav class="flex min-h-0 flex-col gap-4 overflow-auto border-r border-zinc-200 p-2 dark:border-zinc-800">
      <Group label="Screens" count={screens().length}>
        <For each={screens()}>
          {(screen) => (
            <ListRow
              icon={Smartphone}
              selected={isScreen(screen.name)}
              onClick={() => app.selectComponent(screen.name)}
              trailing={
                <>
                  <Show when={screen.name === main()}>
                    <Badge tone="accent">start</Badge>
                  </Show>
                  <Show when={problemCount(screen.name) > 0}>
                    <Badge tone="warning">{problemCount(screen.name)}</Badge>
                  </Show>
                </>
              }
            >
              {screen.name}
            </ListRow>
          )}
        </For>
      </Group>

      <Group label="Assets" count={assets().length}>
        <For each={assets()} fallback={<None />}>
          {(asset) => (
            <ListRow
              icon={assetIcon(asset.name)}
              title={asset.name}
              selected={isAsset(asset.name)}
              onClick={() => app.select({ kind: "asset", name: asset.name })}
              trailing={
                <Show when={app.unusedAssets().has(asset.name)}>
                  <Badge tone="warning">unused</Badge>
                </Show>
              }
            >
              {asset.name}
            </ListRow>
          )}
        </For>
      </Group>

      <Group label="Extensions" count={extensions().length}>
        <For each={extensions()} fallback={<None />}>
          {(extension) => (
            <ListRow
              icon={Puzzle}
              title={extension.packageName}
              selected={isExtension(extension.packageName)}
              onClick={() => app.select({ kind: "extension", packageName: extension.packageName })}
            >
              {extension.components[0]?.name ?? extension.packageName}
            </ListRow>
          )}
        </For>
      </Group>

      <Group label="Project">
        <ListRow
          icon={Settings2}
          selected={selection()?.kind === "properties"}
          onClick={() => app.select({ kind: "properties" })}
        >
          Properties
        </ListRow>
        <ListRow
          icon={Workflow}
          selected={selection()?.kind === "navigation"}
          onClick={() => app.select({ kind: "navigation" })}
        >
          Screen flow
        </ListRow>
      </Group>
    </nav>
  );
}

function Group(props: { label: string; count?: number; children: JSX.Element }): JSX.Element {
  return (
    <div>
      <SectionLabel count={props.count} class="px-2 pb-1">
        {props.label}
      </SectionLabel>
      {props.children}
    </div>
  );
}

function None(): JSX.Element {
  return <div class="px-2 text-sm text-zinc-500">None</div>;
}
