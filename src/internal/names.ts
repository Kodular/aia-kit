import type { ProjectProperties } from "../types.ts";

export const RUNTIME_PACKAGE = "com.google.appinventor.components.runtime";

/** `a.b.C` → `C`. */
export function simpleName(qualified: string): string {
  return qualified.slice(qualified.lastIndexOf(".") + 1);
}

/** `a.b.C` → `a.b`; `C` → ``. */
export function packageOf(qualified: string): string {
  const dot = qualified.lastIndexOf(".");
  return dot === -1 ? "" : qualified.slice(0, dot);
}

/** Java package of the project's screens, e.g. `appinventor.ai_user.MyApp`. */
export function projectPackage(properties: ProjectProperties): string {
  return packageOf(properties.main);
}

/** Archive directory holding the screen files, e.g. `src/appinventor/ai_user/MyApp`. */
export function sourceDirectory(properties: ProjectProperties): string {
  const pkg = projectPackage(properties);
  return pkg === "" ? "src" : `src/${pkg.replaceAll(".", "/")}`;
}

/** First of `base`, `base_2`, `base_3`, … that is not taken. */
export function uniqueName(base: string, taken: Iterable<string>): string {
  const names = new Set(taken);
  if (!names.has(base)) return base;
  let n = 2;
  while (names.has(`${base}_${n}`)) n += 1;
  return `${base}_${n}`;
}
