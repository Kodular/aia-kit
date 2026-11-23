import type { JSX } from "@solidjs/web";
import type { ChevronRight } from "lucide";

/** Anything Solid accepts for `class`: a string, an array, or an object of toggles. */
export type ClassValue = JSX.HTMLAttributes<HTMLElement>["class"];

/** Icon data from the `lucide` package: a list of SVG child elements. */
export type IconData = typeof ChevronRight;

const cache = new WeakMap<IconData, string>();

function markupOf(icon: IconData): string {
  let markup = cache.get(icon);
  if (markup === undefined) {
    markup = icon
      .map(([tag, attrs]) => {
        const attributes = Object.entries(attrs).map(
          ([name, value]) => `${name}="${String(value)}"`,
        );
        return `<${tag} ${attributes.join(" ")}/>`;
      })
      .join("");
    cache.set(icon, markup);
  }
  return markup;
}

/** A Lucide icon. Decorative by default; pass `label` when it stands alone and needs a name. */
export function Icon(props: {
  icon: IconData;
  size?: number;
  class?: ClassValue;
  label?: string;
}): JSX.Element {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={props.size ?? 16}
      height={props.size ?? 16}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
      class={["shrink-0", props.class]}
      role={props.label === undefined ? undefined : "img"}
      aria-label={props.label}
      aria-hidden={props.label === undefined ? "true" : undefined}
      innerHTML={markupOf(props.icon)}
    />
  );
}
