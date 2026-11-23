import type { JSX } from "@solidjs/web";
import { ChartColumn, CircleX, TriangleAlert } from "lucide";
import { For, Show, createMemo } from "solid-js";
import { labelOf } from "../lib/blocks.ts";
import { formatBytes } from "../lib/format.ts";
import { computeInsights } from "../lib/insights.ts";
import { useApp } from "../state.ts";
import { Badge, BarList, Button, Card, Empty, Icon, PageHeader, Stat } from "./ui/index.ts";

/** A one-page summary of the project: its size, its shape, and what looks worth attention. */
export function InsightsView(): JSX.Element {
  const app = useApp();
  const insights = createMemo(() => {
    const project = app.project();
    return project ? computeInsights(project, app.problems()) : undefined;
  });

  return (
    <Show when={insights()}>
      {(data) => (
        <>
          <PageHeader icon={ChartColumn} title="Insights" />

          <div class="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
            <Stat label="Screens" value={data().totals.screens} />
            <Stat label="Components" value={data().totals.components} />
            <Stat label="Blocks" value={data().totals.blocks} />
            <Stat label="Assets" value={data().totals.assets} />
            <Stat label="Extensions" value={data().totals.extensions} />
            <Stat label="Size" value={formatBytes(data().totals.bytes)} note="uncompressed" />
          </div>

          <Card title="Screens">
            <div class="overflow-x-auto">
              <table class="w-full text-sm">
                <thead>
                  <tr class="text-left text-xs text-zinc-500 dark:text-zinc-400">
                    <th class="pb-1.5 font-medium">Screen</th>
                    <For
                      each={[
                        "Components",
                        "Blocks",
                        "Event handlers",
                        "Procedures",
                        "Globals",
                        "Nesting depth",
                        "Problems",
                      ]}
                    >
                      {(heading) => <th class="pb-1.5 pl-4 text-right font-medium">{heading}</th>}
                    </For>
                  </tr>
                </thead>
                <tbody class="divide-y divide-zinc-100 dark:divide-zinc-800">
                  <For each={data().screens}>
                    {(screen) => (
                      <tr>
                        <td class="py-1">
                          <Button variant="link" onClick={() => app.selectComponent(screen.name)}>
                            {screen.name}
                          </Button>
                        </td>
                        <For
                          each={[
                            screen.components,
                            screen.blocks,
                            screen.handlers,
                            screen.procedures,
                            screen.globals,
                            screen.depth,
                          ]}
                        >
                          {(value) => <td class="py-1 pl-4 text-right tabular-nums">{value}</td>}
                        </For>
                        <td class="py-1 pl-4 text-right tabular-nums">
                          <Show
                            when={screen.problems > 0}
                            fallback={<span class="text-zinc-400">0</span>}
                          >
                            <Badge tone="warning">{screen.problems}</Badge>
                          </Show>
                        </td>
                      </tr>
                    )}
                  </For>
                </tbody>
              </table>
            </div>
          </Card>

          <div class="grid grid-cols-1 items-start gap-4 lg:grid-cols-2">
            <Card title="What takes up space">
              <BarList
                items={data().size.map((part) => ({ ...part, display: formatBytes(part.value) }))}
              />
            </Card>

            <Card title="Largest assets" actions={<Badge>{data().totals.assets}</Badge>}>
              <Show
                when={data().largestAssets.length > 0}
                fallback={<Empty>This project has no assets.</Empty>}
              >
                <BarList
                  items={data().largestAssets.map((asset) => ({
                    label: asset.name,
                    value: asset.blob.size,
                    display: formatBytes(asset.blob.size),
                    onClick: () => app.select({ kind: "asset", name: asset.name }),
                  }))}
                />
              </Show>
            </Card>

            <Card title="Most used components">
              <BarList items={data().componentTypes} />
            </Card>

            <Card title="Most used blocks">
              <Show
                when={data().blockTypes.length > 0}
                fallback={<Empty>This project has no blocks.</Empty>}
              >
                <BarList mono items={data().blockTypes} />
              </Show>
            </Card>
          </div>

          <Card title="Worth a look">
            <div class="flex flex-col gap-4">
              <Finding
                title="Unused assets"
                count={data().unusedAssets.length}
                note={formatBytes(
                  data().unusedAssets.reduce((sum, asset) => sum + asset.blob.size, 0),
                )}
                empty="Every asset is referenced by name somewhere."
                hint="An asset whose name is put together by blocks at runtime looks unused here."
              >
                <For each={data().unusedAssets}>
                  {(asset) => (
                    <Button
                      variant="link"
                      onClick={() => app.select({ kind: "asset", name: asset.name })}
                    >
                      {asset.name}
                    </Button>
                  )}
                </For>
              </Finding>

              <Finding
                title="Unused extensions"
                count={data().unusedExtensions.length}
                empty="Every extension has a component on a screen."
              >
                <For each={data().unusedExtensions}>
                  {(extension) => (
                    <Button
                      variant="link"
                      onClick={() =>
                        app.select({ kind: "extension", packageName: extension.packageName })
                      }
                    >
                      {extension.packageName}
                    </Button>
                  )}
                </For>
              </Finding>

              <Finding
                title="Loose blocks"
                count={data().looseBlocks.length}
                note="never run"
                empty="Every top-level block is an event handler, procedure or global."
              >
                <For each={data().looseBlocks.slice(0, 12)}>
                  {(loose) => (
                    <Button
                      variant="link"
                      class="font-mono text-xs!"
                      onClick={() =>
                        app.revealBlock(
                          loose.screen,
                          loose.block.id === "" ? undefined : loose.block.id,
                        )
                      }
                    >
                      {loose.screen} · {labelOf(loose.block)}
                    </Button>
                  )}
                </For>
                <Show when={data().looseBlocks.length > 12}>
                  <Empty>and {data().looseBlocks.length - 12} more</Empty>
                </Show>
              </Finding>

              <Finding
                title="Disabled blocks"
                count={data().disabledBlocks}
                empty="No block is disabled."
              />
            </div>
          </Card>

          <Card title="Problems by kind" actions={<Badge>{app.problems().length}</Badge>}>
            <Show when={data().problemKinds.length > 0} fallback={<Empty>None found.</Empty>}>
              <div class="flex flex-col gap-1.5">
                <For each={data().problemKinds}>
                  {(kind) => (
                    <div class="flex items-center gap-2 text-sm">
                      <Show
                        when={kind.severity === "error"}
                        fallback={
                          <Icon
                            icon={TriangleAlert}
                            size={14}
                            label="Warning"
                            class="text-amber-600 dark:text-amber-400"
                          />
                        }
                      >
                        <Icon
                          icon={CircleX}
                          size={14}
                          label="Error"
                          class="text-red-600 dark:text-red-400"
                        />
                      </Show>
                      <span class="font-mono text-xs">{kind.label}</span>
                      <span class="ml-auto text-zinc-600 tabular-nums dark:text-zinc-400">
                        {kind.value}
                      </span>
                    </div>
                  )}
                </For>
              </div>
            </Show>
          </Card>
        </>
      )}
    </Show>
  );
}

/** One thing to check: a heading with its count, then either the items or a line saying all is well. */
function Finding(props: {
  title: string;
  count: number;
  note?: string;
  empty: string;
  /** A caveat shown under the items. */
  hint?: string;
  children?: JSX.Element;
}): JSX.Element {
  return (
    <div>
      <div class="flex items-baseline gap-2">
        <h4 class="text-sm font-medium">{props.title}</h4>
        <Badge tone={props.count > 0 ? "warning" : "neutral"}>{props.count}</Badge>
        <Show when={props.count > 0 && props.note !== undefined}>
          <span class="text-xs text-zinc-500 dark:text-zinc-400">{props.note}</span>
        </Show>
      </div>
      <Show when={props.count > 0} fallback={<Empty>{props.empty}</Empty>}>
        <div class="mt-1 flex flex-col items-start gap-0.5">{props.children}</div>
        <Show when={props.hint !== undefined}>
          <p class="mt-1 text-xs text-zinc-500 dark:text-zinc-400">{props.hint}</p>
        </Show>
      </Show>
    </div>
  );
}
