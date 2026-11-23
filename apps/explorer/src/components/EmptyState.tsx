import type { JSX } from "@solidjs/web";
import { Show } from "solid-js";
import { useApp } from "../state.ts";
import sampleUrl from "../../../../test-fixtures/MoodRing.aia?url";

export function EmptyState(): JSX.Element {
  const app = useApp();
  let input: HTMLInputElement | undefined;

  const openSample = async () => {
    const response = await fetch(sampleUrl);
    await app.open(await response.blob(), "MoodRing.aia");
  };

  return (
    <div class="flex h-full items-center justify-center p-6">
      <div class="w-full max-w-md rounded-xl border border-dashed border-zinc-300 bg-white p-8 text-center dark:border-zinc-700 dark:bg-zinc-900">
        <h1 class="text-lg font-medium">Explore an App Inventor project</h1>
        <p class="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
          Drop an .aia file anywhere, or choose one. It is read in your browser and never uploaded.
        </p>
        <div class="mt-6 flex justify-center gap-2">
          <button
            type="button"
            class="rounded-md bg-zinc-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
            onClick={() => input?.click()}
          >
            Choose file
          </button>
          <button
            type="button"
            class="rounded-md border border-zinc-300 px-3 py-1.5 text-sm hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
            onClick={() => void openSample()}
          >
            Open sample project
          </button>
        </div>
        <input
          ref={(el) => (input = el)}
          type="file"
          accept=".aia,.zip"
          class="hidden"
          onChange={(event) => {
            const file = event.currentTarget.files?.[0];
            if (file) void app.open(file, file.name);
          }}
        />
        <Show when={app.busy()}>
          <p class="mt-4 text-sm text-zinc-500">Reading…</p>
        </Show>
        <Show when={app.error()}>
          {(message) => <p class="mt-4 text-sm text-red-600 dark:text-red-400">{message()}</p>}
        </Show>
      </div>
    </div>
  );
}
