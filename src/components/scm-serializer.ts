import type { AiaComponent } from '#/core/types.js'

// Note: property types are not preserved — parseScm already stringifies all values,
// so this serializer only guarantees AiaComponent model round-trips, not raw JSON fidelity.
export function serializeScm(root: AiaComponent, originalScm: string): string {
  const match = originalScm.match(/#\|\s*\$JSON\s*([\s\S]*?)\s*\|#/)
  if (!match || !match[1]) {
    throw new Error('Invalid SCM format: cannot serialize without original wrapper')
  }
  const wrapper = JSON.parse(match[1].trim()) as Record<string, unknown>
  wrapper.Properties = componentToJson(root)
  return `#|\n$JSON\n${JSON.stringify(wrapper)}\n|#`
}

function componentToJson(comp: AiaComponent): Record<string, unknown> {
  return {
    ...comp.properties,
    $Name: comp.name,
    $Type: comp.type,
    Uuid: comp.uid,
    $Components: comp.children.map(componentToJson),
  }
}
