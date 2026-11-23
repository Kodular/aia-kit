import {
  check,
  findComponent,
  findScreen,
  mainScreenName,
  readAia,
  type Component,
  type Problem,
  type Project,
  type Screen,
} from "aia-kit";
import { findUnusedAssets } from "aia-kit/analysis";
import { loadPlatform, type BuiltinPlatformId, type Platform } from "aia-kit/platforms";
import {
  createContext,
  createMemo,
  createSignal,
  onCleanup,
  useContext,
  type Accessor,
} from "solid-js";

export type Selection =
  | { readonly kind: "screen"; readonly screen: string; readonly component?: string }
  | { readonly kind: "asset"; readonly name: string }
  | { readonly kind: "extension"; readonly packageName: string }
  | { readonly kind: "properties" }
  | { readonly kind: "navigation" };

export type Tab = "designer" | "blocks" | "raw";

interface Loaded {
  readonly fileName: string;
  readonly project: Project;
  readonly readProblems: readonly Problem[];
}

export interface AppState {
  readonly fileName: Accessor<string | undefined>;
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

  open(file: Blob, name: string): Promise<void>;
  close(): void;
  choosePlatform(id: BuiltinPlatformId): void;
  select(selection: Selection): void;
  selectComponent(screen: string, component?: string): void;
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

  const project = () => loaded()?.project;

  const choosePlatform = (id: BuiltinPlatformId) => {
    setPlatformId(id);
    void loadPlatform(id).then((p) => setPlatform(p));
  };

  const problems = createMemo<readonly Problem[]>(() => {
    const current = loaded();
    return current ? [...current.readProblems, ...check(current.project, platform())] : [];
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

  return {
    fileName: () => loaded()?.fileName,
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

    async open(file, name) {
      setBusy(true);
      try {
        const result = await readAia(file);
        setLoaded({ fileName: name, project: result.project, readProblems: result.problems });
        setSelection({ kind: "screen", screen: mainScreenName(result.project) });
        setTab("designer");
        setError(undefined);
        choosePlatform(guessPlatform(result.project));
      } catch (cause) {
        setError(cause instanceof Error ? cause.message : String(cause));
      } finally {
        setBusy(false);
      }
    },
    close() {
      setLoaded(undefined);
      setSelection(undefined);
      setError(undefined);
    },
    choosePlatform,
    select: (next) => setSelection(next),
    selectComponent: (screenName, componentName) =>
      setSelection({
        kind: "screen",
        screen: screenName,
        ...(componentName !== undefined && { component: componentName }),
      }),
    setTab: (next) => setTab(next),
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
