import { describe, expect, it } from "vitest";
import { AiaWriteError } from "#/core/errors.js";
import { YailEmitter } from "#/yail/index.js";
import { makeMinimalModelProject } from "../helpers.js";

describe("YailEmitter", () => {
  it("emits YAIL for a model screen", () => {
    const model = makeMinimalModelProject();
    const emitter = YailEmitter.for(model);

    expect(emitter.emit(model.screens[0])).toContain("(define-repl-form");
  });

  it("emits YAIL by screen name", () => {
    const model = makeMinimalModelProject();
    const emitter = YailEmitter.for(model);

    expect(emitter.emitScreen(model.screens[0].name)).toContain(
      "(define-repl-form",
    );
  });

  it("throws AiaWriteError for a missing screen", () => {
    const model = makeMinimalModelProject();
    const emitter = YailEmitter.for(model);

    expect(() => emitter.emitScreen("Missing")).toThrow(
      new AiaWriteError('Cannot emit YAIL for missing screen "Missing"'),
    );
  });
});
