import type { JSX } from "@solidjs/web";
import type { BuiltinPlatformId } from "aia-kit/platforms";
import { FolderOpen, Package } from "lucide";
import { useApp } from "../state.ts";
import { Button, Icon } from "./ui/index.ts";

export function TopBar(): JSX.Element {
  const app = useApp();
  return (
    <header class="flex items-center gap-3 border-b border-zinc-200 bg-white px-4 py-2 dark:border-zinc-800 dark:bg-zinc-900">
      <Icon icon={Package} size={18} class="text-zinc-500 dark:text-zinc-400" />
      <span class="text-sm font-medium">{app.fileName()}</span>
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
      <Button icon={FolderOpen} class="py-1!" onClick={() => app.close()}>
        Open another
      </Button>
    </header>
  );
}
