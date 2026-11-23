import type { JSX } from "@solidjs/web";
import type { ComponentDescriptor, Extension } from "aia-kit";
import { findExtensionUsage } from "aia-kit/analysis";
import { Puzzle } from "lucide";
import { For, Show, createMemo } from "solid-js";
import { formatBytes, plainText } from "../lib/format.ts";
import { useApp } from "../state.ts";
import { FileTree } from "./FileTree.tsx";
import { Badge, Button, Card, Disclosure, Empty, PageHeader } from "./ui/index.ts";

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
    const project = app.project();
    return project ? findExtensionUsage(project, props.extension) : [];
  });
  const totalSize = () => props.extension.files.reduce((sum, file) => sum + file.blob.size, 0);

  return (
    <>
      <PageHeader icon={Puzzle} title={props.extension.packageName}>
        <Badge>{formatBytes(totalSize())}</Badge>
        <Show when={users().length === 0}>
          <Badge tone="warning">unused</Badge>
        </Show>
      </PageHeader>

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
              <Button
                variant="link"
                onClick={() => app.selectComponent(user.screen, user.component, "designer")}
              >
                {user.screen} · {user.component}
              </Button>
            )}
          </For>
        </div>
      </Card>

      <Card title="Files" actions={<Badge>{props.extension.files.length}</Badge>}>
        <FileTree files={props.extension.files} />
      </Card>
    </>
  );
}

function DescriptorCard(props: { descriptor: ComponentDescriptor }): JSX.Element {
  const d = () => props.descriptor;

  /** Block properties joined with their designer entry, plus designer-only properties. */
  const properties = createMemo(() => {
    const designer = new Map(d().properties.map((property) => [property.name, property]));
    const rows = d().blockProperties.map((property) => ({
      name: property.name,
      type: property.type,
      access: property.access,
      description: plainText(property.description),
      deprecated: property.deprecated,
      designer: designer.get(property.name),
    }));
    const listed = new Set(rows.map((row) => row.name));
    for (const property of d().properties) {
      if (listed.has(property.name)) continue;
      rows.push({
        name: property.name,
        type: property.editorType,
        access: "invisible",
        description: "",
        deprecated: false,
        designer: property,
      });
    }
    return rows;
  });

  return (
    <Card>
      <div class="flex flex-wrap items-baseline gap-2">
        <h3 class="text-sm font-medium">{d().name}</h3>
        <Badge>v{d().version}</Badge>
        <Show when={d().nonVisible}>
          <Badge>non-visible</Badge>
        </Show>
        <Show when={d().androidMinSdk !== undefined}>
          <Badge>min SDK {d().androidMinSdk}</Badge>
        </Show>
      </div>
      <p class="mt-1 font-mono text-xs break-all text-zinc-500 dark:text-zinc-400">{d().type}</p>
      <Show when={plainText(d().helpString) !== ""}>
        <p class="mt-2 text-sm text-zinc-600 dark:text-zinc-400">{plainText(d().helpString)}</p>
      </Show>

      <Members title="Events" count={d().events.length}>
        <For each={d().events}>
          {(event) => (
            <Member
              signature={
                <>
                  <Keyword>when </Keyword>
                  <span class="font-medium">{event.name}</span>
                  <Params params={event.params} />
                </>
              }
              description={plainText(event.description)}
              deprecated={event.deprecated}
            />
          )}
        </For>
      </Members>

      <Members title="Methods" count={d().methods.length}>
        <For each={d().methods}>
          {(method) => (
            <Member
              signature={
                <>
                  <Keyword>call </Keyword>
                  <span class="font-medium">{method.name}</span>
                  <Params params={method.params} />
                  <Show when={method.returnType !== undefined}>
                    <Keyword> → </Keyword>
                    <TypeName>{method.returnType}</TypeName>
                  </Show>
                </>
              }
              description={plainText(method.description)}
              deprecated={method.deprecated}
            />
          )}
        </For>
      </Members>

      <Members title="Properties" count={properties().length}>
        <For each={properties()}>
          {(property) => (
            <Member
              signature={
                <>
                  <span class="font-medium">{property.name}</span>
                  <Keyword>: </Keyword>
                  <TypeName>{property.type}</TypeName>
                </>
              }
              description={property.description}
              deprecated={property.deprecated}
            >
              <Badge tone={property.access === "invisible" ? "neutral" : "accent"}>
                {property.access === "invisible" ? "designer only" : property.access}
              </Badge>
              <Show when={property.designer}>
                {(designer) => (
                  <Badge>
                    {designer().editorType}
                    {designer().defaultValue !== "" ? ` · default ${designer().defaultValue}` : ""}
                  </Badge>
                )}
              </Show>
            </Member>
          )}
        </For>
      </Members>
    </Card>
  );
}

/** A collapsible section of a descriptor card. Hidden entirely when empty. */
function Members(props: { title: string; count: number; children: JSX.Element }): JSX.Element {
  return (
    <Show when={props.count > 0}>
      <Disclosure class="mt-4" title={props.title} meta={props.count}>
        <div class="mt-1 divide-y divide-zinc-100 dark:divide-zinc-800">{props.children}</div>
      </Disclosure>
    </Show>
  );
}

function Member(props: {
  signature: JSX.Element;
  description: string;
  deprecated: boolean;
  children?: JSX.Element;
}): JSX.Element {
  return (
    <div class={["py-2", { "opacity-60": props.deprecated }]}>
      <div class="flex flex-wrap items-center gap-x-2 gap-y-1">
        <code class="font-mono text-xs">{props.signature}</code>
        {props.children}
        <Show when={props.deprecated}>
          <Badge tone="warning">deprecated</Badge>
        </Show>
      </div>
      <Show when={props.description !== ""}>
        <p class="mt-1 text-xs text-zinc-600 dark:text-zinc-400">{props.description}</p>
      </Show>
    </div>
  );
}

function Keyword(props: { children: JSX.Element }): JSX.Element {
  return <span class="text-zinc-500">{props.children}</span>;
}

function TypeName(props: { children: JSX.Element }): JSX.Element {
  return <span class="text-violet-700 dark:text-violet-300">{props.children}</span>;
}

function Params(props: {
  params: readonly { readonly name: string; readonly type: string }[];
}): JSX.Element {
  return (
    <>
      <Keyword>(</Keyword>
      <For each={props.params}>
        {(param, index) => (
          <>
            <Show when={index() > 0}>
              <Keyword>, </Keyword>
            </Show>
            {param.name}
            <Keyword>: </Keyword>
            <TypeName>{param.type}</TypeName>
          </>
        )}
      </For>
      <Keyword>)</Keyword>
    </>
  );
}
