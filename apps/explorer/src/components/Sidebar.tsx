import type { JSX } from "@solidjs/web";
import { For, Show } from "solid-js";
import { useApp } from "../state.ts";
import { Badge, Row, SectionLabel } from "./ui.tsx";

export function Sidebar(): JSX.Element {
  const app = useApp();
  const selection = () => app.selection();
  const problemCount = (screen: string) =>
    app.problems().filter((p) => "screen" in p && p.screen === screen).length;

  return (
    <nav class="min-h-0 overflow-auto border-r border-zinc-200 px-2 pb-4 dark:border-zinc-800">
      <SectionLabel>Screens</SectionLabel>
      <For each={app.project()?.screens ?? []}>
        {(screen) => (
          <Row
            selected={(() => {
              const s = selection();
              return s?.kind === "screen" && s.screen === screen.name;
            })()}
            onClick={() => app.selectComponent(screen.name)}
          >
            <span class="min-w-0 flex-1 truncate">{screen.name}</span>
            <Show when={problemCount(screen.name) > 0}>
              <Badge tone="warning">{problemCount(screen.name)}</Badge>
            </Show>
          </Row>
        )}
      </For>

      <SectionLabel>Assets</SectionLabel>
      <For
        each={app.project()?.assets ?? []}
        fallback={<div class="px-2 text-sm text-zinc-500">None</div>}
      >
        {(asset) => (
          <Row
            title={asset.name}
            selected={(() => {
              const s = selection();
              return s?.kind === "asset" && s.name === asset.name;
            })()}
            onClick={() => app.select({ kind: "asset", name: asset.name })}
          >
            <span class="min-w-0 flex-1 truncate">{asset.name}</span>
            <Show when={app.unusedAssets().has(asset.name)}>
              <Badge tone="warning">unused</Badge>
            </Show>
          </Row>
        )}
      </For>

      <SectionLabel>Extensions</SectionLabel>
      <For
        each={app.project()?.extensions ?? []}
        fallback={<div class="px-2 text-sm text-zinc-500">None</div>}
      >
        {(extension) => (
          <Row
            title={extension.packageName}
            selected={(() => {
              const s = selection();
              return s?.kind === "extension" && s.packageName === extension.packageName;
            })()}
            onClick={() => app.select({ kind: "extension", packageName: extension.packageName })}
          >
            <span class="min-w-0 flex-1 truncate">
              {extension.components[0]?.name ?? extension.packageName}
            </span>
          </Row>
        )}
      </For>

      <SectionLabel>Project</SectionLabel>
      <Row
        selected={selection()?.kind === "properties"}
        onClick={() => app.select({ kind: "properties" })}
      >
        Properties
      </Row>
      <Row
        selected={selection()?.kind === "navigation"}
        onClick={() => app.select({ kind: "navigation" })}
      >
        Navigation
      </Row>
    </nav>
  );
}
