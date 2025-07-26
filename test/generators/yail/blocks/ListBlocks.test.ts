import { describe, test, expect, beforeEach, vi } from 'vitest'
import ListBlocks from '../../../../src/generators/yail/blocks/ListBlocks.js'
import type YailGenerator from '../../../../src/generators/yail/YailGenerator.js'
import type { Block } from "../../../../src/types.js"

const mockRegister = vi.fn(() => {})
const mockStatementToCode = vi.fn((block: any) => block ? [{ format: () => 'mockValue' }] : [])
const mockValueToCode = vi.fn((block: any) => block ? ({ format: () => 'mockValue' }) : undefined)
const mockInferYailType = vi.fn((block: any) => 'text')

const mockGenerator = {
  register: mockRegister,
  statementToCode: mockStatementToCode,
  valueToCode: mockValueToCode,
  inferYailType: mockInferYailType
} as unknown as YailGenerator

describe('ListBlocks', () => {
  let listBlocks: ListBlocks

  beforeEach(() => {
    listBlocks = new ListBlocks(mockGenerator)
    listBlocks.registerBlocks()  // Manually register blocks in tests
    mockRegister.mockClear()
    mockStatementToCode.mockClear()
    mockValueToCode.mockClear()
    mockInferYailType.mockClear()
  })

  describe('generateListCreation', () => {
    test('generates list with multiple items', () => {
      const block: Block = {
        type: 'lists_create_with',
        mutation: {
          items: '3'
        },
        values: {
          ADD0: { type: 'text' },
          ADD1: { type: 'math_number' },
          ADD2: { type: 'logic_boolean' }
        }
      }

      const result = listBlocks.generateListCreation(block)
      expect(result.format()).toContain('call-yail-primitive make-yail-list')
    })

    test('generates empty list when no items', () => {
      const block: Block = {
        type: 'lists_create_with',
        mutation: {
          items: '0'
        }
      }

      const result = listBlocks.generateListCreation(block)
      expect(result.format()).toContain('call-yail-primitive make-yail-list')
    })

    test('handles missing item values with empty strings', () => {
      const block: Block = {
        type: 'lists_create_with',
        mutation: {
          items: '2'
        },
        values: {
          ADD0: { type: 'text' }
          // ADD1 is missing
        }
      }

      const result = listBlocks.generateListCreation(block)
      expect(result.format()).toContain('call-yail-primitive make-yail-list')
    })
  })

  describe('generateEmptyList', () => {
    test('generates empty list', () => {
      const block: Block = {
        type: 'lists_create_empty'
      }

      const result = listBlocks.generateEmptyList(block)
      expect(result.format()).toBe("(call-yail-primitive make-yail-list (*list-for-runtime*) '() \"make a list\")")
    })
  })

  describe('generateListLength', () => {
    test('generates list length operation', () => {
      const block: Block = {
        type: 'lists_length',
        values: {
          LIST: { type: 'lists_create_with' }
        }
      }

      const result = listBlocks.generateListLength(block)
      expect(result.format()).toContain('call-yail-primitive yail-list-length')
    })
  })

  describe('generateListIsEmpty', () => {
    test('generates list empty check', () => {
      const block: Block = {
        type: 'lists_isEmpty',
        values: {
          LIST: { type: 'lists_create_with' }
        }
      }

      const result = listBlocks.generateListIsEmpty(block)
      expect(result.format()).toContain('call-yail-primitive yail-list-empty?')
    })
  })

  describe('generateListAppend', () => {
    test('generates list append operation', () => {
      const block: Block = {
        type: 'lists_append_list',
        values: {
          LIST1: { type: 'lists_create_with' },
          LIST2: { type: 'lists_create_with' }
        }
      }

      const result = listBlocks.generateListAppend(block)
      expect(result.format()).toContain('call-yail-primitive yail-list-append')
    })
  })

  describe('generateListAddItems', () => {
    test('generates add items to list operation', () => {
      const block: Block = {
        type: 'lists_add_items',
        values: {
          LIST: { type: 'lists_create_with' },
          ITEM: { type: 'text' }
        }
      }

      const result = listBlocks.generateListAddItems(block)
      expect(result.format()).toContain('call-yail-primitive yail-list-add-to-list!')
    })
  })

  describe('generateListFromCsvTable', () => {
    test('generates list from CSV table', () => {
      const block: Block = {
        type: 'lists_from_csv_table',
        values: {
          TEXT: { type: 'text' }
        }
      }

      const result = listBlocks.generateListFromCsvTable(block)
      expect(result.format()).toContain('call-yail-primitive yail-list-from-csv-table')
    })
  })

  describe('generateListFromCsvRow', () => {
    test('generates list from CSV row', () => {
      const block: Block = {
        type: 'lists_from_csv_row',
        values: {
          TEXT: { type: 'text' }
        }
      }

      const result = listBlocks.generateListFromCsvRow(block)
      expect(result.format()).toContain('call-yail-primitive yail-list-from-csv-row')
    })
  })

  describe('generateListToCsvTable', () => {
    test('generates list to CSV table', () => {
      const block: Block = {
        type: 'lists_to_csv_table',
        values: {
          LIST: { type: 'lists_create_with' }
        }
      }

      const result = listBlocks.generateListToCsvTable(block)
      expect(result.format()).toContain('call-yail-primitive yail-list-to-csv-table')
    })
  })

  describe('generateListToCsvRow', () => {
    test('generates list to CSV row', () => {
      const block: Block = {
        type: 'lists_to_csv_row',
        values: {
          LIST: { type: 'lists_create_with' }
        }
      }

      const result = listBlocks.generateListToCsvRow(block)
      expect(result.format()).toContain('call-yail-primitive yail-list-to-csv-row')
    })
  })

  describe('generateListPickRandomItem', () => {
    test('generates pick random item from list', () => {
      const block: Block = {
        type: 'lists_pick_random_item',
        values: {
          LIST: { type: 'lists_create_with' }
        }
      }

      const result = listBlocks.generateListPickRandomItem(block)
      expect(result.format()).toContain('call-yail-primitive yail-list-pick-random')
    })
  })

  describe('generateListIndex', () => {
    test('generates select list item operation', () => {
      const block: Block = {
        type: 'lists_select_item',
        values: {
          LIST: { type: 'lists_create_with' },
          INDEX: { type: 'math_number' }
        }
      }

      const result = listBlocks.generateListIndex(block)
      expect(result.format()).toContain('call-yail-primitive yail-list-get-item')
    })
  })

  describe('generateListSetIndex', () => {
    test('generates replace list item operation', () => {
      const block: Block = {
        type: 'lists_replace_item',
        values: {
          LIST: { type: 'lists_create_with' },
          INDEX: { type: 'math_number' },
          VALUE: { type: 'text' }
        }
      }

      const result = listBlocks.generateListSetIndex(block)
      expect(result.format()).toContain('call-yail-primitive yail-list-set-item!')
    })
  })

  describe('generateListInsert', () => {
    test('generates insert list item operation', () => {
      const block: Block = {
        type: 'lists_insert_item',
        values: {
          LIST: { type: 'lists_create_with' },
          INDEX: { type: 'math_number' },
          ITEM: { type: 'text' }
        }
      }

      const result = listBlocks.generateListInsert(block)
      expect(result.format()).toContain('call-yail-primitive yail-list-insert-item!')
    })
  })

  describe('generateListRemove', () => {
    test('generates remove list item operation', () => {
      const block: Block = {
        type: 'lists_remove_item',
        values: {
          LIST: { type: 'lists_create_with' },
          INDEX: { type: 'math_number' }
        }
      }

      const result = listBlocks.generateListRemove(block)
      expect(result.format()).toContain('call-yail-primitive yail-list-remove-item!')
    })
  })

  describe('generateListCopy', () => {
    test('generates copy list operation', () => {
      const block: Block = {
        type: 'lists_copy',
        values: {
          LIST: { type: 'lists_create_with' }
        }
      }

      const result = listBlocks.generateListCopy(block)
      expect(result.format()).toContain('call-yail-primitive yail-list-copy')
    })
  })

  describe('generateListReverse', () => {
    test('generates reverse list operation', () => {
      const block: Block = {
        type: 'lists_reverse',
        values: {
          LIST: { type: 'lists_create_with' }
        }
      }

      const result = listBlocks.generateListReverse(block)
      expect(result.format()).toContain('call-yail-primitive yail-list-reverse')
    })
  })

  describe('generateListContains', () => {
    test('generates list contains check', () => {
      const block: Block = {
        type: 'lists_is_in',
        values: {
          LIST: { type: 'lists_create_with' },
          ITEM: { type: 'text' }
        }
      }

      const result = listBlocks.generateListContains(block)
      expect(result.format()).toContain('call-yail-primitive yail-list-member?')
    })
  })

  describe('generateListPosition', () => {
    test('generates position in list operation', () => {
      const block: Block = {
        type: 'lists_position_in',
        values: {
          LIST: { type: 'lists_create_with' },
          ITEM: { type: 'text' }
        }
      }

      const result = listBlocks.generateListPosition(block)
      expect(result.format()).toContain('call-yail-primitive yail-list-index')
    })
  })
})
