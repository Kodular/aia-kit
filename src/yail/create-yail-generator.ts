import { parseBky } from "#/blocks/bky-parser.js";
import type { ModelProject, ModelScreen } from "#/core/model.js";
import { getDotPackagePrefix } from "#/utils/package-names.js";
import { emitBlockSection } from "#/yail/block-emit.js";
import { emitComponentSection } from "#/yail/component-emit.js";

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
    const blockSection = emitBlockSection(
      parseBky(resolved.source.bky),
      model.environment.builtinBlockRegistry,
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
