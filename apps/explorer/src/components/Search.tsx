import type { JSX } from "@solidjs/web";
import { Blocks, Puzzle, Search as SearchIcon, SlidersHorizontal, Smartphone } from "lucide";
import { For, Show, createMemo, createSignal, onSettled } from "solid-js";
import { assetIcon, componentIcon } from "../lib/icons.ts";
import { KIND_LABEL, buildIndex, search, splitMatch, type SearchEntry } from "../lib/search.ts";
import { useApp } from "../state.ts";
import { Icon, type IconData } from "./ui/index.ts";

function iconOf(entry: SearchEntry): IconData {
  switch (entry.kind) {
    case "screen":
      return Smartphone;
    case "component":
      return componentIcon(entry.componentType ?? "");
    case "property":
      return SlidersHorizontal;
    case "block":
      return Blocks;
    case "asset":
      return assetIcon(entry.title);
    case "extension":
      return Puzzle;
  }
}

/**
 * Project-wide search in the top bar. Finds screens, components, property
 * values, blocks, assets and extensions; Enter or a click goes there.
 * Focus it with `/` or Ctrl/Cmd+K.
 */
export function Search(): JSX.Element {
  const app = useApp();
  let input: HTMLInputElement | undefined;

  const [query, setQuery] = createSignal("");
  const [open, setOpen] = createSignal(false);
  const [active, setActive] = createSignal(0);

  const index = createMemo(() => {
    const project = app.project();
    return project ? buildIndex(project) : [];
  });
  const groups = createMemo(() => search(index(), query()));
  /** Results in display order, for keyboard navigation. */
  const flat = createMemo(() => groups().flatMap((group) => group.results));

  const go = (entry: SearchEntry) => {
    if (entry.kind === "block" && entry.target.kind === "screen")
      app.revealBlock(entry.target.screen, entry.blockId);
    else app.select(entry.target, entry.tab);
    setOpen(false);
    setQuery("");
    if (input) input.value = "";
    input?.blur();
  };

  const onKeyDown = (event: KeyboardEvent) => {
    const count = flat().length;
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      if (count > 0) setActive((i) => (i + (event.key === "ArrowDown" ? 1 : count - 1)) % count);
    } else if (event.key === "Enter") {
      const entry = flat()[active()];
      if (entry) go(entry);
    } else if (event.key === "Escape") {
      setOpen(false);
      input?.blur();
    }
  };

  onSettled(() => {
    const onShortcut = (event: KeyboardEvent) => {
      const typing =
        event.target instanceof HTMLElement &&
        /^(INPUT|TEXTAREA|SELECT)$/.test(event.target.tagName);
      const slash = event.key === "/" && !typing;
      const commandK = event.key.toLowerCase() === "k" && (event.metaKey || event.ctrlKey);
      if (!slash && !commandK) return;
      event.preventDefault();
      input?.focus();
      input?.select();
    };
    window.addEventListener("keydown", onShortcut);
    return () => window.removeEventListener("keydown", onShortcut);
  });

  return (
    <div class="relative w-full max-w-md">
      <Icon
        icon={SearchIcon}
        size={14}
        class="pointer-events-none absolute top-1/2 left-2.5 -translate-y-1/2 text-zinc-400"
      />
      <input
        ref={(el) => (input = el)}
        type="text"
        role="combobox"
        aria-label="Search this project"
        aria-expanded={open() && query().trim() !== "" ? "true" : "false"}
        aria-controls="search-results"
        placeholder="Search components, blocks, properties…"
        autocomplete="off"
        spellcheck={false}
        class="w-full rounded-md border border-zinc-300 bg-transparent py-1 pr-8 pl-8 text-sm placeholder:text-zinc-400 focus:border-blue-500 focus:outline-none dark:border-zinc-700"
        onInput={(event) => {
          setQuery(event.currentTarget.value);
          setActive(0);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        onKeyDown={onKeyDown}
      />
      <Show when={query() === ""}>
        <kbd class="pointer-events-none absolute top-1/2 right-2 -translate-y-1/2 rounded border border-zinc-300 px-1 font-mono text-[10px] text-zinc-400 dark:border-zinc-700">
          /
        </kbd>
      </Show>

      <Show when={open() && query().trim() !== ""}>
        <div
          id="search-results"
          role="listbox"
          class="absolute top-full right-0 left-0 z-20 mt-1 max-h-[70vh] overflow-auto rounded-lg border border-zinc-200 bg-white p-1 shadow-lg dark:border-zinc-700 dark:bg-zinc-900"
          // Keep focus in the input while a result is being clicked.
          onMouseDown={(event) => event.preventDefault()}
        >
          <For
            each={groups()}
            fallback={
              <div class="px-2 py-3 text-sm text-zinc-500">Nothing matches "{query().trim()}".</div>
            }
          >
            {(group) => (
              <div class="mb-1 last:mb-0">
                <div class="flex items-baseline gap-1.5 px-2 pt-1.5 pb-0.5 text-xs font-medium text-zinc-500 dark:text-zinc-400">
                  {KIND_LABEL[group.kind]}
                  <span class="font-normal text-zinc-400 dark:text-zinc-500">
                    {group.total > group.results.length
                      ? `${group.results.length} of ${group.total}`
                      : group.total}
                  </span>
                </div>
                <For each={group.results}>
                  {(entry) => {
                    const parts = () => splitMatch(entry.title, query());
                    return (
                      <button
                        type="button"
                        role="option"
                        aria-selected={flat()[active()] === entry ? "true" : "false"}
                        onClick={() => go(entry)}
                        onMouseEnter={() => setActive(flat().indexOf(entry))}
                        class={[
                          "flex w-full items-center gap-2 rounded-md px-2 py-1 text-left text-sm",
                          flat()[active()] === entry ? "bg-zinc-200 dark:bg-zinc-700" : "",
                        ]}
                      >
                        <Icon
                          icon={iconOf(entry)}
                          size={14}
                          class="text-zinc-400 dark:text-zinc-500"
                        />
                        <span
                          class={[
                            "min-w-0 truncate",
                            {
                              "font-mono text-xs":
                                entry.kind === "block" || entry.kind === "property",
                            },
                          ]}
                        >
                          {parts()[0]}
                          <mark class="rounded-sm bg-amber-200 text-inherit dark:bg-amber-500/40">
                            {parts()[1]}
                          </mark>
                          {parts()[2]}
                        </span>
                        <span class="ml-auto shrink-0 pl-2 text-xs text-zinc-500 dark:text-zinc-400">
                          {entry.context}
                        </span>
                      </button>
                    );
                  }}
                </For>
              </div>
            )}
          </For>
        </div>
      </Show>
    </div>
  );
}
