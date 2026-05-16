import { describe, expect, test } from "vitest";
import { parseImportedFormSchema, serializeFormSchema } from "@/lib/import-export";
import type { FormSchema } from "@/types/form";

describe("import/export schema helpers", () => {
  test("round-trips a valid FormSchema JSON payload", () => {
    const form: FormSchema = {
      id: "form_contact",
      title: "Contact Form",
      description: "Simple customer contact form",
      layout: {
        sections: [
          {
            id: "section_1",
            type: "section",
            title: "Main",
            rows: [
              {
                id: "row_1",
                type: "row",
                columns: [
                  {
                    id: "column_1",
                    type: "column",
                    width: 100,
                    fields: [
                      {
                        id: "field_name",
                        type: "text",
                        label: "Full Name",
                        name: "fullName",
                        placeholder: "Enter your name",
                        required: true,
                        settings: { width: "full" },
                      },
                    ],
                  },
                ],
              },
            ],
          },
        ],
      },
      settings: { submitButtonText: "Send" },
      createdAt: "2026-05-15T00:00:00.000Z",
      updatedAt: "2026-05-15T00:00:00.000Z",
    };

    const json = serializeFormSchema(form);
    const parsed = parseImportedFormSchema(json);

    expect(JSON.parse(json)).toEqual(form);
    expect(parsed).toEqual(form);
  });

  test("rejects malformed import payloads", () => {
    expect(() =>
      parseImportedFormSchema({
        id: "form_bad",
        title: "Bad",
        fields: [{ id: "field_bad", type: "unknown", label: "Bad", name: "bad" }],
      }),
    ).toThrow(/Invalid form schema/);
  });

  test("imports legacy flat schema by migrating it into one section row and column", () => {
    const parsed = parseImportedFormSchema({
      id: "form_legacy",
      title: "Legacy",
      createdAt: "2026-05-15T00:00:00.000Z",
      updatedAt: "2026-05-15T00:00:00.000Z",
      fields: [
        { id: "section_old", type: "section", label: "Old Section", name: "oldSection" },
        { id: "field_email", type: "email", label: "Email", name: "email", required: true, width: "half" },
      ],
    });

    expect(parsed.layout.sections).toHaveLength(1);
    expect(parsed.layout.sections[0]?.rows[0]?.columns[0]?.fields.map((field) => field.type)).toEqual(["sectionTitle", "email"]);
    expect(parsed.layout.sections[0]?.rows[0]?.columns[0]?.fields[1]?.settings?.width).toBe("half");
  });
});
