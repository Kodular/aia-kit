import type { JSX } from "@solidjs/web";
import { Show } from "solid-js";
import { cssColor } from "../lib/format.ts";
import { describeProperty } from "../lib/properties.ts";
import { useApp } from "../state.ts";
import { Button } from "./ui/index.ts";

/**
 * A property value as the designer would show it: coded values are decoded
 * (`-2` → "Fill parent"), colours get a swatch, and asset names link to the asset.
 * The stored value stays available as a tooltip.
 */
export function PropertyValue(props: {
  name: string;
  value: string;
  /** From the component descriptor, when there is one. */
  editorType?: string | undefined;
}): JSX.Element {
  const app = useApp();
  const color = () => cssColor(props.value);
  const isAsset = () => app.project()?.assets.some((asset) => asset.name === props.value) ?? false;
  const decoded = () => describeProperty(props.name, props.value, props.editorType);
  const plain = () => (color() ? props.value.slice(2) : props.value);

  return (
    <>
      <Show when={color()}>
        <span
          class="mr-1.5 inline-block size-3 rounded-sm border border-zinc-300 align-[-1px] dark:border-zinc-600"
          style={{ "background-color": color() }}
        />
      </Show>
      <Show
        when={isAsset()}
        fallback={
          <Show when={decoded()} fallback={plain()}>
            {(text) => <span title={`Stored as ${props.value}`}>{text()}</span>}
          </Show>
        }
      >
        <Button variant="link" onClick={() => app.select({ kind: "asset", name: props.value })}>
          {props.value}
        </Button>
      </Show>
    </>
  );
}
