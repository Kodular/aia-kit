import type { JSX } from "@solidjs/web";
import type { Asset } from "aia-kit";
import { findAssetReferences, type AssetReference } from "aia-kit/analysis";
import { For, Loading, Match, Show, Switch, createMemo, createSignal } from "solid-js";
import { formatBytes } from "../lib/format.ts";
import { languageOf } from "../lib/highlight.ts";
import { assetIcon, isTextAsset } from "../lib/icons.ts";
import { mimeOf, useApp } from "../state.ts";
import { Code } from "./Code.tsx";
import { Badge, Button, Card, Empty, PageHeader } from "./ui/index.ts";

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
  const isText = () => isTextAsset(props.asset.name);
  const text = createMemo(() => (isText() ? props.asset.blob.slice(0, PREVIEW_LIMIT).text() : ""));

  const references = createMemo(() => {
    const project = app.project();
    return project
      ? findAssetReferences(project).filter((ref) => ref.asset === props.asset.name)
      : [];
  });

  // Facts the browser reports once the media has loaded. Re-derived (cleared) when the asset changes.
  const [media, setMedia] = createSignal<{ width?: number; height?: number; duration?: number }>(
    () => {
      void props.asset;
      return {};
    },
  );
  const dimensions = () => {
    const { width, height } = media();
    return width && height ? `${width} × ${height} px` : undefined;
  };
  const duration = () => {
    const seconds = media().duration;
    if (seconds === undefined || !Number.isFinite(seconds)) return undefined;
    const whole = Math.round(seconds);
    return whole < 60
      ? `${seconds.toFixed(1)} s`
      : `${Math.floor(whole / 60)}:${String(whole % 60).padStart(2, "0")}`;
  };

  const open = (ref: AssetReference) => {
    if (ref.kind === "icon") return app.select({ kind: "properties" });
    if (ref.kind === "property") return app.selectComponent(ref.screen, ref.component, "designer");
    app.selectComponent(ref.screen, undefined, "blocks");
  };
  const describe = (ref: AssetReference) => {
    if (ref.kind === "icon") return "App icon";
    if (ref.kind === "property") {
      // A screen's form shares the screen's name; do not say it twice.
      const owner = ref.component === ref.screen ? "" : `${ref.component}.`;
      return `${ref.screen} · ${owner}${ref.property}`;
    }
    return `${ref.screen} · text block`;
  };

  return (
    <>
      <PageHeader icon={assetIcon(props.asset.name)} title={props.asset.name}>
        <Badge>{formatBytes(props.asset.blob.size)}</Badge>
        <Show when={dimensions()}>{(value) => <Badge>{value()}</Badge>}</Show>
        <Show when={duration()}>{(value) => <Badge>{value()}</Badge>}</Show>
        <Show when={app.unusedAssets().has(props.asset.name)}>
          <Badge tone="warning">unused</Badge>
        </Show>
      </PageHeader>

      <Card title="Preview">
        <Switch fallback={<Empty>No preview for this file type.</Empty>}>
          <Match when={mime().startsWith("image/")}>
            <img
              src={url()}
              alt={props.asset.name}
              class="max-h-96 rounded-md object-contain"
              onLoad={(event) =>
                setMedia({
                  width: event.currentTarget.naturalWidth,
                  height: event.currentTarget.naturalHeight,
                })
              }
            />
          </Match>
          <Match when={mime().startsWith("audio/")}>
            <audio
              controls
              src={url()}
              class="w-full"
              onLoadedMetadata={(event) => setMedia({ duration: event.currentTarget.duration })}
            />
          </Match>
          <Match when={mime().startsWith("video/")}>
            <video
              controls
              src={url()}
              class="max-h-96 rounded-md"
              onLoadedMetadata={(event) =>
                setMedia({
                  width: event.currentTarget.videoWidth,
                  height: event.currentTarget.videoHeight,
                  duration: event.currentTarget.duration,
                })
              }
            />
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
              <Button variant="link" onClick={() => open(ref)}>
                {describe(ref)}
              </Button>
            )}
          </For>
        </div>
      </Card>
    </>
  );
}
