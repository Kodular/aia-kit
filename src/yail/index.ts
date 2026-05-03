import type { ModelProject, ModelScreen } from "#/core/model.js";
import { AiaWriteError } from "#/core/errors.js";
import { createYailGenerator } from "./create-yail-generator.js";

export { createYailGenerator } from "./create-yail-generator.js";

export class YailEmitter {
  private readonly model: ModelProject;
  private readonly generator: (screen: ModelScreen) => string;

  static for(model: ModelProject): YailEmitter {
    return new YailEmitter(model);
  }

  private constructor(model: ModelProject) {
    this.model = model;
    this.generator = createYailGenerator(model);
  }

  emit(screen: ModelScreen): string {
    return this.generator(screen);
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
