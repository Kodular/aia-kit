import {
  check,
  findComponent,
  findScreen,
  mainScreenName,
  readAia,
  readAix,
  type Component,
  type Extension,
  type Problem,
  type Project,
  type Screen,
} from "aia-kit";
import { findUnusedAssets } from "aia-kit/analysis";
import { collectHandedFile, openInNewTab } from "./lib/handoff.ts";
import {
  loadPlatform,
  lookupComponent,
  type BuiltinPlatformId,
  type Platform,
} from "aia-kit/platforms";
import {
  createContext,
  createMemo,
  createSignal,
  onCleanup,
  onSettled,
  useContext,
  type Accessor,
} from "solid-js";

export type Selection =
  | { readonly kind: "screen"; readonly screen: string; readonly component?: string }
  | { readonly kind: "asset"; readonly name: string }
  | { readonly kind: "extension"; readonly packageName: string }
  | { readonly kind: "properties" }
  | { readonly kind: "navigation" }
  | { readonly kind: "insights" };

export type Tab = "designer" | "blocks" | "raw";

export interface PendingFile {
  readonly file: Blob;
  readonly name: string;
}

interface Place {
  readonly selection: Selection;
  readonly tab: Tab;
}

const HISTORY_KEY = "aiaExplorer";

interface Loaded {
  readonly fileName: string;
  readonly project: Project;
  readonly readProblems: readonly Problem[];
  /** A lone extension, wrapped in an otherwise empty project. */
  readonly standalone: boolean;
}

export interface AppState {
  readonly fileName: Accessor<string | undefined>;
  /** True when a lone `.aix` extension is open instead of a project. */
  readonly standalone: Accessor<boolean>;
  readonly project: Accessor<Project | undefined>;
  readonly error: Accessor<string | undefined>;
  readonly busy: Accessor<boolean>;
  readonly platformId: Accessor<BuiltinPlatformId>;
  readonly platform: Accessor<Platform | undefined>;
  readonly selection: Accessor<Selection | undefined>;
  readonly tab: Accessor<Tab>;
  /** Problems from reading the archive plus `check` against the chosen platform. */
  readonly problems: Accessor<readonly Problem[]>;
  readonly unusedAssets: Accessor<ReadonlySet<string>>;
  /** Object URLs for the project's assets, for previews. */
  readonly assetUrls: Accessor<ReadonlyMap<string, string>>;
  readonly screen: Accessor<Screen | undefined>;
  /** The component being inspected; `undefined` while only a screen is selected. */
  readonly component: Accessor<Component | undefined>;

  /** Name of the component the pointer is over in the component tree, to highlight it in the preview. */
  readonly hovered: Accessor<string | undefined>;
  hover(component: string | undefined): void;
  /** A block to scroll to and mark on the Blocks tab, set by `revealBlock`. */
  readonly revealedBlock: Accessor<string | undefined>;
  /** Opens a screen's Blocks tab and points at one block. */
  revealBlock(screen: string, blockId: string | undefined): void;
  /** True for components with no on-screen presence (Clock, Sound, …). Needs the platform; false until it loads. */
  isNonVisible(component: Component): boolean;

  /** Reads a file and shows it. Resolves to whether it worked; on failure the current file stays open. */
  open(file: Blob, name: string): Promise<boolean>;
  /**
   * A file the user chose while another is open. Nothing changes until they
   * decide: replace the current file, open it in a new tab, or cancel.
   */
  readonly pendingFile: Accessor<PendingFile | undefined>;
  /** Opens the file at once if nothing is open; otherwise asks first. */
  requestOpen(file: Blob, name: string): void;
  /** Resolves a pending file. `replace` resolves to whether the file could be read. */
  resolvePending(choice: "replace" | "new-tab" | "cancel"): Promise<boolean>;
  choosePlatform(id: BuiltinPlatformId): void;
  /** Goes to a place in the project, optionally switching the screen tab. Recorded in browser history. */
  select(selection: Selection, tab?: Tab): void;
  /** Goes to a screen, or to one of its components. */
  selectComponent(screen: string, component?: string, tab?: Tab): void;
  setTab(tab: Tab): void;
}

export const AppContext = createContext<AppState>();
export const useApp = (): AppState => useContext(AppContext);

export function createAppState(): AppState {
  const [loaded, setLoaded] = createSignal<Loaded | undefined>(undefined);
  const [error, setError] = createSignal<string | undefined>(undefined);
  const [busy, setBusy] = createSignal(false);
  const [platformId, setPlatformId] = createSignal<BuiltinPlatformId>("app-inventor");
  const [platform, setPlatform] = createSignal<Platform | undefined>(undefined);
  const [selection, setSelection] = createSignal<Selection | undefined>(undefined);
  const [tab, setTab] = createSignal<Tab>("designer");
  const [hovered, setHovered] = createSignal<string | undefined>(undefined);
  const [revealedBlock, setRevealedBlock] = createSignal<string | undefined>(undefined);
  const [pendingFile, setPendingFile] = createSignal<PendingFile | undefined>(undefined);

  const project = () => loaded()?.project;

  // Where the user is. Kept outside the signals too, because a signal read
  // right after its setter still returns the previous value.
  let here: Place | undefined;

  /** Moves to a place and records it, so the browser's Back and Forward buttons work. */
  const goTo = (
    next: Selection,
    nextTab: Tab = here?.tab ?? "designer",
    mode: "push" | "replace" = "push",
  ) => {
    const place: Place = { selection: next, tab: nextTab };
    if (JSON.stringify(place) === JSON.stringify(here)) return;
    here = place;
    setSelection(next);
    setTab(nextTab);
    // The hovered row is often removed by the navigation itself, so it never reports the pointer leaving.
    setHovered(undefined);
    setRevealedBlock(undefined);
    history[mode === "push" ? "pushState" : "replaceState"]({ [HISTORY_KEY]: place }, "");
  };

  onSettled(() => {
    const onPopState = (event: PopStateEvent) => {
      const place = (event.state as { [HISTORY_KEY]?: Place } | null)?.[HISTORY_KEY];
      if (!place || !loaded()) return;
      here = place;
      setSelection(place.selection);
      setTab(place.tab);
    };
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  });

  const choosePlatform = (id: BuiltinPlatformId) => {
    setPlatformId(id);
    void loadPlatform(id).then((p) => setPlatform(p));
  };

  const problems = createMemo<readonly Problem[]>(() => {
    const current = loaded();
    // A lone extension is not a project: there is nothing to check it against.
    if (!current || current.standalone) return [];
    return [...current.readProblems, ...check(current.project, platform())];
  });

  const unusedAssets = createMemo<ReadonlySet<string>>(() => {
    const p = project();
    return new Set(p ? findUnusedAssets(p).map((asset) => asset.name) : []);
  });

  const assetUrls = createMemo<ReadonlyMap<string, string>>(() => {
    const urls = new Map<string, string>();
    for (const asset of project()?.assets ?? []) {
      urls.set(
        asset.name,
        URL.createObjectURL(asset.blob.slice(0, asset.blob.size, mimeOf(asset.name))),
      );
    }
    onCleanup(() => {
      for (const url of urls.values()) URL.revokeObjectURL(url);
    });
    return urls;
  });

  const screen = createMemo(() => {
    const p = project();
    const s = selection();
    return p && s?.kind === "screen" ? findScreen(p, s.screen) : undefined;
  });

  const component = createMemo(() => {
    const s = selection();
    const current = screen();
    if (!current || s?.kind !== "screen" || s.component === undefined) return undefined;
    return findComponent(current, s.component);
  });

  // A tab opened by "Open in new tab" finds its file waiting in browser storage.
  onSettled(() => {
    void collectHandedFile().then((handed) => {
      if (handed) void state.open(handed.file, handed.name);
    });
  });

  const state: AppState = {
    fileName: () => loaded()?.fileName,
    standalone: () => loaded()?.standalone ?? false,
    project,
    error,
    busy,
    platformId,
    platform,
    selection,
    tab,
    problems,
    unusedAssets,
    assetUrls,
    screen,
    component,
    hovered,
    hover: (name) => setHovered(name),
    revealedBlock,
    revealBlock(screenName, blockId) {
      goTo({ kind: "screen", screen: screenName }, "blocks");
      setRevealedBlock(blockId);
    },
    isNonVisible(candidate) {
      const current = platform();
      return current
        ? (lookupComponent(candidate.type, current, project())?.nonVisible ?? false)
        : false;
    },

    async open(file, name) {
      setBusy(true);
      try {
        const extension = await readExtension(file, name);
        if (extension) {
          setLoaded({
            fileName: name,
            project: projectAround(extension),
            readProblems: [],
            standalone: true,
          });
          goTo({ kind: "extension", packageName: extension.packageName }, "designer", "replace");
        } else {
          const result = await readAia(file);
          setLoaded({
            fileName: name,
            project: result.project,
            readProblems: result.problems,
            standalone: false,
          });
          goTo({ kind: "screen", screen: mainScreenName(result.project) }, "designer", "replace");
          choosePlatform(guessPlatform(result.project));
        }
        setError(undefined);
        return true;
      } catch (cause) {
        setError(cause instanceof Error ? cause.message : String(cause));
        return false;
      } finally {
        setBusy(false);
      }
    },
    pendingFile,
    requestOpen(file, name) {
      if (loaded()) {
        setError(undefined);
        setPendingFile({ file, name });
      } else void state.open(file, name);
    },
    async resolvePending(choice) {
      const pending = pendingFile();
      if (!pending || choice === "cancel") {
        setPendingFile(undefined);
        setError(undefined);
        return true;
      }
      if (choice === "new-tab") {
        try {
          await openInNewTab(pending);
          setPendingFile(undefined);
          return true;
        } catch (cause) {
          setError(cause instanceof Error ? cause.message : String(cause));
          return false;
        }
      }
      // Keep the question up if the file turns out to be unreadable, so the error has somewhere to show.
      const opened = await state.open(pending.file, pending.name);
      if (opened) setPendingFile(undefined);
      return opened;
    },
    choosePlatform,
    select: (next, nextTab) => goTo(next, nextTab),
    selectComponent: (screenName, componentName, nextTab) =>
      goTo(
        {
          kind: "screen",
          screen: screenName,
          ...(componentName !== undefined && { component: componentName }),
        },
        nextTab,
      ),
    setTab: (next) => {
      if (here?.selection) goTo(here.selection, next);
    },
  };
  return state;
}

/**
 * Reads the file as a standalone extension if it is one: named `.aix`, or an
 * archive that has no project in it but does hold an extension.
 */
async function readExtension(file: Blob, name: string): Promise<Extension | undefined> {
  if (/\.aix$/i.test(name)) return readAix(file);
  try {
    await readAia(file);
    return undefined;
  } catch (notAProject) {
    try {
      return await readAix(file);
    } catch {
      throw notAProject;
    }
  }
}

/** An empty project holding just this extension, so the rest of the app can treat both alike. */
function projectAround(extension: Extension): Project {
  return {
    properties: {
      main: `${extension.packageName}.Extension`,
      name: extension.packageName,
      extra: {},
    },
    screens: [],
    assets: [],
    extensions: [extension],
    otherFiles: [],
  };
}

/** Kodular projects live in an `io.kodular` package or name Kodular in their screens' `authURL`. */
function guessPlatform(project: Project): BuiltinPlatformId {
  const hints = [
    project.properties.main,
    ...project.screens.map((s) => JSON.stringify(s.meta.form["authURL"] ?? "")),
  ];
  return hints.some((hint) => /kodular|makeroid/i.test(hint)) ? "kodular" : "app-inventor";
}

const MIME: Readonly<Record<string, string>> = {
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  gif: "image/gif",
  webp: "image/webp",
  svg: "image/svg+xml",
  bmp: "image/bmp",
  ico: "image/x-icon",
  mp3: "audio/mpeg",
  wav: "audio/wav",
  ogg: "audio/ogg",
  m4a: "audio/mp4",
  mp4: "video/mp4",
  webm: "video/webm",
};

export function extensionOf(name: string): string {
  const dot = name.lastIndexOf(".");
  return dot === -1 ? "" : name.slice(dot + 1).toLowerCase();
}

export function mimeOf(name: string): string {
  return MIME[extensionOf(name)] ?? "application/octet-stream";
}
