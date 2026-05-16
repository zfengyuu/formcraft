import { describe, expect, test } from "vitest";
import { migrateFormSchema } from "@/lib/migrate-form-schema";

describe("migrateFormSchema", () => {
  test("returns Pro schemas unchanged", () => {
    const form = {
      id: "form",
      title: "Already Pro",
      layout: { sections: [] },
      settings: {},
      createdAt: "2026-05-15T00:00:00.000Z",
      updatedAt: "2026-05-15T00:00:00.000Z",
    };

    expect(migrateFormSchema(form)).toEqual(form);
  });

  test("converts legacy flat fields into one section row and column", () => {
    const form = migrateFormSchema({
      id: "form_legacy",
      title: "Legacy",
      createdAt: "2026-05-15T00:00:00.000Z",
      updatedAt: "2026-05-15T00:00:00.000Z",
      fields: [
        { id: "section_legacy", type: "section", label: "Intro", name: "intro", width: "full" },
        { id: "field_email", type: "email", label: "Email", name: "email", width: "half" },
      ],
    });

    const fields = form.layout.sections[0]?.rows[0]?.columns[0]?.fields ?? [];
    expect(form.settings.submitButtonText).toBe("Submit");
    expect(fields.map((field) => field.type)).toEqual(["sectionTitle", "email"]);
    expect(fields[1]?.settings?.width).toBe("half");
  });
});
