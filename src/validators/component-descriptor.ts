import { z } from "zod";

/**
 * Zod schema for ComponentDescriptorParam
 */
export const ComponentDescriptorParamSchema = z.object({
  name: z.string(),
  type: z.string(),
});

/**
 * Zod schema for ComponentDescriptorProperty
 */
export const ComponentDescriptorPropertySchema = z.object({
  name: z.string(),
  editorType: z.string(),
  defaultValue: z.string(),
  /** 
   * Kodular Creator specific extension - not present in MIT App Inventor.
   * Typically has values like "common", "advanced", etc.
   */
  propertyType: z.string().optional(),
  editorArgs: z.array(z.any()),
});

/**
 * Zod schema for ComponentDescriptorBlockProperty
 */
export const ComponentDescriptorBlockPropertySchema = z.object({
  name: z.string(),
  description: z.string(),
  type: z.string(),
  rw: z.string(),
  deprecated: z.stringbool(),
});

/**
 * Zod schema for ComponentDescriptorEvent
 */
export const ComponentDescriptorEventSchema = z.object({
  name: z.string(),
  description: z.string(),
  deprecated: z.stringbool(),
  params: z.array(ComponentDescriptorParamSchema),
});

/**
 * Zod schema for ComponentDescriptorMethod
 */
export const ComponentDescriptorMethodSchema = z.object({
  name: z.string(),
  description: z.string(),
  deprecated: z.stringbool(),
  params: z.array(ComponentDescriptorParamSchema),
  returnType: z.string().optional(),
});

/**
 * Zod schema for ComponentDescriptor
 */
export const ComponentDescriptorSchema = z.object({
  type: z.string(),
  name: z.string(),
  external: z.stringbool(),
  version: z.string(),
  dateBuilt: z.string(),
  categoryString: z.string(),
  helpString: z.string(),
  helpUrl: z.string(),
  showOnPalette: z.stringbool(),
  nonVisible: z.stringbool(),
  iconName: z.string(),
  androidMinSdk: z.coerce.number(),
  properties: z.array(ComponentDescriptorPropertySchema),
  blockProperties: z.array(ComponentDescriptorBlockPropertySchema),
  events: z.array(ComponentDescriptorEventSchema),
  methods: z.array(ComponentDescriptorMethodSchema),
});

export const ComponentDescriptorsSchema = z.array(ComponentDescriptorSchema);

/**
 * Type inferred from the Zod schema for ComponentDescriptor
 */
export type ComponentDescriptor = z.infer<typeof ComponentDescriptorSchema>;

/**
 * Type inferred from the Zod schema for ComponentDescriptors
 */
export type ComponentDescriptors = z.infer<typeof ComponentDescriptorsSchema>;
