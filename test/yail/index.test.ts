import { describe, expect, it } from "vitest";
import type { Diagnostic } from "#/core/diagnostics.js";
import { AiaWriteError } from "#/core/errors.js";
import { Platform, getEnvironmentFor } from "#/core/environment.js";
import type { AiaProject, AiaScreen, ProjectProperties } from "#/core/types.js";
import { buildModel } from "#/model.js";
import { YailEmitter } from "#/yail/index.js";
import { makeMinimalModelProject, makeProjectProperties } from "../helpers.js";

const EMPTY_BKY = `<xml xmlns="https://developers.google.com/blockly/xml"></xml>`;

function scmForScreen(name: string): string {
  return `#|
$JSON
{"authURL":["aia-kit"],"YaVersion":"1","Source":"Form","Properties":{"$Name":"${name}","$Type":"Form","Uuid":"root-${name}","Title":"${name}","$Components":[]}}
|#`;
}

function minimalProject(
  screens: { name: string; scm: string }[],
  properties: ProjectProperties = makeProjectProperties(),
): AiaProject {
  const aiaScreens: AiaScreen[] = screens.map(({ name, scm }) => ({
    name,
    scm,
    bky: EMPTY_BKY,
    yail: null,
  }));
  return {
    _tag: "AiaProject",
    name: "Test",
    properties,
    screens: aiaScreens,
    assets: [],
    extensions: [],
  };
}

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

  it("emits define-repl-form, do-after-form-creation, and init-runtime for empty BKY", async () => {
    const env = await getEnvironmentFor(Platform.MitAppInventor);
    const model = buildModel(
      minimalProject([{ name: "Screen1", scm: scmForScreen("Screen1") }]),
      env,
    );
    expect(
      model.diagnostics.filter((d: Diagnostic) => d.severity === "error"),
    ).toHaveLength(0);

    const yail = YailEmitter.for(model).emit(model.screens[0]);

    expect(yail).toContain("(define-repl-form appinventor.ai_user.Project.Screen1 Screen1)");
    expect(yail).toContain("(do-after-form-creation");
    expect(yail).toContain("(init-runtime)");
  });

  it("uses distinct qualified repl classes for each screen", async () => {
    const env = await getEnvironmentFor(Platform.MitAppInventor);
    const model = buildModel(
      minimalProject(
        [
          { name: "Screen1", scm: scmForScreen("Screen1") },
          { name: "Screen2", scm: scmForScreen("Screen2") },
        ],
        makeProjectProperties({ main: "com.example.myapp.Screen1" }),
      ),
      env,
    );
    expect(
      model.diagnostics.filter((d: Diagnostic) => d.severity === "error"),
    ).toHaveLength(0);

    const emitter = YailEmitter.for(model);
    const y1 = emitter.emit(model.screens[0]);
    const y2 = emitter.emit(model.screens[1]);

    expect(y1).toContain(
      "(define-repl-form com.example.myapp.Screen1 Screen1)",
    );
    expect(y2).toContain(
      "(define-repl-form com.example.myapp.Screen2 Screen2)",
    );
  });
});
