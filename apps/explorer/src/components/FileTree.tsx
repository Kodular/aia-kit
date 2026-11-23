import type { JSX } from "@solidjs/web";
import type { ArchiveFile } from "aia-kit";
import { Folder as FolderIcon } from "lucide";
import { For, Show, createMemo } from "solid-js";
import { formatBytes, plural } from "../lib/format.ts";
import { assetIcon } from "../lib/icons.ts";
import { Disclosure, Icon } from "./ui/index.ts";

interface Folder {
  readonly name: string;
  readonly folders: Folder[];
  readonly files: { readonly name: string; readonly size: number }[];
  size: number;
  count: number;
}

function buildTree(files: readonly ArchiveFile[]): Folder {
  const root: Folder = { name: "", folders: [], files: [], size: 0, count: 0 };
  for (const file of files) {
    const parts = file.path.split("/");
    const fileName = parts.pop() ?? file.path;
    let folder = root;
    folder.size += file.blob.size;
    folder.count += 1;
    for (const part of parts) {
      let next = folder.folders.find((candidate) => candidate.name === part);
      if (!next) {
        next = { name: part, folders: [], files: [], size: 0, count: 0 };
        folder.folders.push(next);
      }
      next.size += file.blob.size;
      next.count += 1;
      folder = next;
    }
    folder.files.push({ name: fileName, size: file.blob.size });
  }
  const sort = (folder: Folder) => {
    folder.folders.sort((a, b) => a.name.localeCompare(b.name));
    folder.files.sort((a, b) => a.name.localeCompare(b.name));
    folder.folders.forEach(sort);
  };
  sort(root);
  return root;
}

/** Files as a collapsible folder tree, folders first, with sizes. */
export function FileTree(props: { files: readonly ArchiveFile[] }): JSX.Element {
  const tree = createMemo(() => buildTree(props.files));
  return (
    <div class="font-mono text-xs">
      <FolderContents folder={tree()} />
    </div>
  );
}

function FolderContents(props: { folder: Folder }): JSX.Element {
  return (
    <>
      <For each={props.folder.folders}>
        {(folder) => (
          <Disclosure
            headerClass="px-1 py-0.5"
            title={
              <span class="inline-flex items-center gap-1.5">
                <Icon icon={FolderIcon} size={14} class="text-zinc-400" />
                {folder.name}
              </span>
            }
            trailing={`${plural(folder.count, "file")} · ${formatBytes(folder.size)}`}
          >
            <div class="ml-[11px] border-l border-zinc-200 pl-2 dark:border-zinc-800">
              <FolderContents folder={folder} />
            </div>
          </Disclosure>
        )}
      </For>
      <For each={props.folder.files}>
        {(file) => (
          <div class="flex items-center gap-1.5 rounded px-1 py-0.5 hover:bg-zinc-100 dark:hover:bg-zinc-800/60">
            <span class="w-3.5 shrink-0" />
            <Icon icon={assetIcon(file.name)} size={14} class="text-zinc-400" />
            <span class="min-w-0 truncate" title={file.name}>
              {file.name}
            </span>
            <span class="ml-auto shrink-0 text-zinc-500">{formatBytes(file.size)}</span>
          </div>
        )}
      </For>
      <Show when={props.folder.folders.length + props.folder.files.length === 0}>
        <span class="text-zinc-500">Empty</span>
      </Show>
    </>
  );
}
