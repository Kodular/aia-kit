export function isEventHandlerBlock(type: string): boolean {
  return (
    type === 'event_handler' ||
    type.includes('event_') ||
    type.startsWith('when_') ||
    (type.startsWith('component_') && type.includes('Click'))
  )
}
