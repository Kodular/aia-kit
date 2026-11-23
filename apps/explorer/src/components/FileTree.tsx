import type { JSX } from "@solidjs/web";
import type { ArchiveFile } from "aia-kit";
import { For, Show, createMemo } from "solid-js";
import { formatBytes, plural } from "../lib/format.ts";

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
          <details open class="group">
            <summary class="flex cursor-pointer list-none items-center gap-1.5 rounded px-1 py-0.5 hover:bg-zinc-100 dark:hover:bg-zinc-800">
              <span class="w-3 text-zinc-400 transition-transform group-open:rotate-90">▸</span>
              <span class="font-medium">{folder.name}/</span>
              <span class="flex-1" />
              <span class="text-zinc-500">
                {plural(folder.count, "file")} · {formatBytes(folder.size)}
              </span>
            </summary>
            <div class="ml-2.5 border-l border-zinc-200 pl-2 dark:border-zinc-800">
              <FolderContents folder={folder} />
            </div>
          </details>
        )}
      </For>
      <For each={props.folder.files}>
        {(file) => (
          <div class="flex items-center gap-1.5 rounded px-1 py-0.5 hover:bg-zinc-100 dark:hover:bg-zinc-800">
            <span class="w-3" />
            <span class="min-w-0 truncate" title={file.name}>
              {file.name}
            </span>
            <span class="flex-1" />
            <span class="shrink-0 text-zinc-500">{formatBytes(file.size)}</span>
          </div>
        )}
      </For>
      <Show when={props.folder.folders.length + props.folder.files.length === 0}>
        <span class="text-zinc-500">Empty</span>
      </Show>
    </>
  );
}
