import { describe, expect, it } from "vitest";
import type { Diagnostic } from "#/core/diagnostics.js";
import { Environment } from "#/core/environment.js";
import type { AiaProject, AiaScreen, ProjectProperties } from "#/core/types.js";
import { resolve } from "#/resolve.js";
import { createYailGenerator } from "#/yail/index.js";
import { makeProjectProperties } from "../helpers.js";

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

describe("createYailGenerator", () => {
  it("emits define-repl-form, do-after-form-creation, and init-runtime for empty BKY", async () => {
    const env = await Environment.mitAppInventor();
    const model = resolve(
      minimalProject([{ name: "Screen1", scm: scmForScreen("Screen1") }]),
      env,
    );
    expect(
      model.diagnostics.filter((d: Diagnostic) => d.severity === "error"),
    ).toHaveLength(0);

    const gen = createYailGenerator(model);
    const yail = gen(model.screens[0]);

    expect(yail).toContain("(define-repl-form appinventor.ai_user.Project.Screen1 Screen1)");
    expect(yail).toContain("(do-after-form-creation");
    expect(yail).toContain("(init-runtime)");
  });

  it("uses distinct qualified repl classes for each screen", async () => {
    const env = await Environment.mitAppInventor();
    const model = resolve(
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

    const gen = createYailGenerator(model);
    const y1 = gen(model.screens[0]);
    const y2 = gen(model.screens[1]);

    expect(y1).toContain(
      "(define-repl-form com.example.myapp.Screen1 Screen1)",
    );
    expect(y2).toContain(
      "(define-repl-form com.example.myapp.Screen2 Screen2)",
    );
  });
});
