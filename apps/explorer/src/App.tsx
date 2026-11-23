import type { JSX } from "@solidjs/web";
import { Match, Show, Switch, createSignal } from "solid-js";
import { AssetView } from "./components/AssetView.tsx";
import { EmptyState } from "./components/EmptyState.tsx";
import { ExtensionView } from "./components/ExtensionView.tsx";
import { InsightsView } from "./components/InsightsView.tsx";
import { Inspector } from "./components/Inspector.tsx";
import { OpenFileDialog } from "./components/OpenFileDialog.tsx";
import { ProblemsPane } from "./components/ProblemsPane.tsx";
import { PropertiesView, ScreenFlowView } from "./components/ProjectViews.tsx";
import { ScreenView } from "./components/ScreenView.tsx";
import { Sidebar } from "./components/Sidebar.tsx";
import { TopBar } from "./components/TopBar.tsx";
import { AppContext, createAppState } from "./state.ts";

/**
 * Layout: a top bar, then three columns — project navigation, the main view,
 * and (for screens only) the component inspector — with problems along the bottom.
 */
export function App(): JSX.Element {
  const state = createAppState();
  const [dragging, setDragging] = createSignal(false);
  const kind = () => state.selection()?.kind;

  const onDrop = (event: DragEvent) => {
    event.preventDefault();
    setDragging(false);
    const file = event.dataTransfer?.files[0];
    if (file) state.requestOpen(file, file.name);
  };

  return (
    <AppContext value={state}>
      <div
        class={[
          "flex h-full flex-col",
          { "outline-2 -outline-offset-4 outline-blue-500": dragging() },
        ]}
        onDragOver={(event) => {
          event.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
      >
        <Show when={state.project()} fallback={<EmptyState />}>
          <TopBar />
          <div
            class={[
              "grid min-h-0 flex-1",
              kind() === "screen"
                ? "grid-cols-[15rem_minmax(0,1fr)_20rem]"
                : "grid-cols-[15rem_minmax(0,1fr)]",
            ]}
          >
            <Sidebar />
            <main class="min-h-0 overflow-auto p-5">
              <div class="mx-auto flex max-w-5xl flex-col gap-4">
                <Switch>
                  <Match when={kind() === "screen"}>
                    <ScreenView />
                  </Match>
                  <Match when={kind() === "asset"}>
                    <AssetView />
                  </Match>
                  <Match when={kind() === "extension"}>
                    <ExtensionView />
                  </Match>
                  <Match when={kind() === "properties"}>
                    <PropertiesView />
                  </Match>
                  <Match when={kind() === "navigation"}>
                    <ScreenFlowView />
                  </Match>
                  <Match when={kind() === "insights"}>
                    <InsightsView />
                  </Match>
                </Switch>
              </div>
            </main>
            <Show when={kind() === "screen"}>
              <Inspector />
            </Show>
          </div>
          <Show when={!state.standalone()}>
            <ProblemsPane />
          </Show>
          <OpenFileDialog />
        </Show>
      </div>
    </AppContext>
  );
}
