import { z } from "zod";

/**
 * Type definition for RawComponent (defined before schema for recursive reference)
 */
export type RawComponent = {
  $Name: string;
  $Type: string;
  $Version?: number;
  Uuid?: string;
  $Components?: RawComponent[];
} & {
  // Allow any additional properties
  [key: string]: unknown;
};

/**
 * Zod schema for RawComponent
 */
export const RawComponentSchema: z.ZodType<RawComponent> = z.lazy(() =>
  z.object({
    $Name: z.string(),
    $Type: z.string(),
    $Version: z.coerce.number().optional(),
    Uuid: z.string().optional(),
    $Components: z.array(RawComponentSchema).optional(),
  }).catchall(z.any()) // Allow any additional properties
);

/**
 * Zod schema for ScmJson
 */
export const ScmJsonSchema = z.object({
  authURL: z.array(z.string()).optional(),
  YaVersion: z.coerce.number(),
  Source: z.string(),
  Properties: RawComponentSchema,
});

/**
 * Type inferred from the Zod schema for ScmJson
 */
export type ScmJson = z.infer<typeof ScmJsonSchema>;
