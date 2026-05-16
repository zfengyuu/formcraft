import { describe, expect, test } from "vitest";
import { createFieldFromType, fieldDefinitions, fieldTypes } from "@/lib/field-definitions";

describe("field definitions", () => {
  test("defines every MVP field type with defaults and settings", () => {
    expect(fieldTypes).toEqual([
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

    for (const type of fieldTypes) {
      const definition = fieldDefinitions[type];
      expect(definition.type).toBe(type);
      expect(definition.label.length).toBeGreaterThan(0);
      expect(definition.defaultField.label?.length).toBeGreaterThan(0);
      expect(definition.settings.map((setting) => setting.key)).toContain("label");
      expect(definition.settings.map((setting) => setting.key)).toContain("name");
      expect(definition.settings.map((setting) => setting.key)).toContain("width");
    }
  });

  test("creates unique default fields from field definitions", () => {
    const existing = [
      createFieldFromType("text", []),
      createFieldFromType("email", []),
    ];

    const field = createFieldFromType("email", existing);

    expect(field.type).toBe("email");
    expect(field.id).toMatch(/^field_/);
    expect(field.name).toBe("emailAddress2");
    expect(field.required).toBe(true);
    expect(field.settings?.width).toBe("full");
  });
});
