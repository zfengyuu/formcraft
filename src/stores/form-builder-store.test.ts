import { describe, expect, test } from "vitest";
import { createFieldFromType } from "@/lib/field-definitions";
import { createFormBuilderStore } from "@/stores/form-builder-store";

describe("form builder store", () => {
  test("creates, updates, duplicates, exports, imports, and deletes Pro layout forms", () => {
    const store = createFormBuilderStore();
    const form = store.getState().createForm({ title: "Contact", description: "Leads" });

    store.getState().updateForm(form.id, { title: "Contact Us" });
    const section = store.getState().addSection(form.id, { title: "Personal Information" });
    const row = store.getState().addRow(form.id, section.id, "two-equal");
    const field = store.getState().addFieldToColumn(form.id, section.id, row.id, row.columns[0]!.id, "email");
    store.getState().updateField(form.id, field.id, { label: "Work email", name: "workEmail" });

    const duplicate = store.getState().duplicateForm(form.id);
    const exported = store.getState().exportForm(form.id);
    const imported = store.getState().importForm(exported);

    expect(store.getState().forms).toHaveLength(3);
    expect(store.getState().forms.find((item) => item.id === form.id)?.title).toBe("Contact Us");
    expect(duplicate.title).toBe("Contact Us Copy");
    expect(duplicate.layout.sections[0]?.id).not.toBe(section.id);
    expect(imported.title).toBe("Contact Us");
    expect(imported.id).not.toBe(form.id);

    store.getState().deleteForm(form.id);

    expect(store.getState().forms.map((item) => item.id)).not.toContain(form.id);
  });

  test("manages sections rows columns fields and selected elements", () => {
    const store = createFormBuilderStore();
    const form = store.getState().createForm({ title: "Registration" });
    const section = store.getState().addSection(form.id, { title: "Profile" });
    const row = store.getState().addRow(form.id, section.id, "two-equal");
    const firstName = store.getState().addFieldToColumn(form.id, section.id, row.id, row.columns[0]!.id, "text");
    const email = store.getState().addFieldToColumn(form.id, section.id, row.id, row.columns[1]!.id, "email");

    store.getState().selectElement({ type: "field", id: email.id });
    store.getState().duplicateField(form.id, firstName.id);
    store.getState().moveFieldToColumn(form.id, email.id, row.columns[0]!.id, 0);
    store.getState().resizeColumns(form.id, row.id, [35, 65]);
    store.getState().deleteField(form.id, firstName.id);

    const nextForm = store.getState().forms.find((item) => item.id === form.id)!;
    const nextRow = nextForm.layout.sections[0]!.rows[0]!;
    const firstColumnFields = nextRow.columns[0]!.fields;

    expect(store.getState().selectedElement).toEqual({ type: "field", id: email.id });
    expect(nextRow.columns.map((column) => column.width)).toEqual([35, 65]);
    expect(firstColumnFields.map((field) => field.type)).toEqual(["email", "text"]);
    expect(firstColumnFields.every((field) => field.id !== firstName.id)).toBe(true);
  });

  test("moves concrete fields between columns without losing field data", () => {
    const store = createFormBuilderStore();
    const form = store.getState().createForm({ title: "Move" });
    const section = store.getState().addSection(form.id);
    const row = store.getState().addRow(form.id, section.id, "two-equal");
    const field = createFieldFromType("phone", []);
    field.label = "Mobile phone";

    const added = store.getState().addFieldToColumn(form.id, section.id, row.id, row.columns[0]!.id, field);
    store.getState().moveFieldToColumn(form.id, added.id, row.columns[1]!.id, 0);

    const nextRow = store.getState().forms[0]!.layout.sections[0]!.rows[0]!;
    expect(nextRow.columns[0]!.fields).toHaveLength(0);
    expect(nextRow.columns[1]!.fields[0]).toMatchObject({ id: added.id, label: "Mobile phone", type: "phone" });
  });
});
