import { parseBky } from '#/blocks/bky-parser.js'
import { serializeBky } from '#/blocks/bky-serializer.js'
import type { BlockAst } from '#/blocks/ast.js'
import type { AiaProject, AiaScreen } from '#/core/types.js'
import type { Diagnostic } from '#/core/diagnostics.js'

export type { BlockAst } from '#/blocks/ast.js'
export type { BlockNode } from '#/blocks/ast.js'

export function parseBlocks(bky: string): BlockAst {
  return parseBky(bky)
}

export function serializeBlocks(ast: BlockAst): string {
  return serializeBky(ast)
}

export function queryBlocks<T>(
  screen: AiaScreen | { source: AiaScreen },
  query: (ast: BlockAst) => T
): T {
  const bky = 'source' in screen ? screen.source.bky : screen.bky
  return query(parseBky(bky))
}

export function updateBlocks(
  project: AiaProject,
  screenName: string,
  astOrUpdater: BlockAst | ((ast: BlockAst) => BlockAst)
): { project: AiaProject; diagnostics: Diagnostic[] } {
  const screenIndex = project.screens.findIndex(s => s.name === screenName)
  if (screenIndex === -1) {
    return {
      project,
      diagnostics: [{
        code: 'MISSING_SCREEN_FILE',
        severity: 'error',
        path: ['screens', screenName],
        message: `Screen "${screenName}" not found`
      }]
    }
  }
  const screen = project.screens[screenIndex]
  const ast = typeof astOrUpdater === 'function'
    ? astOrUpdater(parseBky(screen.bky))
    : astOrUpdater
  const newScreens = [...project.screens]
  newScreens[screenIndex] = { ...screen, bky: serializeBky(ast) }
  return { project: { ...project, screens: newScreens }, diagnostics: [] }
}

export function updateAllScreenBlocks(
  project: AiaProject,
  updater: (ast: BlockAst, screenName: string) => BlockAst
): { project: AiaProject; diagnostics: Diagnostic[] } {
  const newScreens = project.screens.map(screen => {
    const ast = updater(parseBky(screen.bky), screen.name)
    return { ...screen, bky: serializeBky(ast) }
  })
  return { project: { ...project, screens: newScreens }, diagnostics: [] }
}

export function updateScreenBky(
  project: AiaProject,
  screenName: string,
  bky: string
): { project: AiaProject; diagnostics: Diagnostic[] } {
  const screenIndex = project.screens.findIndex(s => s.name === screenName)
  if (screenIndex === -1) {
    return {
      project,
      diagnostics: [{
        code: 'MISSING_SCREEN_FILE',
        severity: 'error',
        path: ['screens', screenName],
        message: `Screen "${screenName}" not found`
      }]
    }
  }
  const newScreens = [...project.screens]
  newScreens[screenIndex] = { ...newScreens[screenIndex], bky }
  return { project: { ...project, screens: newScreens }, diagnostics: [] }
}