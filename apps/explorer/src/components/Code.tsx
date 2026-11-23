import type { JSX } from "@solidjs/web";
import { For, Show, createMemo, createSignal } from "solid-js";
import { foldEnds, splitLines, tokenize, type Language, type TokenKind } from "../lib/highlight.ts";
import { plural } from "../lib/format.ts";

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
    setFolded(new Set(ends().flatMap((end, line) => (end !== -1 && line > 0 ? [line] : []))));

  return (
    <div>
      <div class="mb-2 flex items-center gap-3 text-xs text-zinc-500 dark:text-zinc-400">
        <span>{plural(lines().length, "line")}</span>
        <span class="flex-1" />
        <button
          type="button"
          class="hover:text-zinc-900 dark:hover:text-zinc-100"
          onClick={foldAll}
        >
          Fold all
        </button>
        <button
          type="button"
          class="hover:text-zinc-900 dark:hover:text-zinc-100"
          onClick={() => setFolded(new Set<number>())}
        >
          Unfold all
        </button>
      </div>
      <div class="max-h-[calc(100vh-18rem)] overflow-auto font-mono text-xs leading-relaxed">
        <div class="w-max min-w-full">
          <For each={visible()}>
            {(line) => (
              <div class="flex hover:bg-zinc-100 dark:hover:bg-zinc-800/60">
                <span class="w-10 shrink-0 pr-2 text-right text-zinc-400 select-none dark:text-zinc-600">
                  {line + 1}
                </span>
                <Show when={(ends()[line] ?? -1) !== -1} fallback={<span class="w-4 shrink-0" />}>
                  <button
                    type="button"
                    class="w-4 shrink-0 text-center text-zinc-400 select-none hover:text-zinc-900 dark:hover:text-zinc-100"
                    aria-label={
                      folded().has(line) ? `Unfold line ${line + 1}` : `Fold line ${line + 1}`
                    }
                    aria-expanded={folded().has(line) ? "false" : "true"}
                    onClick={() => toggle(line)}
                  >
                    {folded().has(line) ? "▸" : "▾"}
                  </button>
                </Show>
                <span class="whitespace-pre">
                  <For each={lines()[line] ?? []} keyed={false}>
                    {(token) => <span class={TOKEN_CLASS[token().kind]}>{token().text}</span>}
                  </For>
                  <Show when={folded().has(line)}>
                    <button
                      type="button"
                      class="ml-2 rounded bg-zinc-200 px-1.5 text-zinc-600 hover:bg-zinc-300 dark:bg-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-600"
                      onClick={() => toggle(line)}
                    >
                      ⋯ {plural((ends()[line] ?? line) - line, "line")}
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
