import { describe, expect, test } from "vitest";
import { generateZodSchema } from "@/lib/generate-zod-schema";
import type { FormSchema } from "@/types/form";

describe("generateZodSchema", () => {
  test("validates required, email, text length, regex, and number bounds", () => {
    const form: FormSchema = {
      id: "form_contact",
      title: "Contact",
      layout: {
        sections: [
          {
            id: "section_1",
            type: "section",
            title: "Profile",
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
                        label: "Full name",
                        name: "fullName",
                        required: true,
                        validation: { minLength: 3, maxLength: 20, pattern: "^[A-Za-z ]+$", message: "Use letters only" },
                      },
                      {
                        id: "field_email",
                        type: "email",
                        label: "Email",
                        name: "email",
                        required: true,
                      },
                      {
                        id: "field_age",
                        type: "number",
                        label: "Age",
                        name: "age",
                        required: true,
                        validation: { min: 18, max: 80 },
                      },
                    ],
                  },
                ],
              },
            ],
          },
        ],
      },
      settings: {},
      createdAt: "2026-05-15T00:00:00.000Z",
      updatedAt: "2026-05-15T00:00:00.000Z",
    };

    const schema = generateZodSchema(form);

    expect(
      schema.safeParse({
        fullName: "Ada Lovelace",
        email: "ada@example.com",
        age: "37",
      }).success,
    ).toBe(true);

    const result = schema.safeParse({
      fullName: "A1",
      email: "not-email",
      age: "12",
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      const paths = result.error.issues.map((issue) => issue.path.join("."));
      expect(paths).toEqual(expect.arrayContaining(["fullName", "email", "age"]));
    }
  });

  test("ignores non-input fields and optional empty values", () => {
    const schema = generateZodSchema({
      id: "form_optional",
      title: "Optional",
      layout: {
        sections: [
          {
            id: "section",
            type: "section",
            rows: [
              {
                id: "row",
                type: "row",
                columns: [
                  {
                    id: "column",
                    type: "column",
                    width: 100,
                    fields: [
                      { id: "sectionTitle", type: "sectionTitle", label: "Profile", name: "profile" },
                      { id: "divider", type: "divider", label: "Divider", name: "divider" },
                      { id: "phone", type: "phone", label: "Phone", name: "phone" },
                      { id: "score", type: "number", label: "Score", name: "score", validation: { min: 1 } },
                    ],
                  },
                ],
              },
            ],
          },
        ],
      },
      settings: {},
      createdAt: "2026-05-15T00:00:00.000Z",
      updatedAt: "2026-05-15T00:00:00.000Z",
    });

    const result = schema.safeParse({ phone: "", score: "" });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toEqual({ phone: undefined, score: undefined });
    }
  });
});
