import type { JSX } from "@solidjs/web";
import type { Component, Screen } from "aia-kit";
import { For, Match, Show, Switch } from "solid-js";
import { cssColor, simpleName } from "../lib/format.ts";
import { useApp } from "../state.ts";

/**
 * A schematic of the screen: real nesting and labels, not App Inventor's exact rendering.
 * The device frame is always light, like the real designer, so explicit component colours stay readable.
 */
export function LayoutPreview(props: { screen: Screen }): JSX.Element {
  const app = useApp();

  const isNonVisible = (component: Component) => app.isNonVisible(component);
  const form = () => props.screen.form;
  const visible = () => form().children.filter((child) => !isNonVisible(child));

  return (
    <div class="rounded-xl bg-zinc-200/60 p-3 dark:bg-zinc-800/60">
      <div
        class="mx-auto flex min-h-80 max-w-sm flex-col overflow-hidden rounded-lg border border-zinc-300 bg-white text-zinc-900"
        style={{ "background-color": cssColor(form().properties["BackgroundColor"] ?? "") }}
        onClick={() => app.selectComponent(props.screen.name, props.screen.name)}
      >
        <Show when={form().properties["TitleVisible"] !== "False"}>
          <div class="border-b border-zinc-200 bg-zinc-100 px-3 py-2 text-sm font-medium">
            {form().properties["Title"] ?? props.screen.name}
          </div>
        </Show>
        <div class="flex flex-1 flex-col items-start gap-2 p-2">
          <For
            each={visible()}
            fallback={<span class="text-xs text-zinc-400">No visible components</span>}
          >
            {(child) => <Node screen={props.screen.name} component={child} hidden={isNonVisible} />}
          </For>
        </div>
      </div>
    </div>
  );
}

type Kind = "row" | "column" | "button" | "label" | "input" | "image" | "check" | "other";

function kindOf(component: Component): Kind {
  const type = simpleName(component.type);
  if (type.includes("Arrangement")) return type.startsWith("Horizontal") ? "row" : "column";
  if (type === "Button" || type.endsWith("Picker")) return "button";
  if (type === "Label") return "label";
  if (type.endsWith("TextBox")) return "input";
  if (type === "Image") return "image";
  if (type === "CheckBox" || type === "Switch") return "check";
  return "other";
}

function Node(props: {
  screen: string;
  component: Component;
  hidden: (component: Component) => boolean;
  inRow?: boolean;
}): JSX.Element {
  const app = useApp();
  const p = () => props.component.properties;
  const kind = () => kindOf(props.component);
  const fills = () => p()["Width"] === "-2";
  const children = () => props.component.children.filter((child) => !props.hidden(child));
  const picture = () => app.assetUrls().get(p()["Picture"] ?? p()["Image"] ?? "");

  return (
    <div
      title={`${props.component.name} · ${simpleName(props.component.type)}`}
      onClick={(event) => {
        event.stopPropagation();
        app.selectComponent(props.screen, props.component.name);
      }}
      class={[
        "min-w-0 cursor-pointer rounded-md text-sm outline-offset-1",
        fills() ? (props.inRow ? "flex-1" : "self-stretch") : "",
        { "opacity-40": p()["Visible"] === "False" },
        app.component() === props.component
          ? "outline-2 outline-blue-500"
          : "hover:outline-1 hover:outline-zinc-400",
      ]}
    >
      <Switch>
        <Match when={kind() === "row" || kind() === "column"}>
          <div
            class={[
              "flex min-h-8 gap-2 rounded-md border border-dashed border-zinc-300 p-1.5",
              kind() === "row" ? "flex-row items-center" : "flex-col items-start",
            ]}
            style={{ "background-color": cssColor(p()["BackgroundColor"] ?? "") }}
          >
            <For
              each={children()}
              fallback={<span class="text-xs text-zinc-400">{props.component.name}</span>}
            >
              {(child) => (
                <Node
                  screen={props.screen}
                  component={child}
                  hidden={props.hidden}
                  inRow={kind() === "row"}
                />
              )}
            </For>
          </div>
        </Match>
        <Match when={kind() === "button"}>
          <div
            class="rounded-md border border-zinc-300 bg-zinc-100 px-3 py-1.5 text-center"
            style={{
              "background-color": cssColor(p()["BackgroundColor"] ?? ""),
              color: cssColor(p()["TextColor"] ?? ""),
            }}
          >
            <Show when={picture()} fallback={p()["Text"] ?? props.component.name}>
              {(url) => (
                <img
                  src={url()}
                  alt={props.component.name}
                  class="mx-auto max-h-24 object-contain"
                />
              )}
            </Show>
          </div>
        </Match>
        <Match when={kind() === "label"}>
          <div class="px-1 py-0.5" style={{ color: cssColor(p()["TextColor"] ?? "") }}>
            {p()["Text"] || <span class="text-zinc-400">{props.component.name}</span>}
          </div>
        </Match>
        <Match when={kind() === "input"}>
          <div class="min-w-32 rounded-md border border-zinc-300 px-2 py-1 text-zinc-400">
            {p()["Text"] || p()["Hint"] || props.component.name}
          </div>
        </Match>
        <Match when={kind() === "image"}>
          <Show
            when={picture()}
            fallback={
              <div class="rounded-md border border-dashed border-zinc-300 px-3 py-4 text-center text-xs text-zinc-500">
                Image · {p()["Picture"] ?? "no picture"}
              </div>
            }
          >
            {(url) => (
              <img
                src={url()}
                alt={props.component.name}
                class="max-h-40 rounded-md object-contain"
              />
            )}
          </Show>
        </Match>
        <Match when={kind() === "check"}>
          <div class="flex items-center gap-2 px-1 py-0.5">
            <span class="size-3.5 rounded-sm border border-zinc-400" />
            {p()["Text"] ?? props.component.name}
          </div>
        </Match>
        <Match when={kind() === "other"}>
          <div class="rounded-md border border-dashed border-zinc-300 px-3 py-2 text-xs text-zinc-600">
            <div>
              {simpleName(props.component.type)} · {props.component.name}
            </div>
            <Show when={children().length > 0}>
              <div class="mt-2 flex flex-col items-start gap-2">
                <For each={children()}>
                  {(child) => (
                    <Node screen={props.screen} component={child} hidden={props.hidden} />
                  )}
                </For>
              </div>
            </Show>
          </div>
        </Match>
      </Switch>
    </div>
  );
}
