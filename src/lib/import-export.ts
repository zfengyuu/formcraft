import { z } from "zod";
import { migrateFormSchema } from "@/lib/migrate-form-schema";
import type { FormSchema } from "@/types/form";
import { fieldTypes } from "@/types/form";

const fieldTypeSchema = z.enum(fieldTypes);

const fieldOptionSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
  value: z.string().min(1),
});

const fieldValidationSchema = z
  .object({
    minLength: z.number().optional(),
    maxLength: z.number().optional(),
    pattern: z.string().optional(),
    min: z.number().optional(),
    max: z.number().optional(),
    step: z.number().optional(),
    minDate: z.string().optional(),
    maxDate: z.string().optional(),
    acceptedFileTypes: z.array(z.string()).optional(),
    maxFileSizeMb: z.number().optional(),
    message: z.string().optional(),
  })
  .partial();

const formFieldSchema = z.object({
  id: z.string().min(1),
  type: fieldTypeSchema,
  label: z.string().min(1),
  name: z.string().min(1),
  placeholder: z.string().optional(),
  description: z.string().optional(),
  required: z.boolean().optional(),
  disabled: z.boolean().optional(),
  defaultValue: z.unknown().optional(),
  visible: z.boolean().optional(),
  validation: fieldValidationSchema.optional(),
  options: z.array(fieldOptionSchema).optional(),
  settings: z.record(z.string(), z.unknown()).optional(),
});

const columnSchema = z.object({
  id: z.string().min(1),
  type: z.literal("column"),
  width: z.number().min(0).max(100),
  fields: z.array(formFieldSchema),
  settings: z.record(z.string(), z.unknown()).optional(),
});

const rowSchema = z.object({
  id: z.string().min(1),
  type: z.literal("row"),
  columns: z.array(columnSchema).min(1),
  settings: z.record(z.string(), z.unknown()).optional(),
});

const sectionSchema = z.object({
  id: z.string().min(1),
  type: z.literal("section"),
  title: z.string().min(1),
  description: z.string().optional(),
  rows: z.array(rowSchema),
  settings: z.record(z.string(), z.unknown()).optional(),
});

const proFormSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  description: z.string().optional(),
  layout: z.object({
    sections: z.array(sectionSchema),
  }),
  settings: z.record(z.string(), z.unknown()).default({}),
  createdAt: z.string().min(1),
  updatedAt: z.string().min(1),
});

function assertColumnWidths(form: FormSchema) {
  for (const section of form.layout.sections) {
    for (const row of section.rows) {
      const total = Number(row.columns.reduce((sum, column) => sum + column.width, 0).toFixed(2));
      if (row.columns.length > 0 && total !== 100) {
        throw new Error("Invalid form schema: column widths must sum to 100");
      }
    }
  }
}

export function parseImportedFormSchema(input: unknown): FormSchema {
  const payload = typeof input === "string" ? JSON.parse(input) : input;

  try {
    const migrated = migrateFormSchema(payload);
    const result = proFormSchema.safeParse(migrated);

    if (!result.success) {
      throw new Error(result.error.issues[0]?.message ?? "unknown error");
    }

    const form = result.data as FormSchema;
    assertColumnWidths(form);
    return form;
  } catch (error) {
    if (error instanceof Error && error.message.startsWith("Invalid form schema")) {
      throw error;
    }

    throw new Error(`Invalid form schema: ${error instanceof Error ? error.message : "unknown error"}`);
  }
}

export function serializeFormSchema(form: FormSchema) {
  return JSON.stringify(form, null, 2);
}
