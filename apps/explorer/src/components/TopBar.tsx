import type { JSX } from "@solidjs/web";
import type { BuiltinPlatformId } from "aia-kit/platforms";
import { FolderOpen, Package } from "lucide";
import { Show } from "solid-js";
import { useApp } from "../state.ts";
import { Search } from "./Search.tsx";
import { Button, Icon, SegmentedControl } from "./ui/index.ts";

const PLATFORMS: readonly { readonly id: BuiltinPlatformId; readonly label: string }[] = [
  { id: "app-inventor", label: "App Inventor" },
  { id: "kodular", label: "Kodular" },
];

export function TopBar(): JSX.Element {
  const app = useApp();
  return (
    // Equal side columns keep the search box centred in the window. When the window is too
    // narrow for that, the search box shrinks first and the sides keep their content.
    <header class="grid grid-cols-[1fr_minmax(12rem,28rem)_1fr] items-center gap-4 border-b border-zinc-200 bg-white px-4 py-2 dark:border-zinc-800 dark:bg-zinc-900">
      <div class="flex items-center gap-2.5">
        <Icon icon={Package} size={18} class="text-zinc-500 dark:text-zinc-400" />
        <span class="max-w-48 truncate text-sm font-medium" title={app.fileName()}>
          {app.fileName()}
        </span>
      </div>
      <Search />
      <div class="flex items-center justify-end gap-2">
        <Show when={!app.standalone()}>
          <SegmentedControl
            label="Platform to check the project against"
            value={app.platformId()}
            onChange={(id) => app.choosePlatform(id)}
            items={PLATFORMS}
          />
        </Show>
        <Button
          variant="ghost"
          icon={FolderOpen}
          title="Open another file"
          class="py-1.5!"
          onClick={() => app.close()}
        />
      </div>
    </header>
  );
}
