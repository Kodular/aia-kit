import { globSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { readAia } from "#/aia/index.js";
import { ScmDocument } from "#/scm/index.js";
import { parseScm } from "#/scm/parse.js";
import { serializeScm } from "#/scm/serialize.js";
import { FIXTURES_DIR } from "#/test-helpers.js";
import type { AiaComponent } from "#/types.js";

const aiaFixtureCases = globSync("**/*.aia", { cwd: FIXTURES_DIR })
  .map((rel) => {
    const relNorm = rel.replace(/\\/g, "/");
    const abs = join(FIXTURES_DIR, rel);
    return [relNorm, abs] as const;
  })
  .sort((a, b) => a[0].localeCompare(b[0]));

function assertParseTreeInvariants(c: AiaComponent): void {
  expect(c.name, "component name").toBeTruthy();
  expect(c.type, "component type").toBeTruthy();
  expect(c.uid, "component uid").toBeTruthy();
  expect(Array.isArray(c.children), "children is array").toBe(true);
  for (const v of Object.values(c.properties)) {
    expect(typeof v, `property value for ${c.name}`).toBe("string");
  }
  for (const child of c.children) {
    assertParseTreeInvariants(child);
  }
}

/** Golden tree for {@link test-fixtures/HelloPurr.aia} Screen1 — update if fixture SCM changes. */
const HELLO_PURR_SCREEN1_TREE: AiaComponent = {
  name: "Screen1",
  type: "Form",
  uid: "0",
  properties: { Title: "Screen1" },
  children: [
    {
      name: "Button1",
      type: "Button",
      uid: "1298415571",
      properties: { Image: "kitty.png" },
      children: [],
    },
    {
      name: "Sound1",
      type: "Sound",
      uid: "940103767",
      properties: { Source: "meow.mp3" },
      children: [],
    },
  ],
};

describe("ScmDocument — fixture corpus (all test-fixtures .aia)", () => {
  it.each(
    aiaFixtureCases,
  )("parses and round-trips every screen: %s", async (relPath, absPath) => {
    const bytes = readFileSync(absPath);
    const project = await readAia(new Uint8Array(bytes));

    for (const screen of project.screens) {
      const doc = ScmDocument.parse(screen.scm);
      expect(doc.diagnostics, `${relPath} screen ${screen.name}`).toEqual([]);
      expect(doc.root.type).toBe("Form");
      expect(doc.root.name).toBe(screen.name);
      assertParseTreeInvariants(doc.root);

      const again = ScmDocument.parse(doc.serialize());
      expect(
        again.diagnostics,
        `${relPath} screen ${screen.name} after serialize`,
      ).toEqual([]);
      expect(again.root).toEqual(doc.root);
    }
  });
});

describe("ScmDocument — HelloPurr Screen1 (SCM API)", () => {
  it("parses full tree and properties; parseScm, ScmDocument, and serializeScm agree", async () => {
    const bytes = readFileSync(join(FIXTURES_DIR, "HelloPurr.aia"));
    const project = await readAia(new Uint8Array(bytes));
    const screen = project.screens.find((s) => s.name === "Screen1");
    expect(screen).toBeDefined();
    if (screen === undefined) {
      throw new Error("expected Screen1 in HelloPurr fixture");
    }
    const { scm } = screen;

    const fromParseScm = parseScm(scm);
    expect(fromParseScm).toEqual(HELLO_PURR_SCREEN1_TREE);
    assertParseTreeInvariants(fromParseScm);

    const doc = ScmDocument.parse(scm);
    expect(doc.diagnostics).toEqual([]);
    expect(parseScm(scm)).toEqual(doc.root);
    expect(doc.root).toEqual(HELLO_PURR_SCREEN1_TREE);

    const afterSer = parseScm(serializeScm(parseScm(scm), scm));
    expect(afterSer).toEqual(fromParseScm);
  });

  it("optional mutation: addComponent on form uid, then removeComponent restores tree", async () => {
    const bytes = readFileSync(join(FIXTURES_DIR, "HelloPurr.aia"));
    const project = await readAia(new Uint8Array(bytes));
    const screen = project.screens.find((s) => s.name === "Screen1");
    expect(screen).toBeDefined();
    if (screen === undefined) {
      throw new Error("expected Screen1 in HelloPurr fixture");
    }
    const scm = screen.scm;

    const doc = ScmDocument.parse(scm);
    const formUid = doc.root.uid;
    const extra: AiaComponent = {
      name: "LabelFixtureProbe",
      type: "Label",
      uid: "aia-kit-scm-fixtures-probe-uid",
      properties: { Text: "probe" },
      children: [],
    };

    expect(doc.addComponent(formUid, extra)).toEqual([]);
    expect(doc.findComponentByUid(extra.uid)).toBe(extra);
    expect(doc.removeComponent(extra.uid)).toEqual([]);
    expect(doc.findComponentByUid(extra.uid)).toBeNull();
    expect(doc.root).toEqual(HELLO_PURR_SCREEN1_TREE);
    expect(doc.diagnostics).toEqual([]);
  });
});
