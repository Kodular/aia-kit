import type { JSX } from "@solidjs/web";
import type { Component, Screen } from "aia-kit";
import { Check, ChevronDown } from "lucide";
import { For, Match, Show, Switch } from "solid-js";
import { cssColor, simpleName } from "../lib/format.ts";
import {
  SCREEN,
  alignmentStyle,
  asParent,
  cellStyle,
  kindOf,
  shapeRadius,
  sizeStyle,
  tableStyle,
  textStyle,
  type Parent,
} from "../lib/layout.ts";
import { useApp } from "../state.ts";
import { Icon } from "./ui/index.ts";

/** How the preview marks the component under the pointer in the component tree. */
const HOVERED = "outline-2 outline-dashed outline-amber-500";

/**
 * An approximation of the screen in App Inventor's designer: nesting, table
 * grids, alignment, pixel / percent / fill-parent sizes, fonts, colours and
 * images. It is drawn on a 320 × 520 screen and is always light, like the
 * designer, so explicit component colours stay readable.
 */
export function LayoutPreview(props: { screen: Screen }): JSX.Element {
  const app = useApp();
  const form = () => props.screen.form;
  const visible = () => form().children.filter((child) => !app.isNonVisible(child));
  const background = () => app.assetUrls().get(form().properties["BackgroundImage"] ?? "");

  return (
    <div
      class="overflow-auto rounded-xl bg-zinc-200/60 p-3 dark:bg-zinc-800/60"
      onMouseLeave={() => app.hover(undefined)}
    >
      <div
        class={[
          "mx-auto flex shrink-0 flex-col overflow-hidden rounded-lg border border-zinc-300 bg-white text-zinc-900",
          app.hovered() === props.screen.name ? HOVERED : "",
        ]}
        style={{ width: `${SCREEN.width}px`, height: `${SCREEN.height}px` }}
        onClick={() => app.selectComponent(props.screen.name, props.screen.name)}
        onMouseOver={() => app.hover(props.screen.name)}
      >
        <Show when={form().properties["TitleVisible"] !== "False"}>
          <div class="shrink-0 border-b border-zinc-200 bg-zinc-100 px-3 py-2 text-sm font-medium">
            {form().properties["Title"] ?? props.screen.name}
          </div>
        </Show>
        <div
          class="flex min-h-0 flex-1 flex-col bg-cover bg-center"
          style={{
            ...alignmentStyle(form(), "column"),
            "background-color": cssColor(form().properties["BackgroundColor"] ?? ""),
            "background-image": background() ? `url("${background()}")` : undefined,
          }}
        >
          <For
            each={visible()}
            fallback={<span class="p-2 text-xs text-zinc-400">No visible components</span>}
          >
            {(child) => <Node screen={props.screen.name} component={child} parent="column" />}
          </For>
        </div>
      </div>
    </div>
  );
}

/** One component: a sized, selectable box with a drawing that depends on its kind. */
function Node(props: { screen: string; component: Component; parent: Parent }): JSX.Element {
  const app = useApp();
  const p = () => props.component.properties;
  const kind = () => kindOf(props.component);
  const children = () => props.component.children.filter((child) => !app.isNonVisible(child));
  const asset = (property: string) => app.assetUrls().get(p()[property] ?? "");
  /** Whether the designer gave it an explicit width or height (pixels, percent or fill parent). */
  const sized = () =>
    [p()["Width"], p()["Height"]].some((value) => value !== undefined && value !== "-1");

  /** Sprites are placed by coordinates; table cells by row and column. */
  const placement = () => {
    if (props.parent === "canvas") {
      return {
        position: "absolute",
        left: `${Number(p()["X"]) || 0}px`,
        top: `${Number(p()["Y"]) || 0}px`,
      };
    }
    return props.parent === "table" ? cellStyle(props.component) : {};
  };

  return (
    <div
      title={`${props.component.name} · ${simpleName(props.component.type)}`}
      onClick={(event) => {
        event.stopPropagation();
        app.selectComponent(props.screen, props.component.name);
      }}
      // Stop at the innermost component, so a container does not claim its children's hover.
      onMouseOver={(event) => {
        event.stopPropagation();
        app.hover(props.component.name);
      }}
      style={{ ...sizeStyle(props.component, props.parent), ...placement() }}
      class={[
        "flex max-w-full cursor-pointer text-sm -outline-offset-1",
        { "opacity-40": p()["Visible"] === "False" },
        app.component() === props.component
          ? "outline-2 outline-blue-500"
          : app.hovered() === props.component.name
            ? HOVERED
            : "hover:outline-1 hover:outline-zinc-400",
      ]}
    >
      <Switch>
        <Match when={kind() === "row" || kind() === "column"}>
          <div
            class={["flex min-h-4 min-w-4 flex-1", kind() === "row" ? "flex-row" : "flex-col"]}
            style={{
              ...alignmentStyle(props.component, kind() === "row" ? "row" : "column"),
              "background-color": cssColor(p()["BackgroundColor"] ?? ""),
            }}
          >
            <For each={children()} fallback={<Placeholder>{props.component.name}</Placeholder>}>
              {(child) => (
                <Node screen={props.screen} component={child} parent={asParent(kind())} />
              )}
            </For>
          </div>
        </Match>

        <Match when={kind() === "table"}>
          <div
            class="grid min-h-4 min-w-4 flex-1 items-start justify-start"
            style={tableStyle(props.component)}
          >
            <For each={children()} fallback={<Placeholder>{props.component.name}</Placeholder>}>
              {(child) => <Node screen={props.screen} component={child} parent="table" />}
            </For>
          </div>
        </Match>

        <Match when={kind() === "canvas"}>
          <div
            class="relative min-h-24 min-w-32 flex-1 overflow-hidden border border-zinc-200 bg-white bg-cover bg-center"
            style={{
              "background-color": cssColor(p()["BackgroundColor"] ?? ""),
              "background-image": asset("BackgroundImage")
                ? `url("${asset("BackgroundImage")}")`
                : undefined,
            }}
          >
            <For each={children()}>
              {(child) => <Node screen={props.screen} component={child} parent="canvas" />}
            </For>
          </div>
        </Match>

        <Match when={kind() === "sprite"}>
          <Show
            when={asset("Picture")}
            fallback={<Placeholder>{props.component.name}</Placeholder>}
          >
            {(url) => (
              <img
                src={url()}
                alt={props.component.name}
                class="size-full max-w-none object-fill"
              />
            )}
          </Show>
        </Match>

        <Match when={kind() === "ball"}>
          <span
            class="rounded-full"
            style={{
              width: `${(Number(p()["Radius"]) || 5) * 2}px`,
              height: `${(Number(p()["Radius"]) || 5) * 2}px`,
              "background-color": cssColor(p()["PaintColor"] ?? "") ?? "black",
            }}
          />
        </Match>

        <Match when={kind() === "button"}>
          <div
            class={[
              "relative flex flex-1 items-center justify-center overflow-hidden border border-zinc-300 bg-zinc-200",
              // A picture button is the size of its picture unless a size is set.
              asset("Image") ? "" : "px-3 py-1.5",
            ]}
            style={{
              ...textStyle(props.component, "center"),
              "border-radius": shapeRadius(props.component),
            }}
          >
            <Show when={asset("Image")}>
              {(url) => (
                <img
                  src={url()}
                  alt=""
                  class={sized() ? "absolute inset-0 size-full object-cover" : "block max-w-full"}
                />
              )}
            </Show>
            <span class={asset("Image") ? "absolute inset-0 flex items-center justify-center" : ""}>
              {p()["Text"] ?? (asset("Image") ? "" : props.component.name)}
            </span>
          </div>
        </Match>

        <Match when={kind() === "label"}>
          <div class="flex-1 px-0.5 whitespace-pre-wrap" style={textStyle(props.component, "left")}>
            {p()["Text"] || <span class="text-zinc-400">{props.component.name}</span>}
          </div>
        </Match>

        <Match when={kind() === "input"}>
          <div
            class="min-w-32 flex-1 border-b border-zinc-400 px-1 py-1"
            style={{
              ...textStyle(props.component, "left"),
              color: p()["Text"] ? undefined : "#a1a1aa",
            }}
          >
            {p()["Text"] || p()["Hint"] || props.component.name}
          </div>
        </Match>

        <Match when={kind() === "image"}>
          <Show
            when={asset("Picture")}
            fallback={
              <Placeholder>Image{p()["Picture"] ? ` · ${p()["Picture"]}` : ""}</Placeholder>
            }
          >
            {(url) => (
              <img
                src={url()}
                alt={props.component.name}
                class={[
                  "max-w-full",
                  // With an explicit size the picture fills the box; otherwise it keeps its own size.
                  sized() ? "size-full object-contain" : "",
                  { "object-fill": p()["ScalePictureToFit"] === "True" },
                ]}
              />
            )}
          </Show>
        </Match>

        <Match when={kind() === "check" || kind() === "switch"}>
          <div
            class="flex flex-1 items-center gap-2 px-1 py-1"
            style={textStyle(props.component, "left")}
          >
            <Show
              when={kind() === "switch"}
              fallback={
                <span class="flex size-4 shrink-0 items-center justify-center rounded-sm border border-zinc-500">
                  <Show when={p()["Checked"] === "True"}>
                    <Icon icon={Check} size={12} />
                  </Show>
                </span>
              }
            >
              <span>{p()["Text"] ?? props.component.name}</span>
              <span
                class={[
                  "flex h-4 w-7 shrink-0 items-center rounded-full px-0.5",
                  p()["On"] === "True" ? "justify-end bg-emerald-500" : "justify-start bg-zinc-300",
                ]}
              >
                <span class="size-3 rounded-full bg-white" />
              </span>
            </Show>
            <Show when={kind() === "check"}>
              <span>{p()["Text"] ?? props.component.name}</span>
            </Show>
          </div>
        </Match>

        <Match when={kind() === "slider"}>
          <Slider component={props.component} />
        </Match>

        <Match when={kind() === "list"}>
          <div class="min-w-32 flex-1 overflow-hidden bg-zinc-900 text-white">
            <For
              each={(p()["ElementsFromString"] ?? "")
                .split(",")
                .filter((item) => item.trim() !== "")}
              fallback={
                <div class="px-2 py-2 text-xs text-zinc-400">ListView · {props.component.name}</div>
              }
            >
              {(item) => <div class="border-b border-zinc-700 px-2 py-1.5">{item.trim()}</div>}
            </For>
          </div>
        </Match>

        <Match when={kind() === "spinner"}>
          <div class="flex min-w-24 flex-1 items-center justify-between gap-2 border-b border-zinc-400 px-1 py-1">
            <span>
              {p()["Selection"] ||
                (p()["ElementsFromString"] ?? "").split(",")[0] ||
                props.component.name}
            </span>
            <Icon icon={ChevronDown} size={14} />
          </div>
        </Match>

        <Match when={kind() === "other"}>
          <div class="flex min-w-24 flex-1 flex-col border border-dashed border-zinc-300">
            <Placeholder>
              {simpleName(props.component.type)} · {props.component.name}
            </Placeholder>
            <For each={children()}>
              {(child) => <Node screen={props.screen} component={child} parent="column" />}
            </For>
          </div>
        </Match>
      </Switch>
    </div>
  );
}

/** Stands in for something the preview does not draw, or an empty container. */
function Placeholder(props: { children: JSX.Element }): JSX.Element {
  return <span class="m-auto px-2 py-1.5 text-center text-xs text-zinc-400">{props.children}</span>;
}

function Slider(props: { component: Component }): JSX.Element {
  const fraction = () => {
    const p = props.component.properties;
    const min = Number(p["MinValue"] ?? 10);
    const max = Number(p["MaxValue"] ?? 50);
    const thumb = Number(p["ThumbPosition"] ?? 30);
    return max > min ? Math.min(1, Math.max(0, (thumb - min) / (max - min))) : 0;
  };
  return (
    <div class="flex min-w-24 flex-1 items-center px-2 py-2">
      <div class="relative h-1 flex-1 rounded-full bg-zinc-300">
        <div
          class="absolute inset-y-0 left-0 rounded-full bg-amber-500"
          style={{ width: `${fraction() * 100}%` }}
        />
        <div
          class="absolute top-1/2 size-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-amber-600"
          style={{ left: `${fraction() * 100}%` }}
        />
      </div>
    </div>
  );
}
