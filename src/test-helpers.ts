import { readdirSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { parseBky } from "./formats/bky.ts";
import { parseComponentDescriptors } from "./formats/descriptors.ts";
import { parseProperties } from "./formats/properties.ts";
import { parseScm } from "./formats/scm.ts";
import type { Extension, Project, Screen } from "./types.ts";

const FIXTURES_DIR = join(import.meta.dirname, "../test-fixtures");

const list = (dir: string, ext: string) =>
  readdirSync(join(FIXTURES_DIR, dir))
    .filter((file) => file.endsWith(ext))
    .map((file) => join(dir, file));

/** Every `.aia` fixture, relative to `test-fixtures/`. */
export const AIA_FIXTURES: string[] = [
  ...list(".", ".aia"),
  ...list("mit-extension-demos", ".aia"),
];
export const AIX_FIXTURES: string[] = list("aix", ".aix");

export async function fixture(path: string): Promise<Blob> {
  return new Blob([await readFile(join(FIXTURES_DIR, path))]);
}

export const SCM = `#|
$JSON
{"authURL":["ai2.appinventor.mit.edu"],"YaVersion":"232","Source":"Form","Properties":{"$Name":"Screen1","$Type":"Form","$Version":"31","AppName":"Demo","Title":"Screen1","Uuid":"0","$Components":[{"$Name":"Row","$Type":"HorizontalArrangement","$Version":"4","Uuid":"100","$Components":[{"$Name":"Button1","$Type":"Button","$Version":"7","Image":"logo.png","Text":"Go","Uuid":"101"},{"$Name":"Label1","$Type":"Label","$Version":"6","Uuid":"102"}]},{"$Name":"Ext1","$Type":"com.example.ext.Thing","$Version":"2","Uuid":"103"}]}}
|#`;

export const BKY = `<xml xmlns="http://www.w3.org/1999/xhtml">
  <block type="global_declaration" id="g1" inline="false" x="10" y="10">
    <field name="NAME">count</field>
    <value name="VALUE"><block type="math_number" id="n1"><field name="NUM">0</field></block></value>
  </block>
  <block type="component_event" id="e1" x="10" y="80">
    <mutation component_type="Button" is_generic="false" instance_name="Button1" event_name="Click"></mutation>
    <field name="COMPONENT_SELECTOR">Button1</field>
    <statement name="DO">
      <block type="component_set_get" id="s1">
        <mutation component_type="Label" set_or_get="set" property_name="Text" is_generic="false" instance_name="Label1"></mutation>
        <field name="COMPONENT_SELECTOR">Label1</field>
        <field name="PROP">Text</field>
        <value name="VALUE"><block type="text" id="t1"><field name="TEXT">logo.png</field></block></value>
        <next>
          <block type="component_method" id="m1">
            <mutation component_type="Thing" method_name="Run" is_generic="false" instance_name="Ext1"></mutation>
            <field name="COMPONENT_SELECTOR">Ext1</field>
            <next>
              <block type="controls_openAnotherScreen" id="o1" inline="false">
                <value name="SCREEN"><block type="text" id="t2"><field name="TEXT">Screen2</field></block></value>
              </block>
            </next>
          </block>
        </next>
      </block>
    </statement>
  </block>
  <block type="procedures_defnoreturn" id="p1" collapsed="true" x="300" y="10">
    <mutation><arg name="x"></arg></mutation>
    <field name="NAME">doIt</field>
    <field name="VAR0">x</field>
    <comment pinned="false" h="80" w="160">a &amp; b &lt;c&gt;</comment>
  </block>
  <block type="math_number" id="orphan" x="500" y="500"><field name="NUM">42</field></block>
  <yacodeblocks ya-version="232" language-version="37"></yacodeblocks>
</xml>`;

export const PROPERTIES = `#
#Thu Jun 26 15:32:58 EDT 2025
main=appinventor.ai_test.Demo.Screen1
name=Demo
assets=../assets
source=../src
build=../build
versioncode=3
versionname=1.2
useslocation=False
aname=Demo App
icon=logo.png
sizing=Responsive
`;

export function screen(name: string, scm: string = SCM, bky: string = BKY): Screen {
  const form = parseScm(scm.replace('"$Name":"Screen1"', `"$Name":"${name}"`));
  const blocks = parseBky(bky);
  return {
    name,
    form: form.form,
    blocks: blocks.blocks,
    meta: { form: form.meta, blocks: blocks.meta },
  };
}

export const EMPTY_SCM = `#|
$JSON
{"authURL":[],"YaVersion":"232","Source":"Form","Properties":{"$Name":"Screen1","$Type":"Form","$Version":"31","Title":"Screen1","Uuid":"0"}}
|#`;

export function extension(packageName = "com.example.ext", typeName = "Thing"): Extension {
  const json = JSON.stringify([
    {
      type: `${packageName}.${typeName}`,
      name: typeName,
      external: "true",
      version: "2",
      categoryString: "EXTENSION",
      nonVisible: "true",
      properties: [{ name: "Mode", editorType: "string", defaultValue: "" }],
      blockProperties: [
        { name: "Mode", description: "", type: "text", rw: "read-write", deprecated: "false" },
      ],
      events: [],
      methods: [{ name: "Run", description: "", deprecated: "false", params: [] }],
    },
  ]);
  return {
    packageName,
    components: parseComponentDescriptors(JSON.parse(json)),
    files: [
      { path: "components.json", blob: new Blob([json]) },
      { path: "classes.jar", blob: new Blob([new Uint8Array([1, 2, 3])]) },
    ],
  };
}

/** A two-screen project: `Screen1` (components, blocks, extension use) and an empty `Screen2`. */
export function demoProject(): Project {
  return {
    properties: parseProperties(PROPERTIES),
    screens: [screen("Screen1"), screen("Screen2", EMPTY_SCM, "")],
    assets: [
      { name: "logo.png", blob: new Blob([new Uint8Array([9, 8, 7])]) },
      { name: "unused.mp3", blob: new Blob(["x"]) },
    ],
    extensions: [extension()],
    otherFiles: [],
  };
}
