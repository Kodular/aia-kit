import type { JSX } from "@solidjs/web";
import { FolderOpen, Upload } from "lucide";
import { Show } from "solid-js";
import { useApp } from "../state.ts";
import sampleUrl from "../../../../test-fixtures/MoodRing.aia?url";
import { Button, Icon } from "./ui/index.ts";

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
        <Icon icon={Upload} size={28} class="mx-auto mb-4 text-zinc-400" />
        <h1 class="text-lg font-medium">Explore an App Inventor project</h1>
        <p class="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
          Drop an .aia file anywhere, or choose one. It is read in your browser and never uploaded.
        </p>
        <div class="mt-6 flex justify-center gap-2">
          <Button variant="primary" icon={FolderOpen} onClick={() => input?.click()}>
            Choose file
          </Button>
          <Button onClick={() => void openSample()}>Open sample project</Button>
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
