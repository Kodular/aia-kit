import { describe, expect, it } from "vitest";
import { parseBky } from "#/blocks/bky-parser.js";
import type { BlockAst } from "#/blocks/ast.js";
import {
  emitBlockSection,
  forEachBlock,
  isEventHat,
} from "#/yail/block-emit.js";

const COMPONENT_EVENT_AND_PRINT = `<xml xmlns="https://developers.google.com/blockly/xml">
  <block type="component_event" id="evt-1" x="0" y="0">
    <mutation instance_name="Button1" event_name="Click" component_type="Button"/>
    <statement name="DO">
      <block type="text_print" id="print-1">
        <value name="TEXT">
          <block type="text" id="txt-1">
            <field name="TEXT">Hi</field>
          </block>
        </value>
      </block>
    </statement>
  </block>
</xml>`;

describe("emitBlockSection", () => {
  it("emits define-event for component_event with mutation names", () => {
    const ast = parseBky(COMPONENT_EVENT_AND_PRINT);
    const y = emitBlockSection(ast);

    expect(y).toContain("(define-event Button1 Click ()");
    expect(y).toMatch(/\)\s*$/);
  });

  it("emits unsupported comments for non-MVP blocks and does not throw", () => {
    const ast = parseBky(COMPONENT_EVENT_AND_PRINT);
    const y = emitBlockSection(ast);

    expect(y).toContain(";;; aia-kit: unsupported block text_print id=print-1");
    expect(y).toContain('"Hi"');
  });

  it("orders sections as events, then procedures, then globals, then other top-level", () => {
    const bky = `<xml xmlns="https://developers.google.com/blockly/xml">
  <block type="global_declaration" id="g1"><field name="NAME">Gvar</field></block>
  <block type="procedures_defnoreturn" id="p1">
    <field name="NAME">MyProc</field>
    <statement name="STACK">
      <block type="math_number" id="m1"><field name="NUM">7</field></block>
    </statement>
  </block>
  <block type="component_event" id="e1">
    <mutation instance_name="L1" event_name="Click" component_type="Label"/>
    <statement name="DO"></statement>
  </block>
  <block type="some_weird_top" id="u1"></block>
</xml>`;
    const ast = parseBky(bky);
    const y = emitBlockSection(ast);

    const idxEvent = y.indexOf("(define-event L1 Click");
    const idxProc = y.indexOf("(define (MyProc)");
    const idxGlob = y.indexOf("(define-variable 'Gvar #f)");
    const idxUnsup = y.indexOf("unsupported block some_weird_top id=u1");

    expect(idxEvent).toBeGreaterThan(-1);
    expect(idxProc).toBeGreaterThan(-1);
    expect(idxGlob).toBeGreaterThan(-1);
    expect(idxUnsup).toBeGreaterThan(-1);
    expect(idxEvent).toBeLessThan(idxProc);
    expect(idxProc).toBeLessThan(idxGlob);
    expect(idxGlob).toBeLessThan(idxUnsup);
  });

  it("handles empty workspace", () => {
    const ast = parseBky(`<xml xmlns="https://developers.google.com/blockly/xml"></xml>`);
    expect(emitBlockSection(ast)).toBe("");
  });

  it("never throws for arbitrary nested block trees", () => {
    const ast = parseBky(COMPONENT_EVENT_AND_PRINT);
    expect(() => emitBlockSection(ast)).not.toThrow();
    let visits = 0;
    for (const root of ast.blocks) {
      forEachBlock(root, () => {
        visits += 1;
      });
    }
    expect(visits).toBeGreaterThan(0);
  });
});

describe("isEventHat", () => {
  it("treats component_event and cross-cutting patterns as hats", () => {
    const mk = (type: string): BlockAst => ({
      blocks: [{ type, id: "x", fields: {}, values: {}, statements: {}, mutation: {}, next: null }],
    });

    expect(isEventHat(mk("component_event").blocks[0])).toBe(true);
    expect(isEventHat(mk("event_handler").blocks[0])).toBe(true);
    expect(isEventHat(mk("when_Screen1.Initialize").blocks[0])).toBe(true);
    expect(isEventHat(mk("component_Button1.Click").blocks[0])).toBe(true);
    expect(isEventHat(mk("foo_event_bar").blocks[0])).toBe(true);
    expect(isEventHat(mk("math_number").blocks[0])).toBe(false);
  });
});
