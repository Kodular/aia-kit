import type { JSX } from "@solidjs/web";
import { FolderOpen, Upload } from "lucide";
import { Show } from "solid-js";
import { useApp } from "../state.ts";
import sampleUrl from "../../../../test-fixtures/MoodRing.aia?url";
import { APP_NAME, AppMenu, BUILD, MAKER, shortCommit } from "./AppMenu.tsx";
import { Button, ExternalLink, Icon } from "./ui/index.ts";

/** The start screen: what the app is, and how to open a file. */
export function EmptyState(): JSX.Element {
  const app = useApp();
  let input: HTMLInputElement | undefined;

  const openSample = async () => {
    const response = await fetch(sampleUrl);
    await app.open(await response.blob(), "MoodRing.aia");
  };

  return (
    <div class="relative flex h-full flex-col overflow-hidden">
      <Backdrop />

      <header class="relative flex items-center justify-between px-4 py-2">
        <span class="flex items-baseline gap-1.5">
          <span class="text-sm font-medium">{APP_NAME}</span>
          <span class="text-xs text-zinc-500 dark:text-zinc-400">
            by <ExternalLink href={MAKER.url}>{MAKER.name}</ExternalLink>
          </span>
        </span>
        <AppMenu />
      </header>

      <main class="relative flex flex-1 items-center justify-center p-6">
        <div class="w-full max-w-md rounded-xl border border-zinc-300 bg-white/90 p-8 text-center shadow-sm backdrop-blur-sm dark:border-zinc-700 dark:bg-zinc-900/90">
          <Icon icon={Upload} size={28} class="mx-auto mb-4 text-zinc-400" />
          <h1 class="text-lg font-medium">Explore an App Inventor project or extension</h1>
          <p class="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
            Drop an .aia project or .aix extension anywhere, or choose one. It is read in your
            browser and never uploaded.
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
            accept=".aia,.aix,.zip"
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
      </main>

      <footer class="relative px-4 py-3 text-center text-xs text-zinc-500 dark:text-zinc-400">
        Built on <ExternalLink href={BUILD.repository}>aia-kit</ExternalLink> {BUILD.version}
        <Show when={BUILD.commit !== ""}>
          {" · "}
          <ExternalLink href={`${BUILD.repository}/commit/${BUILD.commit}`} class="font-mono">
            {shortCommit()}
          </ExternalLink>
        </Show>
      </footer>
    </div>
  );
}

/**
 * A dot grid behind the start screen, fading out towards the edges, so the
 * page reads as a workspace waiting for a file instead of a blank sheet.
 */
function Backdrop(): JSX.Element {
  return (
    <div
      aria-hidden="true"
      class="pointer-events-none absolute inset-0 text-zinc-300 dark:text-zinc-700"
      style={{
        "background-image": "radial-gradient(currentColor 1.5px, transparent 1.5px)",
        "background-size": "22px 22px",
        "background-position": "center",
        "mask-image": "radial-gradient(ellipse 75% 70% at center, black 40%, transparent 100%)",
      }}
    />
  );
}
