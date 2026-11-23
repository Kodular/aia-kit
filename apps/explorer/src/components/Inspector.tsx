import type { JSX } from "@solidjs/web";
import { walkComponents, type Component, type Screen } from "aia-kit";
import { lookupComponent } from "aia-kit/platforms";
import { ArrowLeft } from "lucide";
import { For, Show } from "solid-js";
import { plainText, simpleName } from "../lib/format.ts";
import { componentIcon } from "../lib/icons.ts";
import { useApp } from "../state.ts";
import { ComponentRow, ComponentTree } from "./ComponentTree.tsx";
import { PropertyValue } from "./PropertyValue.tsx";
import { Badge, Button, Empty, Icon, KeyValue, KeyValueList, SectionLabel } from "./ui/index.ts";

/**
 * The right-hand pane, shown for screens. It starts as the component list;
 * choosing a component (here or in the layout preview) swaps in its details,
 * and Back returns to the list.
 */
export function Inspector(): JSX.Element {
  const app = useApp();

  return (
    <aside class="min-h-0 overflow-auto border-l border-zinc-200 p-3 dark:border-zinc-800">
      <Show when={app.screen()}>
        {(screen) => (
          <Show when={app.component()} fallback={<ComponentList screen={screen()} />}>
            {(component) => (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  icon={ArrowLeft}
                  class="mb-3 -ml-1 py-1!"
                  onClick={() => app.selectComponent(screen().name)}
                >
                  Components
                </Button>
                <ComponentDetails component={component()} />
              </>
            )}
          </Show>
        )}
      </Show>
    </aside>
  );
}

/** The tree of visible components, then the non-visible ones as a flat list. */
function ComponentList(props: { screen: Screen }): JSX.Element {
  const app = useApp();
  const all = () => Array.from(walkComponents(props.screen));
  const nonVisible = () => all().filter((component) => app.isNonVisible(component));

  return (
    <div class="flex flex-col gap-4">
      <div>
        <SectionLabel count={all().length - nonVisible().length} class="px-2 pb-1">
          Components
        </SectionLabel>
        <ComponentTree screen={props.screen.name} component={props.screen.form} />
      </div>
      <Show when={nonVisible().length > 0}>
        <div>
          <SectionLabel count={nonVisible().length} class="px-2 pb-1">
            Non-visible
          </SectionLabel>
          <For each={nonVisible()}>
            {(component) => <ComponentRow screen={props.screen.name} component={component} />}
          </For>
        </div>
      </Show>
    </div>
  );
}

function ComponentDetails(props: { component: Component }): JSX.Element {
  const app = useApp();

  const descriptor = () => {
    const platform = app.platform();
    return platform ? lookupComponent(props.component.type, platform, app.project()) : undefined;
  };
  const help = () => plainText(descriptor()?.helpString ?? "");
  const properties = () => Object.entries(props.component.properties);
  const editorOf = (name: string) =>
    descriptor()?.properties.find((property) => property.name === name)?.editorType;

  return (
    <div class="flex flex-col gap-4 px-2">
      <div>
        <div class="flex items-center gap-2">
          <Icon
            icon={componentIcon(props.component.type)}
            class="text-zinc-500 dark:text-zinc-400"
          />
          <h2 class="min-w-0 text-base font-medium break-words">{props.component.name}</h2>
        </div>
        <div class="mt-1.5 flex flex-wrap gap-1">
          <Badge>{simpleName(props.component.type)}</Badge>
          <Show when={props.component.version !== undefined}>
            <Badge>v{props.component.version}</Badge>
          </Show>
          <Show when={descriptor()?.external}>
            <Badge tone="accent">extension</Badge>
          </Show>
          <Show when={descriptor()?.nonVisible}>
            <Badge>non-visible</Badge>
          </Show>
        </div>
        <Show when={help() !== ""}>
          <p class="mt-2 line-clamp-4 text-xs text-zinc-600 dark:text-zinc-400" title={help()}>
            {help()}
          </p>
        </Show>
      </div>

      <div>
        <SectionLabel count={properties().length} class="pb-1">
          Properties
        </SectionLabel>
        <Show when={properties().length > 0} fallback={<Empty>All defaults.</Empty>}>
          <KeyValueList>
            <For each={properties()}>
              {([name, value]) => (
                <KeyValue label={name}>
                  <PropertyValue name={name} value={value} editorType={editorOf(name)} />
                </KeyValue>
              )}
            </For>
          </KeyValueList>
        </Show>
      </div>
    </div>
  );
}
