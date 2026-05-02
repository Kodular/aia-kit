import { queryBlocks } from "#/blocks/lens.js";
import type { ModelProject, ModelScreen } from "#/core/model.js";
import type { ProjectProperties } from "#/core/types.js";
import { emitBlockSection } from "#/yail/block-emit.js";
import { emitComponentSection } from "#/yail/component-emit.js";

/** Dotted package prefix, mirroring `getPackagePath` in `write.ts` (slashes → dots). */
function getDotPackagePrefix(properties: ProjectProperties): string {
  const parts = properties.main.split(".");
  if (parts.length > 1) {
    return parts.slice(0, -1).join(".");
  }
  return "appinventor.ai_user.Project";
}

/**
 * Returns a function that emits per-screen YAIL for a resolved {@link ModelProject}.
 * Package prefix comes from `model.source.properties['main']`, with the same fallback as
 * {@link getPackagePath} in `write.ts` (`appinventor.ai_user.Project`).
 */
export function createYailGenerator(
  model: ModelProject,
): (screen: ModelScreen) => string {
  const packagePrefix = getDotPackagePrefix(model.source.properties);

  return (screen: ModelScreen) => {
    const resolved =
      model.screens.find((s) => s.name === screen.name) ?? screen;
    const qualifiedClass = `${packagePrefix}.${resolved.name}`;
    const blockSection = queryBlocks(resolved, (ast) =>
      emitBlockSection(ast, model.environment.blockRegistry)
    );

    const chunks = [
      "#|\n$Source $Yail\n|#",
      `(define-repl-form ${qualifiedClass} ${resolved.name})`,
      "(require <com.google.youngandroid.runtime>)",
      emitComponentSection(resolved.name, resolved.form),
      blockSection,
      "(init-runtime)",
    ].filter((s) => s.length > 0);

    return `${chunks.join("\n\n")}\n`;
  };
}
