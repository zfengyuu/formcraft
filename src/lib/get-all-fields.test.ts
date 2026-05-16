import { describe, expect, test } from "vitest";
import { getAllFields } from "@/lib/get-all-fields";
import type { FormSchema } from "@/types/form";

describe("getAllFields", () => {
  test("flattens nested layout fields in render order", () => {
    const form: FormSchema = {
      id: "form",
      title: "Nested",
      layout: {
        sections: [
          {
            id: "section_1",
            type: "section",
            rows: [
              {
                id: "row_1",
                type: "row",
                columns: [
                  {
                    id: "column_1",
                    type: "column",
                    width: 50,
                    fields: [{ id: "first", type: "text", label: "First", name: "first" }],
                  },
                  {
                    id: "column_2",
                    type: "column",
                    width: 50,
                    fields: [{ id: "second", type: "email", label: "Second", name: "second" }],
                  },
                ],
              },
            ],
          },
          {
            id: "section_2",
            type: "section",
            rows: [
              {
                id: "row_2",
                type: "row",
                columns: [
                  {
                    id: "column_3",
                    type: "column",
                    width: 100,
                    fields: [{ id: "third", type: "textarea", label: "Third", name: "third" }],
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

    expect(getAllFields(form).map((field) => field.id)).toEqual(["first", "second", "third"]);
  });
});
