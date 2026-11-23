import type { JSX } from "@solidjs/web";
import type { Asset } from "aia-kit";
import { findAssetReferences, type AssetReference } from "aia-kit/analysis";
import { For, Loading, Match, Show, Switch, createMemo } from "solid-js";
import { formatBytes } from "../lib/format.ts";
import { languageOf } from "../lib/highlight.ts";
import { extensionOf, mimeOf, useApp } from "../state.ts";
import { Code } from "./Code.tsx";
import { Badge, Card, Empty } from "./ui.tsx";

const TEXT_TYPES = new Set([
  "txt",
  "json",
  "csv",
  "xml",
  "html",
  "htm",
  "js",
  "css",
  "md",
  "svg",
  "yail",
]);
const PREVIEW_LIMIT = 20_000;

export function AssetView(): JSX.Element {
  const app = useApp();
  const asset = () => {
    const selection = app.selection();
    return selection?.kind === "asset"
      ? app.project()?.assets.find((candidate) => candidate.name === selection.name)
      : undefined;
  };

  return (
    <Show when={asset()} fallback={<Empty>This asset no longer exists.</Empty>}>
      {(found) => <AssetDetails asset={found()} />}
    </Show>
  );
}

function AssetDetails(props: { asset: Asset }): JSX.Element {
  const app = useApp();
  const mime = () => mimeOf(props.asset.name);
  const url = () => app.assetUrls().get(props.asset.name);
  const isText = () => TEXT_TYPES.has(extensionOf(props.asset.name));
  const text = createMemo(() => (isText() ? props.asset.blob.slice(0, PREVIEW_LIMIT).text() : ""));

  const references = createMemo(() => {
    const project = app.project();
    return project
      ? findAssetReferences(project).filter((ref) => ref.asset === props.asset.name)
      : [];
  });

  const open = (ref: AssetReference) => {
    if (ref.kind === "icon") return app.select({ kind: "properties" });
    app.selectComponent(ref.screen, ref.kind === "property" ? ref.component : undefined);
    app.setTab(ref.kind === "property" ? "designer" : "blocks");
  };
  const describe = (ref: AssetReference) => {
    if (ref.kind === "icon") return "App icon";
    if (ref.kind === "property") return `${ref.screen} · ${ref.component}.${ref.property}`;
    return `${ref.screen} · text block`;
  };

  return (
    <div class="flex flex-col gap-4">
      <div class="flex items-center gap-2">
        <h2 class="text-base font-medium">{props.asset.name}</h2>
        <Badge>{formatBytes(props.asset.blob.size)}</Badge>
        <Show when={app.unusedAssets().has(props.asset.name)}>
          <Badge tone="warning">unused</Badge>
        </Show>
      </div>

      <Card title="Preview">
        <Switch fallback={<Empty>No preview for this file type.</Empty>}>
          <Match when={mime().startsWith("image/")}>
            <img src={url()} alt={props.asset.name} class="max-h-96 rounded-md object-contain" />
          </Match>
          <Match when={mime().startsWith("audio/")}>
            <audio controls src={url()} class="w-full" />
          </Match>
          <Match when={mime().startsWith("video/")}>
            <video controls src={url()} class="max-h-96 rounded-md" />
          </Match>
          <Match when={isText()}>
            <Loading fallback={<Empty>Reading…</Empty>}>
              <Code text={text()} language={languageOf(props.asset.name)} />
            </Loading>
          </Match>
        </Switch>
      </Card>

      <Card title="Used in">
        <div class="flex flex-col items-start gap-1">
          <For
            each={references()}
            fallback={
              <Empty>
                Nothing refers to this asset by name. It may still be used through a name built at
                runtime.
              </Empty>
            }
          >
            {(ref) => (
              <button
                type="button"
                class="text-sm text-blue-600 hover:underline dark:text-blue-400"
                onClick={() => open(ref)}
              >
                {describe(ref)}
              </button>
            )}
          </For>
        </div>
      </Card>
    </div>
  );
}
