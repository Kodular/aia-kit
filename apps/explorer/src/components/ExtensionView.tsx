import type { JSX } from "@solidjs/web";
import { walkComponents, type ComponentDescriptor, type Extension } from "aia-kit";
import { For, Show, createMemo } from "solid-js";
import { formatBytes, plural } from "../lib/format.ts";
import { useApp } from "../state.ts";
import { Badge, Card, Empty } from "./ui.tsx";

export function ExtensionView(): JSX.Element {
  const app = useApp();
  const extension = () => {
    const selection = app.selection();
    return selection?.kind === "extension"
      ? app
          .project()
          ?.extensions.find((candidate) => candidate.packageName === selection.packageName)
      : undefined;
  };

  return (
    <Show when={extension()} fallback={<Empty>This extension no longer exists.</Empty>}>
      {(found) => <ExtensionDetails extension={found()} />}
    </Show>
  );
}

function ExtensionDetails(props: { extension: Extension }): JSX.Element {
  const app = useApp();

  const users = createMemo(() => {
    const types = new Set(props.extension.components.map((descriptor) => descriptor.type));
    return (app.project()?.screens ?? []).flatMap((screen) =>
      Array.from(walkComponents(screen))
        .filter((component) => types.has(component.type))
        .map((component) => ({ screen: screen.name, component: component.name })),
    );
  });
  const totalSize = () => props.extension.files.reduce((sum, file) => sum + file.blob.size, 0);

  return (
    <div class="flex flex-col gap-4">
      <div class="flex flex-wrap items-center gap-2">
        <h2 class="text-base font-medium">{props.extension.packageName}</h2>
        <Badge>{formatBytes(totalSize())}</Badge>
        <Show when={users().length === 0}>
          <Badge tone="warning">unused</Badge>
        </Show>
      </div>

      <For each={props.extension.components}>
        {(descriptor) => <DescriptorCard descriptor={descriptor} />}
      </For>

      <Card title="Used by">
        <div class="flex flex-col items-start gap-1">
          <For
            each={users()}
            fallback={<Empty>No screen uses a component from this extension.</Empty>}
          >
            {(user) => (
              <button
                type="button"
                class="text-sm text-blue-600 hover:underline dark:text-blue-400"
                onClick={() => {
                  app.selectComponent(user.screen, user.component);
                  app.setTab("designer");
                }}
              >
                {user.screen} · {user.component}
              </button>
            )}
          </For>
        </div>
      </Card>

      <Card title={`Files · ${props.extension.files.length}`}>
        <For each={props.extension.files}>
          {(file) => (
            <div class="flex justify-between gap-4 border-b border-zinc-100 py-1 font-mono text-xs last:border-0 dark:border-zinc-800">
              <span class="truncate">{file.path}</span>
              <span class="shrink-0 text-zinc-500">{formatBytes(file.blob.size)}</span>
            </div>
          )}
        </For>
      </Card>
    </div>
  );
}

function DescriptorCard(props: { descriptor: ComponentDescriptor }): JSX.Element {
  const members = () =>
    [
      [
        "Events",
        props.descriptor.events.map((event) => ({
          name: event.name,
          description: event.description,
        })),
      ],
      [
        "Methods",
        props.descriptor.methods.map((method) => ({
          name: method.name,
          description: method.description,
        })),
      ],
      [
        "Properties",
        props.descriptor.blockProperties.map((property) => ({
          name: property.name,
          description: property.description,
        })),
      ],
    ] as const;

  return (
    <Card title={`${props.descriptor.name} · v${props.descriptor.version}`}>
      <p class="mb-3 text-sm text-zinc-600 dark:text-zinc-400">
        {props.descriptor.helpString.replace(/<[^>]+>/g, "").trim() || props.descriptor.type}
      </p>
      <For each={members()}>
        {([title, items]) => (
          <Show when={items.length > 0}>
            <div class="mb-2">
              <div class="mb-1 text-xs text-zinc-500 dark:text-zinc-400">
                {plural(items.length, title.slice(0, -1).toLowerCase())}
              </div>
              <div class="flex flex-wrap gap-1">
                <For each={items}>
                  {(item) => (
                    <span
                      title={item.description}
                      class="rounded-md bg-zinc-100 px-1.5 py-0.5 font-mono text-xs dark:bg-zinc-800"
                    >
                      {item.name}
                    </span>
                  )}
                </For>
              </div>
            </div>
          </Show>
        )}
      </For>
    </Card>
  );
}
