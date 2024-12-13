import {describe, expect, it} from "vitest";
import {AIAReader} from "../src/index.ts";
import fs from "node:fs/promises";

describe('AIAReader', () => {
    it('should read the AIA file', async (context) => {
        const aiaFile = await fs.readFile('test/fixtures/Test.aia')
        const aiaFileBlob = new Blob([aiaFile])

        const project = await AIAReader.parse(aiaFileBlob)

        expect(project).toBeDefined()

        expect(project.name).toBe('Test')

        expect(project.screens.length).toBe(1)
        expect(project.screens[0].name).toBe('Screen1')
    })
})
