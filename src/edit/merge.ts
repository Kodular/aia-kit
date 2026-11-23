import { uniqueName } from "../internal/names.ts";
import type { Project } from "../types.ts";
import { withName } from "./screens.ts";

export interface MergeOptions {
  /** A screen exists in both projects. Default `"rename"` (`Screen1` → `Screen1_2`). */
  readonly screens?: "rename" | "replace" | "skip";
  /** An asset exists in both projects. Default `"skip"`. */
  readonly assets?: "replace" | "skip";
  /** An extension exists in both projects. Default `"skip"`. */
  readonly extensions?: "replace" | "skip";
}

/** Copies the screens, assets and extensions of `source` into `target`. Project properties stay those of `target`. */
export function mergeProjects(
  target: Project,
  source: Project,
  options: MergeOptions = {},
): Project {
  const screens = [...target.screens];
  for (const screen of source.screens) {
    const index = screens.findIndex((existing) => existing.name === screen.name);
    const policy = options.screens ?? "rename";
    if (index === -1) screens.push(screen);
    else if (policy === "replace") screens[index] = screen;
    else if (policy === "rename") {
      screens.push(
        withName(
          screen,
          uniqueName(
            screen.name,
            screens.map((s) => s.name),
          ),
        ),
      );
    }
  }

  return {
    ...target,
    screens,
    assets: mergeBy(target.assets, source.assets, (a) => a.name, options.assets),
    extensions: mergeBy(
      target.extensions,
      source.extensions,
      (e) => e.packageName,
      options.extensions,
    ),
  };
}

function mergeBy<T>(
  target: readonly T[],
  source: readonly T[],
  key: (item: T) => string,
  policy: "replace" | "skip" = "skip",
): readonly T[] {
  const result = [...target];
  for (const item of source) {
    const index = result.findIndex((existing) => key(existing) === key(item));
    if (index === -1) result.push(item);
    else if (policy === "replace") result[index] = item;
  }
  return result;
}
