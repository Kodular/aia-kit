import type { ComponentDescriptor } from '#/core/descriptors.js'

// ── ComponentRegistry ──────────────────────────────────────────────────────

export interface ComponentRegistry {
  readonly descriptors: ReadonlyArray<ComponentDescriptor>
  lookup(typeName: string): ComponentDescriptor | null
  extend(descriptors: ComponentDescriptor[]): ComponentRegistry
}

export function createComponentRegistry(descriptors: ComponentDescriptor[]): ComponentRegistry {
  const map = new Map<string, ComponentDescriptor>(descriptors.map(d => [d.type, d]))

  return {
    descriptors,
    lookup(typeName: string): ComponentDescriptor | null {
      return map.get(typeName) ?? null
    },
    extend(extra: ComponentDescriptor[]): ComponentRegistry {
      return createComponentRegistry([...descriptors, ...extra])
    },
  }
}

// ── BlockRegistry ──────────────────────────────────────────────────────────

export type BuiltinBlockCategory =
  | 'logic'
  | 'math'
  | 'text'
  | 'lists'
  | 'colors'
  | 'variables'
  | 'procedures'
  | 'controls'
  | 'dicts'

export interface BuiltinBlockDescriptor {
  type: string
  category: BuiltinBlockCategory
}

export interface BlockRegistry {
  readonly builtins: ReadonlyMap<string, BuiltinBlockDescriptor>
  lookup(type: string): BuiltinBlockDescriptor | null
  // Note: BlockRegistry has no `extend` method because block builtins are language primitives,
  // not extended by plugins. Component extensions add new components, not new block types.
}

export function createBlockRegistry(builtins: BuiltinBlockDescriptor[]): BlockRegistry {
  const map = new Map<string, BuiltinBlockDescriptor>(builtins.map(b => [b.type, b]))

  return {
    builtins: map,
    lookup(type: string): BuiltinBlockDescriptor | null {
      return map.get(type) ?? null
    },
  }
}

export const DEFAULT_BUILTINS: BuiltinBlockDescriptor[] = [
  // logic
  { type: 'logic_boolean', category: 'logic' },
  { type: 'logic_negate', category: 'logic' },
  { type: 'logic_operation', category: 'logic' },
  { type: 'logic_compare', category: 'logic' },
  { type: 'logic_and', category: 'logic' },
  { type: 'logic_or', category: 'logic' },
  { type: 'logic_not', category: 'logic' },

  // math
  { type: 'math_number', category: 'math' },
  { type: 'math_arithmetic', category: 'math' },
  { type: 'math_single', category: 'math' },
  { type: 'math_trig', category: 'math' },
  { type: 'math_abs', category: 'math' },
  { type: 'math_neg', category: 'math' },
  { type: 'math_round', category: 'math' },
  { type: 'math_modulo', category: 'math' },
  { type: 'math_add', category: 'math' },
  { type: 'math_subtract', category: 'math' },
  { type: 'math_multiply', category: 'math' },
  { type: 'math_divide', category: 'math' },
  { type: 'math_power', category: 'math' },
  { type: 'math_number_radix', category: 'math' },

  // text
  { type: 'text', category: 'text' },
  { type: 'text_join', category: 'text' },
  { type: 'text_length', category: 'text' },
  { type: 'text_isEmpty', category: 'text' },
  { type: 'text_compare', category: 'text' },
  { type: 'text_trim', category: 'text' },
  { type: 'text_changeCase', category: 'text' },
  { type: 'text_starts_at', category: 'text' },
  { type: 'text_contains', category: 'text' },
  { type: 'text_split', category: 'text' },
  { type: 'text_split_at_spaces', category: 'text' },
  { type: 'text_segment', category: 'text' },
  { type: 'text_replace_all', category: 'text' },
  { type: 'text_newline', category: 'text' },

  // lists
  { type: 'lists_create_with', category: 'lists' },
  { type: 'lists_length', category: 'lists' },
  { type: 'lists_isEmpty', category: 'lists' },
  { type: 'lists_pick_random_item', category: 'lists' },
  { type: 'lists_position_in', category: 'lists' },
  { type: 'lists_select_item', category: 'lists' },
  { type: 'lists_insert_item', category: 'lists' },
  { type: 'lists_replace_item', category: 'lists' },
  { type: 'lists_remove_item', category: 'lists' },
  { type: 'lists_append_list', category: 'lists' },
  { type: 'lists_copy', category: 'lists' },
  { type: 'lists_is_list', category: 'lists' },
  { type: 'lists_reverse', category: 'lists' },
  { type: 'lists_to_csv_row', category: 'lists' },
  { type: 'lists_to_csv_table', category: 'lists' },
  { type: 'lists_from_csv_row', category: 'lists' },
  { type: 'lists_from_csv_table', category: 'lists' },
  { type: 'lists_lookup_in_pairs', category: 'lists' },

  // colors
  { type: 'color_black', category: 'colors' },
  { type: 'color_white', category: 'colors' },
  { type: 'color_red', category: 'colors' },
  { type: 'color_pink', category: 'colors' },
  { type: 'color_orange', category: 'colors' },
  { type: 'color_yellow', category: 'colors' },
  { type: 'color_green', category: 'colors' },
  { type: 'color_cyan', category: 'colors' },
  { type: 'color_blue', category: 'colors' },
  { type: 'color_magenta', category: 'colors' },
  { type: 'color_light_gray', category: 'colors' },
  { type: 'color_gray', category: 'colors' },
  { type: 'color_dark_gray', category: 'colors' },
  { type: 'color_make_color', category: 'colors' },
  { type: 'color_split_color', category: 'colors' },

  // variables
  { type: 'global_declaration', category: 'variables' },
  { type: 'lexical_variable_get', category: 'variables' },
  { type: 'lexical_variable_set', category: 'variables' },
  { type: 'local_declaration_statement', category: 'variables' },
  { type: 'local_declaration_expression', category: 'variables' },

  // procedures
  { type: 'procedures_defnoreturn', category: 'procedures' },
  { type: 'procedures_defreturn', category: 'procedures' },
  { type: 'procedures_callnoreturn', category: 'procedures' },
  { type: 'procedures_callreturn', category: 'procedures' },

  // controls
  { type: 'controls_if', category: 'controls' },
  { type: 'controls_forRange', category: 'controls' },
  { type: 'controls_forEach', category: 'controls' },
  { type: 'controls_while', category: 'controls' },
  { type: 'controls_do_then_return', category: 'controls' },
  { type: 'controls_eval_but_ignore', category: 'controls' },
  { type: 'controls_choose', category: 'controls' },
  { type: 'controls_open_another_screen', category: 'controls' },
  { type: 'controls_open_another_screen_with_start_value', category: 'controls' },
  { type: 'controls_get_start_value', category: 'controls' },
  { type: 'controls_close_screen', category: 'controls' },
  { type: 'controls_close_screen_with_value', category: 'controls' },
  { type: 'controls_close_application', category: 'controls' },
  { type: 'controls_get_plain_start_text', category: 'controls' },
  { type: 'controls_close_screen_with_plain_text', category: 'controls' },

  // dicts
  { type: 'dicts_create_with', category: 'dicts' },
  { type: 'dictionaries_lookup', category: 'dicts' },
  { type: 'dictionaries_set_pair', category: 'dicts' },
  { type: 'dictionaries_delete_pair', category: 'dicts' },
  { type: 'dictionaries_recursive_lookup', category: 'dicts' },
  { type: 'dictionaries_recursive_set', category: 'dicts' },
  { type: 'dictionaries_getters', category: 'dicts' },
  { type: 'dictionaries_is_key_in', category: 'dicts' },
  { type: 'dictionaries_length', category: 'dicts' },
  { type: 'dictionaries_is_dict', category: 'dicts' },
  { type: 'dictionaries_copy', category: 'dicts' },
  { type: 'dictionaries_combine_dicts', category: 'dicts' },
  { type: 'dictionaries_items_not_there', category: 'dicts' },
  { type: 'dictionaries_walk_tree', category: 'dicts' },
  { type: 'dictionaries_walk_all', category: 'dicts' },
  { type: 'dictionaries_pair', category: 'dicts' },
  { type: 'dictionaries_list_of_pairs', category: 'dicts' },
  { type: 'dictionaries_keys_not_found', category: 'dicts' },
]

export function defaultBlockRegistry(): BlockRegistry {
  return createBlockRegistry(DEFAULT_BUILTINS)
}
