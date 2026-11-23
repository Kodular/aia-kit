import type { JSX } from "@solidjs/web";
import { ChevronRight, ChevronsDownUp, ChevronsUpDown, Ellipsis } from "lucide";
import { For, Show, createMemo, createSignal } from "solid-js";
import { plural } from "../lib/format.ts";
import { foldEnds, splitLines, tokenize, type Language, type TokenKind } from "../lib/highlight.ts";
import { Button, Icon } from "./ui/index.ts";

const TOKEN_CLASS: Readonly<Record<TokenKind, string>> = {
  plain: "",
  key: "text-sky-700 dark:text-sky-300",
  string: "text-emerald-700 dark:text-emerald-300",
  number: "text-amber-700 dark:text-amber-300",
  keyword: "text-violet-700 dark:text-violet-300",
  punctuation: "text-zinc-400 dark:text-zinc-500",
  tag: "text-rose-700 dark:text-rose-300",
  attribute: "text-sky-700 dark:text-sky-300",
  comment: "text-zinc-400 italic dark:text-zinc-500",
};

/** A scrollable, syntax-highlighted block of source text with line numbers and indentation-based folding. */
export function Code(props: { text: string; language: Language }): JSX.Element {
  const lines = createMemo(() => splitLines(tokenize(props.text, props.language)));
  const ends = createMemo(() => foldEnds(lines()));

  // Folded line indexes. Re-derived (emptied) whenever the text changes.
  const [folded, setFolded] = createSignal<ReadonlySet<number>>(() => {
    void props.text;
    return new Set<number>();
  });

  /** Indexes of the lines to show: everything not inside a folded range. */
  const visible = createMemo(() => {
    const shown: number[] = [];
    for (let i = 0; i < lines().length; i++) {
      shown.push(i);
      if (folded().has(i)) i = ends()[i] ?? i;
    }
    return shown;
  });

  const toggle = (line: number) => {
    setFolded((current) => {
      const next = new Set(current);
      if (!next.delete(line)) next.add(line);
      return next;
    });
  };
  const foldAll = () =>
    void setFolded(new Set(ends().flatMap((end, line) => (end !== -1 && line > 0 ? [line] : []))));

  return (
    <div>
      <div class="mb-2 flex items-center gap-1 text-xs text-zinc-500 dark:text-zinc-400">
        <span class="flex-1">{plural(lines().length, "line")}</span>
        <Button variant="ghost" size="sm" icon={ChevronsDownUp} onClick={foldAll}>
          Fold all
        </Button>
        <Button
          variant="ghost"
          size="sm"
          icon={ChevronsUpDown}
          onClick={() => void setFolded(new Set<number>())}
        >
          Unfold all
        </Button>
      </div>
      <div class="max-h-[calc(100vh-20rem)] overflow-auto font-mono text-xs leading-relaxed">
        <div class="w-max min-w-full">
          <For each={visible()}>
            {(line) => (
              <div class="flex items-center hover:bg-zinc-100 dark:hover:bg-zinc-800/60">
                <span class="w-10 shrink-0 pr-2 text-right text-zinc-400 select-none dark:text-zinc-600">
                  {line + 1}
                </span>
                <Show when={(ends()[line] ?? -1) !== -1} fallback={<span class="w-4 shrink-0" />}>
                  <button
                    type="button"
                    class="flex w-4 shrink-0 justify-center text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100"
                    aria-label={
                      folded().has(line) ? `Unfold line ${line + 1}` : `Fold line ${line + 1}`
                    }
                    aria-expanded={folded().has(line) ? "false" : "true"}
                    onClick={() => toggle(line)}
                  >
                    <Icon
                      icon={ChevronRight}
                      size={12}
                      class={["transition-transform", { "rotate-90": !folded().has(line) }]}
                    />
                  </button>
                </Show>
                <span class="whitespace-pre">
                  <For each={lines()[line] ?? []} keyed={false}>
                    {(token) => <span class={TOKEN_CLASS[token().kind]}>{token().text}</span>}
                  </For>
                  <Show when={folded().has(line)}>
                    <button
                      type="button"
                      class="ml-2 inline-flex items-center gap-1 rounded bg-zinc-200 px-1.5 align-middle text-zinc-600 hover:bg-zinc-300 dark:bg-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-600"
                      onClick={() => toggle(line)}
                    >
                      <Icon icon={Ellipsis} size={12} />
                      {plural((ends()[line] ?? line) - line, "line")}
                    </button>
                  </Show>
                </span>
              </div>
            )}
          </For>
        </div>
      </div>
    </div>
  );
}
