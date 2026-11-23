import type { JSX } from "@solidjs/web";
import { For, createMemo } from "solid-js";
import { tokenize, type Language, type TokenKind } from "../lib/highlight.ts";

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

/** A scrollable, syntax-highlighted block of source text. */
export function Code(props: { text: string; language: Language }): JSX.Element {
  const tokens = createMemo(() => tokenize(props.text, props.language));

  return (
    <pre class="max-h-[32rem] overflow-auto font-mono text-xs leading-relaxed">
      <For each={tokens()} keyed={false}>
        {(token) => <span class={TOKEN_CLASS[token().kind]}>{token().text}</span>}
      </For>
    </pre>
  );
}
