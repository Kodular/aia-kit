import type { JSX } from "@solidjs/web";
import { Match, Show, Switch, createSignal } from "solid-js";
import { AssetView } from "./components/AssetView.tsx";
import { EmptyState } from "./components/EmptyState.tsx";
import { ExtensionView } from "./components/ExtensionView.tsx";
import { Inspector } from "./components/Inspector.tsx";
import { NavigationView, PropertiesView } from "./components/ProjectViews.tsx";
import { ScreenView } from "./components/ScreenView.tsx";
import { Sidebar } from "./components/Sidebar.tsx";
import { TopBar } from "./components/TopBar.tsx";
import { AppContext, createAppState } from "./state.ts";

export function App(): JSX.Element {
  const state = createAppState();
  const [dragging, setDragging] = createSignal(false);

  const onDrop = (event: DragEvent) => {
    event.preventDefault();
    setDragging(false);
    const file = event.dataTransfer?.files[0];
    if (file) void state.open(file, file.name);
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
          <div class="grid min-h-0 flex-1 grid-cols-[14rem_minmax(0,1fr)_19rem]">
            <Sidebar />
            <main class="min-h-0 overflow-auto p-4">
              <Switch>
                <Match when={state.selection()?.kind === "screen"}>
                  <ScreenView />
                </Match>
                <Match when={state.selection()?.kind === "asset"}>
                  <AssetView />
                </Match>
                <Match when={state.selection()?.kind === "extension"}>
                  <ExtensionView />
                </Match>
                <Match when={state.selection()?.kind === "properties"}>
                  <PropertiesView />
                </Match>
                <Match when={state.selection()?.kind === "navigation"}>
                  <NavigationView />
                </Match>
              </Switch>
            </main>
            <Inspector />
          </div>
        </Show>
      </div>
    </AppContext>
  );
}
