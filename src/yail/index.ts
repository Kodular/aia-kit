import { parseBky } from "#/blocks/bky-parser.js";
import type { ModelProject, ModelScreen } from "#/core/model.js";
import { AiaWriteError } from "#/core/errors.js";
import { getDotPackagePrefix } from "#/utils/package-names.js";
import { emitBlockSection } from "#/yail/block-emit.js";
import { emitComponentSection } from "#/yail/component-emit.js";

export class YailEmitter {
  private readonly model: ModelProject;
  private readonly packagePrefix: string;

  static for(model: ModelProject): YailEmitter {
    return new YailEmitter(model);
  }

  private constructor(model: ModelProject) {
    this.model = model;
    this.packagePrefix = getDotPackagePrefix(model.source.properties);
  }

  emit(screen: ModelScreen): string {
    const resolved =
      this.model.screens.find((candidate) => candidate.name === screen.name) ??
      screen;
    const qualifiedClass = `${this.packagePrefix}.${resolved.name}`;
    const blockSection = emitBlockSection(
      parseBky(resolved.source.bky),
      this.model.builtinBlockRegistry,
    );

    const chunks = [
      "#|\n$Source $Yail\n|#",
      `(define-repl-form ${qualifiedClass} ${resolved.name})`,
      "(require <com.google.youngandroid.runtime>)",
      emitComponentSection(resolved.name, resolved.form),
      blockSection,
      "(init-runtime)",
    ].filter((chunk) => chunk.length > 0);

    return `${chunks.join("\n\n")}\n`;
  }

  emitScreen(screenName: string): string {
    const screen = this.model.screens.find((s) => s.name === screenName);
    if (!screen) {
      throw new AiaWriteError(
        `Cannot emit YAIL for missing screen "${screenName}"`,
      );
    }

    return this.emit(screen);
  }
}
