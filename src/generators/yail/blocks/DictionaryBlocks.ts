import { Scheme, SchemeExpr } from '../ast/SchemeAST.js'
import { yailPrimitiveCall } from '../ast/YailConstructs.js'
import { YAIL_TYPES, type YailType } from '../../../types.js'
import type { Block } from '../../../types.js'
import type YailGenerator from '../YailGenerator.js'

export default class DictionaryBlocks {
  constructor(private generator: YailGenerator) {}

  registerBlocks(): void {
    this.generator.register('dictionaries_create_with', (block) => this.generateDictionaryCreateWith(block))
    this.generator.register('pair', (block) => this.generatePair(block))
    this.generator.register('dictionaries_set_pair', (block) => this.generateDictionarySetPair(block))
    this.generator.register('dictionaries_delete_pair', (block) => this.generateDictionaryDeletePair(block))
    this.generator.register('dictionaries_lookup', (block) => this.generateDictionaryLookup(block))
    this.generator.register('dictionaries_recursive_lookup', (block) => this.generateDictionaryRecursiveLookup(block))
    this.generator.register('dictionaries_recursive_set', (block) => this.generateDictionaryRecursiveSet(block))
    this.generator.register('dictionaries_getters', (block) => this.generateDictionaryGetters(block))
    this.generator.register('dictionaries_get_values', (block) => this.generateDictionaryGetValues(block))
    this.generator.register('dictionaries_is_key_in', (block) => this.generateDictionaryIsKeyIn(block))
    this.generator.register('dictionaries_length', (block) => this.generateDictionaryLength(block))
    this.generator.register('dictionaries_alist_to_dict', (block) => this.generateDictionaryAlistToDict(block))
    this.generator.register('dictionaries_dict_to_alist', (block) => this.generateDictionaryDictToAlist(block))
    this.generator.register('dictionaries_copy', (block) => this.generateDictionaryCopy(block))
    this.generator.register('dictionaries_combine_dicts', (block) => this.generateDictionaryCombineDicts(block))
    this.generator.register('dictionaries_walk_tree', (block) => this.generateDictionaryWalkTree(block))
    this.generator.register('dictionaries_walk_all', (block) => this.generateDictionaryWalkAll(block))
    this.generator.register('dictionaries_is_dict', (block) => this.generateDictionaryIsDict(block))
  }

  generateDictionaryCreateWith(block: Block): SchemeExpr {
    const itemCount = block.extraState?.itemCount || 0
    const args: SchemeExpr[] = []
    const typeArgs: YailType[] = []

    for (let i = 0; i < itemCount; i++) {
      const pairExpr = this.generator.valueToCode(block.values?.[`ADD${i}`])
      if (pairExpr) {
        args.push(pairExpr)
        typeArgs.push(YAIL_TYPES.PAIR)
      }
    }

    return yailPrimitiveCall(
      'make-yail-dictionary',
      args,
      typeArgs,
      'make a dictionary'
    )
  }

  generatePair(block: Block): SchemeExpr {
    const keyExpr = this.generator.valueToCode(block.values?.KEY) || Scheme.symbol('*the-null-value*')
    const valueExpr = this.generator.valueToCode(block.values?.VALUE) || Scheme.symbol('*the-null-value*')

    return yailPrimitiveCall(
      'make-dictionary-pair',
      [keyExpr, valueExpr],
      [YAIL_TYPES.KEY, YAIL_TYPES.ANY],
      'make a pair'
    )
  }

  generateDictionarySetPair(block: Block): SchemeExpr {
    const keyExpr = this.generator.valueToCode(block.values?.KEY) || Scheme.symbol('*the-null-value*')
    const dictExpr = this.generator.valueToCode(block.values?.DICT) || this.getEmptyDict()
    const valueExpr = this.generator.valueToCode(block.values?.VALUE) || Scheme.symbol('*the-null-value*')

    return yailPrimitiveCall(
      'yail-dictionary-set-pair',
      [keyExpr, dictExpr, valueExpr],
      [YAIL_TYPES.KEY, YAIL_TYPES.DICTIONARY, YAIL_TYPES.ANY],
      'set value for key in dictionary to value'
    )
  }

  generateDictionaryDeletePair(block: Block): SchemeExpr {
    const dictExpr = this.generator.valueToCode(block.values?.DICT) || this.getEmptyDict()
    const keyExpr = this.generator.valueToCode(block.values?.KEY) || Scheme.symbol('*the-null-value*')

    return yailPrimitiveCall(
      'yail-dictionary-delete-pair',
      [dictExpr, keyExpr],
      [YAIL_TYPES.DICTIONARY, YAIL_TYPES.KEY],
      'delete dictionary pair'
    )
  }

  generateDictionaryLookup(block: Block): SchemeExpr {
    const keyExpr = this.generator.valueToCode(block.values?.KEY) || Scheme.false()
    const dictExpr = this.generator.valueToCode(block.values?.DICT) || this.getEmptyDict()
    const notFoundExpr = this.generator.valueToCode(block.values?.NOTFOUND) || Scheme.symbol('*the-null-value*')

    return yailPrimitiveCall(
      'yail-dictionary-lookup',
      [keyExpr, dictExpr, notFoundExpr],
      [YAIL_TYPES.KEY, YAIL_TYPES.ANY, YAIL_TYPES.ANY],
      'dictionary lookup'
    )
  }

  generateDictionaryRecursiveLookup(block: Block): SchemeExpr {
    const keysExpr = this.generator.valueToCode(block.values?.KEYS) || Scheme.false()
    const dictExpr = this.generator.valueToCode(block.values?.DICT) || this.getEmptyDict()
    const notFoundExpr = this.generator.valueToCode(block.values?.NOTFOUND) || Scheme.symbol('*the-null-value*')

    return yailPrimitiveCall(
      'yail-dictionary-recursive-lookup',
      [keysExpr, dictExpr, notFoundExpr],
      [YAIL_TYPES.LIST, YAIL_TYPES.DICTIONARY, YAIL_TYPES.ANY],
      'dictionary recursive lookup'
    )
  }

  generateDictionaryRecursiveSet(block: Block): SchemeExpr {
    const keysExpr = this.generator.valueToCode(block.values?.KEYS) || Scheme.quote(Scheme.list())
    const dictExpr = this.generator.valueToCode(block.values?.DICT) || this.getEmptyDict()
    const valueExpr = this.generator.valueToCode(block.values?.VALUE) || Scheme.false()

    return yailPrimitiveCall(
      'yail-dictionary-recursive-set',
      [keysExpr, dictExpr, valueExpr],
      [YAIL_TYPES.LIST, YAIL_TYPES.DICTIONARY, YAIL_TYPES.ANY],
      'dictionary recursive set'
    )
  }

  generateDictionaryGetters(block: Block): SchemeExpr {
    const op = block.fields?.OP || 'KEYS'
    const dictExpr = this.generator.valueToCode(block.values?.DICT) || this.getEmptyDict()

    const operatorMap: { [key: string]: [string, string] } = {
      'KEYS': ['yail-dictionary-get-keys', "get a dictionary's keys"],
      'VALUES': ['yail-dictionary-get-values', "get a dictionary's values"]
    }

    const [operator, description] = operatorMap[op] || operatorMap['KEYS']

    return yailPrimitiveCall(
      operator,
      [dictExpr],
      [YAIL_TYPES.DICTIONARY],
      description
    )
  }

  generateDictionaryGetValues(block: Block): SchemeExpr {
    // This block uses the same logic as dictionaries_getters with OP='VALUES'
    const dictExpr = this.generator.valueToCode(block.values?.DICT) || this.getEmptyDict()

    return yailPrimitiveCall(
      'yail-dictionary-get-values',
      [dictExpr],
      [YAIL_TYPES.DICTIONARY],
      "get a dictionary's values"
    )
  }

  generateDictionaryIsKeyIn(block: Block): SchemeExpr {
    const keyExpr = this.generator.valueToCode(block.values?.KEY) || Scheme.false()
    const dictExpr = this.generator.valueToCode(block.values?.DICT) || this.getEmptyDict()

    return yailPrimitiveCall(
      'yail-dictionary-is-key-in',
      [keyExpr, dictExpr],
      [YAIL_TYPES.KEY, YAIL_TYPES.DICTIONARY],
      'is key in dict?'
    )
  }

  generateDictionaryLength(block: Block): SchemeExpr {
    const dictExpr = this.generator.valueToCode(block.values?.DICT) || this.getEmptyDict()

    return yailPrimitiveCall(
      'yail-dictionary-length',
      [dictExpr],
      [YAIL_TYPES.DICTIONARY],
      "get a dictionary's length"
    )
  }

  generateDictionaryAlistToDict(block: Block): SchemeExpr {
    const pairsExpr = this.generator.valueToCode(block.values?.PAIRS) || this.getEmptyDict()

    return yailPrimitiveCall(
      'yail-dictionary-alist-to-dict',
      [pairsExpr],
      [YAIL_TYPES.LIST],
      'convert an alist to a dictionary'
    )
  }

  generateDictionaryDictToAlist(block: Block): SchemeExpr {
    const dictExpr = this.generator.valueToCode(block.values?.DICT) || this.getEmptyDict()

    return yailPrimitiveCall(
      'yail-dictionary-dict-to-alist',
      [dictExpr],
      [YAIL_TYPES.DICTIONARY],
      'convert a dictionary to an alist'
    )
  }

  generateDictionaryCopy(block: Block): SchemeExpr {
    const dictExpr = this.generator.valueToCode(block.values?.DICT) || this.getEmptyDict()

    return yailPrimitiveCall(
      'yail-dictionary-copy',
      [dictExpr],
      [YAIL_TYPES.DICTIONARY],
      'get a shallow copy of a dict'
    )
  }

  generateDictionaryCombineDicts(block: Block): SchemeExpr {
    const dict1Expr = this.generator.valueToCode(block.values?.DICT1) || Scheme.false()
    const dict2Expr = this.generator.valueToCode(block.values?.DICT2) || this.getEmptyDict()

    return yailPrimitiveCall(
      'yail-dictionary-combine-dicts',
      [dict1Expr, dict2Expr],
      [YAIL_TYPES.DICTIONARY, YAIL_TYPES.DICTIONARY],
      'combine 2 dictionaries'
    )
  }

  generateDictionaryWalkTree(block: Block): SchemeExpr {
    const pathExpr = this.generator.valueToCode(block.values?.PATH) || Scheme.quote(Scheme.list(Scheme.symbol('*list*')))
    const dictExpr = this.generator.valueToCode(block.values?.DICT) || this.getEmptyDict()

    return yailPrimitiveCall(
      'yail-dictionary-walk',
      [pathExpr, dictExpr],
      [YAIL_TYPES.LIST, YAIL_TYPES.ANY],
      'list by walking key path in dictionary'
    )
  }

  generateDictionaryWalkAll(block: Block): SchemeExpr {
    // Returns the constant ALL value
    return Scheme.list(
      Scheme.symbol('static-field'),
      Scheme.symbol('com.google.appinventor.components.runtime.util.YailDictionary'),
      Scheme.string('ALL')
    )
  }

  generateDictionaryIsDict(block: Block): SchemeExpr {
    const thingExpr = this.generator.valueToCode(block.values?.THING) || this.getEmptyDict()

    return yailPrimitiveCall(
      'yail-dictionary?',
      [thingExpr],
      [YAIL_TYPES.ANY],
      'check if something is a dictionary'
    )
  }

  private getEmptyDict(): SchemeExpr {
    return Scheme.list(
      Scheme.symbol('make'),
      Scheme.symbol('com.google.appinventor.components.runtime.util.YailDictionary')
    )
  }
}
