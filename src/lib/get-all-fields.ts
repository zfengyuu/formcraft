import type { FormField, FormSchema } from "@/types/form";

export function getAllFields(form: FormSchema | null | undefined): FormField[] {
  if (!form) {
    return [];
  }

  return form.layout.sections.flatMap((section) =>
    section.rows.flatMap((row) => row.columns.flatMap((column) => column.fields)),
  );
}
