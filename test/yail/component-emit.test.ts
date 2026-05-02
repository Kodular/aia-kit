// test/yail/component-emit.test.ts
import { describe, expect, it } from "vitest";
import type { Diagnostic } from "#/core/diagnostics.js";
import { Environment } from "#/core/environment.js";
import type { AiaProject, AiaScreen } from "#/core/types.js";
import { resolve } from "#/resolve.js";
import { emitComponentSection } from "#/yail/component-emit.js";

const EMPTY_BKY = `<xml xmlns="https://developers.google.com/blockly/xml"></xml>`;

const EMPTY_SCM = `#|
$JSON
{"authURL":["aia-kit"],"YaVersion":"1","Source":"Form","Properties":{"$Name":"Screen1","$Type":"Form","Uuid":"root-uid","Title":"Screen1","$Components":[]}}
|#`;

const SCM_WITH_BUTTON = `#|
$JSON
{"authURL":["aia-kit"],"YaVersion":"1","Source":"Form","Properties":{"$Name":"Screen1","$Type":"Form","Uuid":"root-uid","Title":"Screen1","$Components":[{"$Name":"Button1","$Type":"Button","Uuid":"btn-uid","Text":"Click Me","$Components":[]}]}}
|#`;

const SCM_TWO_BUTTONS = `#|
$JSON
{"authURL":["aia-kit"],"YaVersion":"1","Source":"Form","Properties":{"$Name":"Screen1","$Type":"Form","Uuid":"root-uid","Title":"Screen1","$Components":[{"$Name":"FirstButton","$Type":"Button","Uuid":"b1","Text":"One","$Components":[]},{"$Name":"SecondButton","$Type":"Button","Uuid":"b2","Text":"Two","$Components":[]}]}}
|#`;

/** BackgroundColor (&H…) + descendant width from blockHints only (`Width` lacks designer row in JSON). */
const SCM_COLOR_AND_ARRANGEMENT = `#|
$JSON
{"authURL":["aia-kit"],"YaVersion":"1","Source":"Form","Properties":{"$Name":"Screen1","$Type":"Form","Uuid":"root-uid","Title":"T","BackgroundColor":"&HFF00FF00","$Components":[{"$Name":"HZ1","$Type":"HorizontalArrangement","Uuid":"hz1","Width":"200","$Components":[]}]}}
|#`;

function modelFromScm(scm: string): AiaProject {
  const screen: AiaScreen = {
    name: "Screen1",
    scm,
    bky: EMPTY_BKY,
    yail: null,
  };
  return {
    _tag: "AiaProject",
    name: "Test",
    properties: {},
    screens: [screen],
    assets: [],
    extensions: [],
  };
}

describe("emitComponentSection", () => {
  it("emits do-after-form-creation with root property sets only", async () => {
    const env = await Environment.mitAppInventor();
    const model = resolve(modelFromScm(EMPTY_SCM), env);
    expect(
      model.diagnostics.filter((d: Diagnostic) => d.severity === "error"),
    ).toHaveLength(0);
    const y = emitComponentSection("Screen1", model.screens[0].form);

    expect(y).toContain(";;; Screen1");
    expect(y).toContain("(do-after-form-creation");
    expect(y).toContain(
      "(set-and-coerce-property! 'Screen1 'Title \"Screen1\" 'text)",
    );
    expect(y.includes("add-component")).toBe(false);
  });

  it("emits add-component for descendants with quoted property symbols", async () => {
    const env = await Environment.mitAppInventor();
    const model = resolve(modelFromScm(SCM_WITH_BUTTON), env);
    expect(
      model.diagnostics.filter((d: Diagnostic) => d.severity === "error"),
    ).toHaveLength(0);
    const y = emitComponentSection("Screen1", model.screens[0].form);

    expect(y).toContain("(do-after-form-creation");
    expect(y).toContain(";;; Button1");
    expect(y).toMatch(
      /\(add-component Screen1 com\.google\.appinventor\.components\.runtime\.Button Button1/,
    );
    expect(y).toContain(
      "(set-and-coerce-property! 'Button1 'Text \"Click Me\" 'text)",
    );
  });

  it("follows SCM child order top-to-bottom", async () => {
    const env = await Environment.mitAppInventor();
    const model = resolve(modelFromScm(SCM_TWO_BUTTONS), env);
    const y = emitComponentSection("Screen1", model.screens[0].form);

    expect(y.indexOf("FirstButton")).toBeLessThan(y.indexOf("SecondButton"));
  });

  it("uses text coercion for &H colors; number from blockHints when designer row absent", async () => {
    const env = await Environment.mitAppInventor();
    const model = resolve(modelFromScm(SCM_COLOR_AND_ARRANGEMENT), env);
    expect(
      model.diagnostics.filter((d: Diagnostic) => d.severity === "error"),
    ).toHaveLength(0);
    const y = emitComponentSection("Screen1", model.screens[0].form);

    expect(y).toContain(
      "(set-and-coerce-property! 'Screen1 'BackgroundColor \"&HFF00FF00\" 'text)",
    );
    expect(y).toContain("(set-and-coerce-property! 'HZ1 'Width 200 'number)");
    expect(y).toContain(";;; HZ1");
  });
});
