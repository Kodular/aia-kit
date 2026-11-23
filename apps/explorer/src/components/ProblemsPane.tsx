import type { JSX } from "@solidjs/web";
import type { Problem } from "aia-kit";
import { CircleCheck, CircleX, TriangleAlert } from "lucide";
import { For, Show } from "solid-js";
import { plural } from "../lib/format.ts";
import { useApp } from "../state.ts";
import { Disclosure, Icon } from "./ui/index.ts";

function SeverityIcon(props: { severity: Problem["severity"] | "none" }): JSX.Element {
  return (
    <Show
      when={props.severity !== "none"}
      fallback={
        <Icon icon={CircleCheck} size={14} class="text-emerald-600 dark:text-emerald-400" />
      }
    >
      <Show
        when={props.severity === "error"}
        fallback={
          <Icon
            icon={TriangleAlert}
            size={14}
            label="Warning"
            class="text-amber-600 dark:text-amber-400"
          />
        }
      >
        <Icon icon={CircleX} size={14} label="Error" class="text-red-600 dark:text-red-400" />
      </Show>
    </Show>
  );
}

/** A collapsible pane along the bottom of the window listing every problem in the project. */
export function ProblemsPane(): JSX.Element {
  const app = useApp();

  const count = (severity: Problem["severity"]) =>
    app.problems().filter((p) => p.severity === severity).length;
  const worst = () => (count("error") > 0 ? "error" : count("warning") > 0 ? "warning" : "none");
  const summary = () => {
    if (app.problems().length === 0) return "None found";
    return [
      count("error") > 0 ? plural(count("error"), "error") : "",
      count("warning") > 0 ? plural(count("warning"), "warning") : "",
    ]
      .filter(Boolean)
      .join(" · ");
  };

  const go = (problem: Problem) => {
    if (!("screen" in problem) || !app.project()?.screens.some((s) => s.name === problem.screen))
      return;
    if (problem.code === "dangling-block-reference")
      app.selectComponent(problem.screen, undefined, "blocks");
    else
      app.selectComponent(
        problem.screen,
        "component" in problem ? problem.component : undefined,
        "designer",
      );
  };

  return (
    <Disclosure
      class="shrink-0 border-t border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900"
      headerClass="px-4 py-1.5 rounded-none"
      title={
        <span class="inline-flex items-center gap-1.5">
          <SeverityIcon severity={worst()} />
          Problems
        </span>
      }
      meta={summary()}
    >
      <Show when={app.problems().length > 0}>
        <div class="max-h-48 overflow-auto border-t border-zinc-100 dark:border-zinc-800">
          <For each={app.problems()}>
            {(problem) => (
              <button
                type="button"
                onClick={() => go(problem)}
                class="flex w-full items-center gap-2 px-4 py-1 text-left text-xs hover:bg-zinc-50 dark:hover:bg-zinc-800/60"
              >
                <SeverityIcon severity={problem.severity} />
                <span class="min-w-0 flex-1">{problem.message}</span>
              </button>
            )}
          </For>
        </div>
      </Show>
    </Disclosure>
  );
}
