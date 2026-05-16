import { createId } from "@/lib/utils";
import type { FieldType, FormField, FormSchema, LegacyFormField, LegacyFormSchema } from "@/types/form";

const fieldTypeSet = new Set<FieldType>([
  "text",
  "textarea",
  "email",
  "number",
  "phone",
  "password",
  "select",
  "radio",
  "checkbox",
  "date",
  "switch",
  "file",
  "sectionTitle",
  "divider",
]);

function isRecord(input: unknown): input is Record<string, unknown> {
  return Boolean(input) && typeof input === "object" && !Array.isArray(input);
}

export function isProFormSchema(input: unknown): input is FormSchema {
  return isRecord(input) && isRecord(input.layout) && Array.isArray(input.layout.sections);
}

function migrateField(field: LegacyFormField): FormField {
  const type = field.type === "section" ? "sectionTitle" : field.type;
  if (!fieldTypeSet.has(type)) {
    throw new Error(`Invalid form schema: unsupported field type ${String(field.type)}`);
  }

  const { width, ...rest } = field;
  return {
    ...rest,
    type,
    visible: field.visible ?? true,
    required: field.required ?? false,
    disabled: field.disabled ?? false,
    options: field.options?.map((option) => ({ ...option })),
    validation: field.validation ? { ...field.validation } : undefined,
    settings: {
      ...(field.settings ?? {}),
      width: field.settings?.width ?? width ?? "full",
    },
  };
}

export function migrateFormSchema(input: unknown): FormSchema {
  if (!isRecord(input)) {
    throw new Error("Invalid form schema: expected object");
  }

  if (isProFormSchema(input)) {
    return input;
  }

  const legacy = input as Partial<LegacyFormSchema>;
  if (!Array.isArray(legacy.fields)) {
    throw new Error("Invalid form schema: expected layout or fields");
  }

  const timestamp = new Date().toISOString();
  const migratedFields = legacy.fields.map((field) => migrateField(field));

  return {
    id: legacy.id || createId("form"),
    title: legacy.title || "Imported form",
    description: legacy.description,
    layout: {
      sections: [
        {
          id: createId("section"),
          type: "section",
          title: legacy.title || "Imported section",
          description: legacy.description,
          rows: [
            {
              id: createId("row"),
              type: "row",
              columns: [
                {
                  id: createId("column"),
                  type: "column",
                  width: 100,
                  fields: migratedFields,
                  settings: { align: "stretch", padding: "none" },
                },
              ],
              settings: { gap: "md", align: "stretch", stackOnMobile: true },
            },
          ],
          settings: { showTitle: true, variant: "plain", padding: "md" },
        },
      ],
    },
    settings: {
      submitButtonText: "Submit",
      maxWidth: "standard",
      spacing: "comfortable",
      theme: "light",
    },
    createdAt: legacy.createdAt || timestamp,
    updatedAt: legacy.updatedAt || timestamp,
  };
}
