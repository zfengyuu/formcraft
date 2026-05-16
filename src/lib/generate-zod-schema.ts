import { z } from "zod";
import { isInputField } from "@/lib/field-definitions";
import { getAllFields } from "@/lib/get-all-fields";
import type { FormField, FormSchema } from "@/types/form";

function emptyToUndefined(value: unknown) {
  return value === "" || value === null ? undefined : value;
}

function textSchema(field: FormField) {
  const message = field.validation?.message;
  const pattern = field.validation?.pattern ? new RegExp(field.validation.pattern) : null;

  return z
    .preprocess(emptyToUndefined, z.union([z.string(), z.undefined()]))
    .refine((value) => !field.required || typeof value === "string", message ?? "This field is required")
    .refine(
      (value) => value === undefined || field.validation?.minLength === undefined || value.length >= field.validation.minLength,
      message ?? `Minimum ${field.validation?.minLength ?? 0} characters`,
    )
    .refine(
      (value) => value === undefined || field.validation?.maxLength === undefined || value.length <= field.validation.maxLength,
      message ?? `Maximum ${field.validation?.maxLength ?? 0} characters`,
    )
    .refine((value) => value === undefined || pattern === null || pattern.test(value), message ?? "Invalid format");
}

function numberSchema(field: FormField) {
  const message = field.validation?.message;

  return z
    .preprocess(emptyToUndefined, z.union([z.coerce.number({ error: message ?? "Enter a valid number" }), z.undefined()]))
    .refine((value) => !field.required || typeof value === "number", message ?? "This field is required")
    .refine(
      (value) => value === undefined || field.validation?.min === undefined || value >= field.validation.min,
      message ?? `Minimum value is ${field.validation?.min ?? 0}`,
    )
    .refine(
      (value) => value === undefined || field.validation?.max === undefined || value <= field.validation.max,
      message ?? `Maximum value is ${field.validation?.max ?? 0}`,
    );
}

function fieldSchema(field: FormField) {
  switch (field.type) {
    case "email": {
      const message = field.validation?.message;
      return z
        .preprocess(emptyToUndefined, z.union([z.string(), z.undefined()]))
        .refine((value) => !field.required || typeof value === "string", message ?? "This field is required")
        .refine(
          (value) => value === undefined || z.email().safeParse(value).success,
          message ?? "Invalid email address",
        );
    }
    case "number":
      return numberSchema(field);
    case "checkbox":
    case "switch":
      return field.required ? z.boolean().refine(Boolean, field.validation?.message ?? "This field is required") : z.boolean().optional();
    case "select":
    case "radio":
    case "date":
    case "password":
    case "phone":
    case "textarea":
    case "text":
      return textSchema(field);
    case "file":
      return z.unknown().optional();
    case "sectionTitle":
    case "divider":
      return z.never().optional();
    default:
      return z.unknown().optional();
  }
}

export function generateZodSchema(input: FormSchema | FormField[]) {
  const fields = Array.isArray(input) ? input : getAllFields(input);
  const shape: Record<string, z.ZodType> = {};

  for (const field of fields) {
    if (isInputField(field)) {
      shape[field.name] = fieldSchema(field);
    }
  }

  return z.object(shape);
}
