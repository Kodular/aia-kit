import type { JSX } from "@solidjs/web";
import { For, Show, createSignal, onSettled } from "solid-js";
import { Button } from "./Button.tsx";
import { Icon, type IconData } from "./Icon.tsx";

export interface MenuItem {
  readonly label: string;
  readonly icon?: IconData;
  /** Either run something… */
  readonly onSelect?: () => void;
  /** …or go somewhere, in a new tab. */
  readonly href?: string;
}

/** A button that opens a short list of actions below it. */
export function Menu(props: {
  icon: IconData;
  label: string;
  items: readonly MenuItem[];
}): JSX.Element {
  const [open, setOpen] = createSignal(false);
  let container: HTMLDivElement | undefined;

  // Close on a click elsewhere or on Escape, as menus do.
  onSettled(() => {
    const onPointerDown = (event: PointerEvent) => {
      if (container && !container.contains(event.target as Node)) setOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  });

  const itemClass =
    "flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm whitespace-nowrap hover:bg-zinc-100 dark:hover:bg-zinc-800";

  return (
    <div ref={(el) => (container = el)} class="relative">
      <Button
        variant="ghost"
        icon={props.icon}
        title={props.label}
        class="py-1.5!"
        onClick={() => setOpen((value) => !value)}
      />
      <Show when={open()}>
        <div
          role="menu"
          aria-label={props.label}
          class="absolute top-full right-0 z-30 mt-1 min-w-44 rounded-lg border border-zinc-200 bg-white p-1 shadow-lg dark:border-zinc-700 dark:bg-zinc-900"
        >
          <For each={props.items}>
            {(item) => (
              <Show
                when={item.href}
                fallback={
                  <button
                    type="button"
                    role="menuitem"
                    class={itemClass}
                    onClick={() => {
                      setOpen(false);
                      item.onSelect?.();
                    }}
                  >
                    <Show when={item.icon}>
                      {(icon) => <Icon icon={icon()} size={14} class="text-zinc-400" />}
                    </Show>
                    {item.label}
                  </button>
                }
              >
                {(href) => (
                  <a
                    role="menuitem"
                    href={href()}
                    target="_blank"
                    rel="noreferrer"
                    class={itemClass}
                    onClick={() => setOpen(false)}
                  >
                    <Show when={item.icon}>
                      {(icon) => <Icon icon={icon()} size={14} class="text-zinc-400" />}
                    </Show>
                    {item.label}
                  </a>
                )}
              </Show>
            )}
          </For>
        </div>
      </Show>
    </div>
  );
}
