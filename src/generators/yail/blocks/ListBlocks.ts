import { Scheme, SchemeExpr } from '../ast/SchemeAST.js'
import { yailPrimitiveCall } from '../ast/YailConstructs.js'
import { YAIL_TYPES, type YailType } from '../../../types.js'
import type { Block } from '../../../types.js'
import type YailGenerator from '../YailGenerator.js'

export default class ListBlocks {
  constructor(private generator: YailGenerator) {}

  registerBlocks(): void {
    this.generator.register('lists_create_with', (block) => this.generateListCreation(block))
    this.generator.register('lists_create_empty', (block) => this.generateEmptyList(block))
    this.generator.register('lists_length', (block) => this.generateListLength(block))
    this.generator.register('lists_is_empty', (block) => this.generateListIsEmpty(block))
    this.generator.register('lists_append', (block) => this.generateListAppend(block))
    this.generator.register('lists_add_items', (block) => this.generateListAddItems(block))
    this.generator.register('lists_from_csv_table', (block) => this.generateListFromCsvTable(block))
    this.generator.register('lists_from_csv_row', (block) => this.generateListFromCsvRow(block))
    this.generator.register('lists_to_csv_table', (block) => this.generateListToCsvTable(block))
    this.generator.register('lists_to_csv_row', (block) => this.generateListToCsvRow(block))
    this.generator.register('lists_pick_random_item', (block) => this.generateListPickRandomItem(block))
    this.generator.register('lists_get_index', (block) => this.generateListIndex(block))
    this.generator.register('lists_select_item', (block) => this.generateListSelectItem(block))
    this.generator.register('lists_set_index', (block) => this.generateListSetIndex(block))
    this.generator.register('lists_replace_item', (block) => this.generateListReplaceItem(block))
    this.generator.register('lists_insert', (block) => this.generateListInsert(block))
    this.generator.register('lists_insert_item', (block) => this.generateListInsertItem(block))
    this.generator.register('lists_remove', (block) => this.generateListRemove(block))
    this.generator.register('lists_remove_item', (block) => this.generateListRemoveItem(block))
    this.generator.register('lists_append_list', (block) => this.generateListAppendList(block))
    this.generator.register('lists_copy', (block) => this.generateListCopy(block))
    this.generator.register('lists_reverse', (block) => this.generateListReverse(block))
    this.generator.register('lists_contains', (block) => this.generateListContains(block))
    this.generator.register('lists_is_in', (block) => this.generateListIsIn(block))
    this.generator.register('lists_position', (block) => this.generateListPosition(block))
    this.generator.register('lists_position_in', (block) => this.generateListPositionIn(block))
    this.generator.register('lists_is_list', (block) => this.generateListIsList(block))
    this.generator.register('lists_lookup_in_pairs', (block) => this.generateListLookupInPairs(block))
    this.generator.register('lists_join_with_separator', (block) => this.generateListJoinWithSeparator(block))
  }

  generateListCreation(block: Block): SchemeExpr {
    const items: SchemeExpr[] = []
    const itemTypes: YailType[] = []
    const itemCount = parseInt(block.mutation?.items || '0')

    for (let i = 0; i < itemCount; i++) {
      const item = block.values?.[`ADD${i}`]
      if (item) {
        const itemCode = this.generator.valueToCode(item)
        if (!itemCode) throw new Error("todo")
        items.push(itemCode)
        itemTypes.push(this.generator.inferYailType(item))
      } else {
        items.push(Scheme.string(''))
        itemTypes.push(YAIL_TYPES.TEXT)
      }
    }

    return yailPrimitiveCall(
      'make-yail-list',
      items,
      itemTypes,
      'make a list'
    )
  }

  generateEmptyList(block: Block): SchemeExpr {
    return yailPrimitiveCall(
      'make-yail-list',
      [],
      [],
      'make a list'
    )
  }

  generateListLength(block: Block): SchemeExpr {
    const list = this.generator.valueToCode(block.values?.LIST)
    const listExpr = list
    return yailPrimitiveCall(
      'yail-list-length',
      [listExpr],
      [YAIL_TYPES.LIST],
      'length of list'
    )
  }

  generateListIsEmpty(block: Block): SchemeExpr {
    const list = this.generator.valueToCode(block.values?.LIST)
    const listExpr = list
    return yailPrimitiveCall(
      'yail-list-empty?',
      [listExpr],
      [YAIL_TYPES.LIST],
      'is list empty?'
    )
  }

  generateListAppend(block: Block): SchemeExpr {
    const list1 = this.generator.valueToCode(block.values?.LIST1)
    const list2 = this.generator.valueToCode(block.values?.LIST2)
    const list1Expr = list1
    const list2Expr = list2
    return yailPrimitiveCall(
      'yail-list-append',
      [list1Expr, list2Expr],
      [YAIL_TYPES.LIST, YAIL_TYPES.LIST],
      'append to list'
    )
  }

  generateListAddItems(block: Block): SchemeExpr {
    const list = this.generator.valueToCode(block.values?.LIST)
    const item = this.generator.valueToCode(block.values?.ITEM)
    const listExpr = list
    const itemExpr = item
    return yailPrimitiveCall(
      'yail-list-add-to-list!',
      [listExpr, itemExpr],
      [YAIL_TYPES.LIST, YAIL_TYPES.ANY],
      'add items to list'
    )
  }

  generateListFromCsvTable(block: Block): SchemeExpr {
    const text = this.generator.valueToCode(block.values?.TEXT)
    const textExpr = text
    return yailPrimitiveCall(
      'yail-list-from-csv-table',
      [textExpr],
      [YAIL_TYPES.TEXT],
      'list from csv table'
    )
  }

  generateListFromCsvRow(block: Block): SchemeExpr {
    const text = this.generator.valueToCode(block.values?.TEXT)
    const textExpr = text
    return yailPrimitiveCall(
      'yail-list-from-csv-row',
      [textExpr],
      [YAIL_TYPES.TEXT],
      'list from csv row'
    )
  }

  generateListToCsvTable(block: Block): SchemeExpr {
    const list = this.generator.valueToCode(block.values?.LIST)
    const listExpr = list
    return yailPrimitiveCall(
      'yail-list-to-csv-table',
      [listExpr],
      [YAIL_TYPES.LIST],
      'list to csv table'
    )
  }

  generateListToCsvRow(block: Block): SchemeExpr {
    const list = this.generator.valueToCode(block.values?.LIST)
    const listExpr = list
    return yailPrimitiveCall(
      'yail-list-to-csv-row',
      [listExpr],
      [YAIL_TYPES.LIST],
      'list to csv row'
    )
  }

  generateListPickRandomItem(block: Block): SchemeExpr {
    const list = this.generator.valueToCode(block.values?.LIST)
    const listExpr = list
    return yailPrimitiveCall(
      'yail-list-pick-random',
      [listExpr],
      [YAIL_TYPES.LIST],
      'pick random item'
    )
  }

  generateListIndex(block: Block): SchemeExpr {
    const list = this.generator.valueToCode(block.values?.LIST)
    const index = this.generator.valueToCode(block.values?.INDEX)
    const listExpr = list
    const indexExpr = index
    return yailPrimitiveCall(
      'yail-list-get-item',
      [listExpr, indexExpr],
      [YAIL_TYPES.LIST, YAIL_TYPES.NUMBER],
      'select list item'
    )
  }

  generateListSetIndex(block: Block): SchemeExpr {
    const list = this.generator.valueToCode(block.values?.LIST)
    const index = this.generator.valueToCode(block.values?.INDEX)
    const value = this.generator.valueToCode(block.values?.VALUE)
    const listExpr = list
    const indexExpr = index
    const valueExpr = value
    return yailPrimitiveCall(
      'yail-list-set-item!',
      [listExpr, indexExpr, valueExpr],
      [YAIL_TYPES.LIST, YAIL_TYPES.NUMBER, YAIL_TYPES.ANY],
      'replace list item'
    )
  }

  generateListInsert(block: Block): SchemeExpr {
    const list = this.generator.valueToCode(block.values?.LIST)
    const index = this.generator.valueToCode(block.values?.INDEX)
    const item = this.generator.valueToCode(block.values?.ITEM)
    const listExpr = list
    const indexExpr = index
    const itemExpr = item
    return yailPrimitiveCall(
      'yail-list-insert-item!',
      [listExpr, indexExpr, itemExpr],
      [YAIL_TYPES.LIST, YAIL_TYPES.NUMBER, YAIL_TYPES.ANY],
      'insert list item'
    )
  }

  generateListRemove(block: Block): SchemeExpr {
    const list = this.generator.valueToCode(block.values?.LIST)
    const index = this.generator.valueToCode(block.values?.INDEX)
    const listExpr = list
    const indexExpr = index
    return yailPrimitiveCall(
      'yail-list-remove-item!',
      [listExpr, indexExpr],
      [YAIL_TYPES.LIST, YAIL_TYPES.NUMBER],
      'remove list item'
    )
  }

  generateListCopy(block: Block): SchemeExpr {
    const list = this.generator.valueToCode(block.values?.LIST)
    const listExpr = list
    return yailPrimitiveCall(
      'yail-list-copy',
      [listExpr],
      [YAIL_TYPES.LIST],
      'copy list'
    )
  }

  generateListReverse(block: Block): SchemeExpr {
    const list = this.generator.valueToCode(block.values?.LIST)
    const listExpr = list
    return yailPrimitiveCall(
      'yail-list-reverse',
      [listExpr],
      [YAIL_TYPES.LIST],
      'reverse list'
    )
  }

  generateListContains(block: Block): SchemeExpr {
    const list = this.generator.valueToCode(block.values?.LIST)
    const item = this.generator.valueToCode(block.values?.ITEM)
    const listExpr = list
    const itemExpr = item
    return yailPrimitiveCall(
      'yail-list-member?',
      [itemExpr, listExpr],
      [YAIL_TYPES.ANY, YAIL_TYPES.LIST],
      'is in list?'
    )
  }

  generateListPosition(block: Block): SchemeExpr {
    const list = this.generator.valueToCode(block.values?.LIST)
    const item = this.generator.valueToCode(block.values?.ITEM)
    const listExpr = list
    const itemExpr = item
    return yailPrimitiveCall(
      'yail-list-index',
      [itemExpr, listExpr],
      [YAIL_TYPES.ANY, YAIL_TYPES.LIST],
      'position in list'
    )
  }

  generateListSelectItem(block: Block): SchemeExpr {
    const list = this.generator.valueToCode(block.values?.LIST)
    const index = this.generator.valueToCode(block.values?.NUM)
    const listExpr = list
    const indexExpr = index
    return yailPrimitiveCall(
      'yail-list-get-item',
      [listExpr, indexExpr],
      [YAIL_TYPES.LIST, YAIL_TYPES.NUMBER],
      'select list item'
    )
  }

  generateListReplaceItem(block: Block): SchemeExpr {
    const list = this.generator.valueToCode(block.values?.LIST)
    const index = this.generator.valueToCode(block.values?.NUM)
    const item = this.generator.valueToCode(block.values?.ITEM)
    const listExpr = list
    const indexExpr = index
    const itemExpr = item
    return yailPrimitiveCall(
      'yail-list-set-item!',
      [listExpr, indexExpr, itemExpr],
      [YAIL_TYPES.LIST, YAIL_TYPES.NUMBER, YAIL_TYPES.ANY],
      'replace list item'
    )
  }

  generateListInsertItem(block: Block): SchemeExpr {
    const list = this.generator.valueToCode(block.values?.LIST)
    const index = this.generator.valueToCode(block.values?.INDEX)
    const item = this.generator.valueToCode(block.values?.ITEM)
    const listExpr = list
    const indexExpr = index
    const itemExpr = item
    return yailPrimitiveCall(
      'yail-list-insert-item!',
      [listExpr, indexExpr, itemExpr],
      [YAIL_TYPES.LIST, YAIL_TYPES.NUMBER, YAIL_TYPES.ANY],
      'insert list item'
    )
  }

  generateListRemoveItem(block: Block): SchemeExpr {
    const list = this.generator.valueToCode(block.values?.LIST)
    const index = this.generator.valueToCode(block.values?.INDEX)
    const listExpr = list
    const indexExpr = index
    return yailPrimitiveCall(
      'yail-list-remove-item!',
      [listExpr, indexExpr],
      [YAIL_TYPES.LIST, YAIL_TYPES.NUMBER],
      'remove list item'
    )
  }

  generateListAppendList(block: Block): SchemeExpr {
    const list0 = this.generator.valueToCode(block.values?.LIST0)
    const list1 = this.generator.valueToCode(block.values?.LIST1)
    const list0Expr = list0
    const list1Expr = list1
    return yailPrimitiveCall(
      'yail-list-append!',
      [list0Expr, list1Expr],
      [YAIL_TYPES.LIST, YAIL_TYPES.LIST],
      'append to list'
    )
  }

  generateListIsIn(block: Block): SchemeExpr {
    const item = this.generator.valueToCode(block.values?.ITEM)
    const list = this.generator.valueToCode(block.values?.LIST)
    const itemExpr = item
    const listExpr = list
    return yailPrimitiveCall(
      'yail-list-member?',
      [itemExpr, listExpr],
      [YAIL_TYPES.ANY, YAIL_TYPES.LIST],
      'is in list?'
    )
  }

  generateListPositionIn(block: Block): SchemeExpr {
    const item = this.generator.valueToCode(block.values?.ITEM)
    const list = this.generator.valueToCode(block.values?.LIST)
    const itemExpr = item
    const listExpr = list
    return yailPrimitiveCall(
      'yail-list-index',
      [itemExpr, listExpr],
      [YAIL_TYPES.ANY, YAIL_TYPES.LIST],
      'index in list'
    )
  }

  generateListIsList(block: Block): SchemeExpr {
    const item = this.generator.valueToCode(block.values?.ITEM)
    const itemExpr = item
    return yailPrimitiveCall(
      'yail-list?',
      [itemExpr],
      [YAIL_TYPES.ANY],
      'is a list?'
    )
  }

  generateListLookupInPairs(block: Block): SchemeExpr {
    const key = this.generator.valueToCode(block.values?.KEY)
    const list = this.generator.valueToCode(block.values?.LIST)
    const notFound = this.generator.valueToCode(block.values?.NOTFOUND)
    const keyExpr = key
    const listExpr = list
    const notFoundExpr = notFound
    return yailPrimitiveCall(
      'yail-alist-lookup',
      [keyExpr, listExpr, notFoundExpr],
      [YAIL_TYPES.ANY, YAIL_TYPES.LIST, YAIL_TYPES.ANY],
      'lookup in pairs'
    )
  }

  generateListJoinWithSeparator(block: Block): SchemeExpr {
    const separator = this.generator.valueToCode(block.values?.SEPARATOR)
    const list = this.generator.valueToCode(block.values?.LIST)
    const separatorExpr = separator
    const listExpr = list
    return yailPrimitiveCall(
      'yail-list-join-with-separator',
      [listExpr, separatorExpr],
      [YAIL_TYPES.LIST, YAIL_TYPES.TEXT],
      'join with separator'
    )
  }
}
