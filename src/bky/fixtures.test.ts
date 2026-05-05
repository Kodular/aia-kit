import { globSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { readAia } from "#/aia/index.js";
import type { BlockAst, BlockNode } from "#/bky/ast.js";
import { parseBky, removeDisabledBlocks, serializeBky } from "#/bky/index.js";
import { FIXTURES_DIR } from "#/test-helpers.js";

const aiaFixtureCases = globSync("**/*.aia", { cwd: FIXTURES_DIR })
  .map((rel) => {
    const relNorm = rel.replace(/\\/g, "/");
    const abs = join(FIXTURES_DIR, rel);
    return [relNorm, abs] as const;
  })
  .sort((a, b) => a[0].localeCompare(b[0]));

/** Golden for {@link test-fixtures/HelloPurr.aia} Screen1 — update if fixture BKY changes. Uses `<title>` for NUM; parser treats it like `<field>`. */
const HELLO_PURR_SCREEN1_BKY_AST: BlockAst = {
  blocks: [
    {
      type: "Button1_Click",
      id: "",
      x: -63,
      y: -235,
      fields: {},
      values: {},
      statements: {
        DO: {
          type: "Sound1_Play",
          id: "",
          fields: {},
          values: {},
          statements: {},
          mutation: {},
          next: {
            type: "Sound1_Vibrate",
            id: "",
            fields: {},
            values: {
              ARG0: {
                type: "math_number",
                id: "",
                fields: { NUM: "500" },
                values: {},
                statements: {},
                mutation: {},
                next: null,
              },
            },
            statements: {},
            mutation: {},
            next: null,
          },
        },
      },
      mutation: {},
      next: null,
    },
  ],
};

/** Golden for {@link test-fixtures/Test.aia} Screen1 — update if fixture BKY changes. */
const TEST_AIA_SCREEN1_BKY_AST: BlockAst = {
  blocks: [
    {
      type: "component_event",
      id: "M*G]S/a`bU`kt.(kgNTy",
      x: -1170,
      y: -570,
      fields: { COMPONENT_SELECTOR: "Screen1" },
      values: {},
      statements: {
        DO: {
          type: "component_set_get",
          id: "OH-~=mQO7oO9Q(cHs(Iv",
          fields: {
            COMPONENT_SELECTOR: "Clock1",
            PROP: "TimerInterval",
          },
          values: {
            VALUE: {
              type: "math_number",
              id: "XGJY^lpveB;kte^#G;0s",
              fields: { NUM: "2000" },
              values: {},
              statements: {},
              mutation: {},
              next: null,
            },
          },
          statements: {},
          mutation: {
            component_type: "Clock",
            set_or_get: "set",
            property_name: "TimerInterval",
            is_generic: "false",
            instance_name: "Clock1",
          },
          next: {
            type: "component_set_get",
            id: "+w*sEP`l)|agwp36u5A3",
            fields: {
              COMPONENT_SELECTOR: "Clock1",
              PROP: "TimerEnabled",
            },
            values: {
              VALUE: {
                type: "logic_boolean",
                id: "c_TSX{zaX9;@_!7}I8c^",
                fields: { BOOL: "FALSE" },
                values: {},
                statements: {},
                mutation: {},
                next: null,
              },
            },
            statements: {},
            mutation: {
              component_type: "Clock",
              set_or_get: "set",
              property_name: "TimerEnabled",
              is_generic: "false",
              instance_name: "Clock1",
            },
            next: null,
          },
        },
      },
      mutation: {
        component_type: "Form",
        is_generic: "false",
        instance_name: "Screen1",
        event_name: "Initialize",
      },
      next: null,
    },
    {
      type: "component_event",
      id: ":BxRTuHK?Fn=A|OV{HA(",
      x: -1170,
      y: -430,
      fields: { COMPONENT_SELECTOR: "Clock1" },
      values: {},
      statements: {
        DO: {
          type: "component_set_get",
          id: "t=_{{7IncqYkJCDkEP]l",
          fields: {
            COMPONENT_SELECTOR: "Label1",
            PROP: "Visible",
          },
          values: {
            VALUE: {
              type: "logic_boolean",
              id: "papDQOiZxe^zkx;*OiFN",
              fields: { BOOL: "TRUE" },
              values: {},
              statements: {},
              mutation: {},
              next: null,
            },
          },
          statements: {},
          mutation: {
            component_type: "Label",
            set_or_get: "set",
            property_name: "Visible",
            is_generic: "false",
            instance_name: "Label1",
          },
          next: {
            type: "component_set_get",
            id: "y!%Zk}]cj2wcTttY4ayw",
            fields: {
              COMPONENT_SELECTOR: "Clock1",
              PROP: "TimerEnabled",
            },
            values: {
              VALUE: {
                type: "logic_boolean",
                id: "#m-@lfg/@r/p7P,Yd,R*",
                fields: { BOOL: "FALSE" },
                values: {},
                statements: {},
                mutation: {},
                next: null,
              },
            },
            statements: {},
            mutation: {
              component_type: "Clock",
              set_or_get: "set",
              property_name: "TimerEnabled",
              is_generic: "false",
              instance_name: "Clock1",
            },
            next: null,
          },
        },
      },
      mutation: {
        component_type: "Clock",
        is_generic: "false",
        instance_name: "Clock1",
        event_name: "Timer",
      },
      next: null,
    },
    {
      type: "lexical_variable_set",
      id: "0EDtA=~}(x]!]eqLkF8l",
      x: -210,
      y: -270,
      fields: { VAR: "errorCode" },
      values: {},
      statements: {},
      mutation: {},
      next: null,
    },
    {
      type: "component_method",
      id: "E;#WN0~Vdga47Jmbi--b",
      x: -170,
      y: -170,
      fields: { COMPONENT_SELECTOR: "Notifier1" },
      values: {
        ARG0: {
          type: "lexical_variable_get",
          id: "9iOhhJB?%Bn?_ZWj-TqC",
          fields: { VAR: "errorMessage" },
          values: {},
          statements: {},
          mutation: {},
          next: null,
        },
      },
      statements: {},
      mutation: {
        component_type: "Notifier",
        method_name: "ShowAlert",
        is_generic: "false",
        instance_name: "Notifier1",
      },
      next: null,
    },
    {
      type: "component_method",
      id: "Y,UX/S:F}L!Bi5jxfgR$",
      x: -1110,
      y: 230,
      fields: { COMPONENT_SELECTOR: "Notifier1" },
      values: {
        ARG0: {
          type: "lexical_variable_get",
          id: "@{o8DsG3%(y!-nFz.BD{",
          fields: { VAR: "errorMessage" },
          values: {},
          statements: {},
          mutation: {},
          next: null,
        },
      },
      statements: {},
      mutation: {
        component_type: "Notifier",
        method_name: "ShowAlert",
        is_generic: "false",
        instance_name: "Notifier1",
      },
      next: null,
    },
  ],
};

function assertBlockNodeInvariants(node: BlockNode): void {
  expect(typeof node.type, "block type").toBe("string");
  expect(typeof node.id, "block id").toBe("string");
  if (node.disabled !== undefined) {
    expect(node.disabled, "disabled").toBe(true);
  }
  if (node.collapsed !== undefined) {
    expect(node.collapsed, "collapsed").toBe(true);
  }
  expect(node.fields && typeof node.fields === "object", "fields").toBe(true);
  expect(node.values && typeof node.values === "object", "values").toBe(true);
  expect(
    node.statements && typeof node.statements === "object",
    "statements",
  ).toBe(true);
  expect(node.mutation && typeof node.mutation === "object", "mutation").toBe(
    true,
  );

  if (node.x !== undefined)
    expect(Number.isFinite(node.x), "block x").toBe(true);
  if (node.y !== undefined)
    expect(Number.isFinite(node.y), "block y").toBe(true);
  expect(
    node.next === null || (node.next !== null && typeof node.next === "object"),
    "next",
  ).toBe(true);

  for (const [, v] of Object.entries(node.values)) {
    assertBlockNodeInvariants(v);
  }
  for (const [, s] of Object.entries(node.statements)) {
    assertBlockNodeInvariants(s);
  }
  if (node.next) assertBlockNodeInvariants(node.next);
}

function assertBlockAstInvariants(ast: BlockAst): void {
  expect(Array.isArray(ast.blocks), "blocks is array").toBe(true);
  for (const b of ast.blocks) assertBlockNodeInvariants(b);
}

describe("parseBky — fixture corpus (all test-fixtures .aia)", () => {
  it.each(
    aiaFixtureCases,
  )("parses and round-trips every non-empty screen BKY: %s", async (relPath, absPath) => {
    const bytes = readFileSync(absPath);
    const project = await readAia(new Uint8Array(bytes));

    for (const screen of project.screens) {
      if (screen.bky.trim() === "") {
        // readAia can yield "" for a 0-byte .bky (e.g. MyToDoList, SnapchatRemix).
        // parseBky rejects empty input by contract.
        continue;
      }
      const ast1 = parseBky(screen.bky);
      assertBlockAstInvariants(ast1);
      expect(
        parseBky(serializeBky(ast1)),
        `${relPath} screen ${screen.name}`,
      ).toEqual(ast1);
    }
  });
});

describe("parseBky — HelloPurr Screen1 (BKY API)", () => {
  it("matches golden AST; serialize round-trip; removeDisabledBlocks is no-op", async () => {
    const bytes = readFileSync(join(FIXTURES_DIR, "HelloPurr.aia"));
    const project = await readAia(new Uint8Array(bytes));
    const screen = project.screens.find((s) => s.name === "Screen1");
    expect(screen).toBeDefined();
    if (screen === undefined) {
      throw new Error("expected Screen1 in HelloPurr fixture");
    }
    const ast = parseBky(screen.bky);
    expect(ast).toEqual(HELLO_PURR_SCREEN1_BKY_AST);
    assertBlockAstInvariants(ast);
    expect(parseBky(serializeBky(ast))).toEqual(ast);
    expect(removeDisabledBlocks(ast)).toEqual(ast);
  });
});

describe("parseBky — Test.aia Screen1 (BKY API)", () => {
  it("matches golden AST and serialize round-trip", async () => {
    const bytes = readFileSync(join(FIXTURES_DIR, "Test.aia"));
    const project = await readAia(new Uint8Array(bytes));
    const screen = project.screens.find((s) => s.name === "Screen1");
    expect(screen).toBeDefined();
    if (screen === undefined) {
      throw new Error("expected Screen1 in Test.aia fixture");
    }
    const ast = parseBky(screen.bky);
    expect(ast).toEqual(TEST_AIA_SCREEN1_BKY_AST);
    assertBlockAstInvariants(ast);
    expect(parseBky(serializeBky(ast))).toEqual(ast);
  });
});
