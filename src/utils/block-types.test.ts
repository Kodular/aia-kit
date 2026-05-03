import { describe, expect, it } from 'vitest'
import { isEventHandlerBlock } from '#/utils/block-types.js'

describe('isEventHandlerBlock', () => {
  it('recognizes shared event handler block patterns', () => {
    expect(isEventHandlerBlock('event_handler')).toBe(true)
    expect(isEventHandlerBlock('foo_event_bar')).toBe(true)
    expect(isEventHandlerBlock('when_Screen1.Initialize')).toBe(true)
    expect(isEventHandlerBlock('component_Button1_Click')).toBe(true)
  })

  it('rejects non-event block types', () => {
    expect(isEventHandlerBlock('math_number')).toBe(false)
    expect(isEventHandlerBlock('component_Button1_Touched')).toBe(false)
    expect(isEventHandlerBlock('component_event')).toBe(false)
  })
})
