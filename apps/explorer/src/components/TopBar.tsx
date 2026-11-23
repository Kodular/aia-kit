import type { JSX } from "@solidjs/web";
import type { BuiltinPlatformId } from "aia-kit/platforms";
import { useApp } from "../state.ts";
import { plural } from "../lib/format.ts";
import { Badge } from "./ui.tsx";

export function TopBar(): JSX.Element {
  const app = useApp();
  const summary = () => {
    const project = app.project();
    if (!project) return "";
    return [
      plural(project.screens.length, "screen"),
      plural(project.assets.length, "asset"),
      plural(project.extensions.length, "extension"),
    ].join(" · ");
  };

  return (
    <header class="flex items-center gap-3 border-b border-zinc-200 bg-white px-4 py-2 dark:border-zinc-800 dark:bg-zinc-900">
      <span class="text-sm font-medium">{app.fileName()}</span>
      <Badge>{summary()}</Badge>
      <span class="flex-1" />
      <label class="flex items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400">
        Check against
        <select
          class="rounded-md border border-zinc-300 bg-transparent px-2 py-1 text-sm text-zinc-900 dark:border-zinc-700 dark:text-zinc-100"
          value={app.platformId()}
          onChange={(event) => app.choosePlatform(event.currentTarget.value as BuiltinPlatformId)}
        >
          <option value="app-inventor">MIT App Inventor</option>
          <option value="kodular">Kodular</option>
        </select>
      </label>
      <button
        type="button"
        class="rounded-md border border-zinc-300 px-3 py-1 text-sm hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
        onClick={() => app.close()}
      >
        Open another
      </button>
    </header>
  );
}
