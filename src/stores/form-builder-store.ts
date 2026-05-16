"use client";

import { create } from "zustand";
import type { StateCreator } from "zustand";
import { createStore } from "zustand/vanilla";
import { createJSONStorage, persist } from "zustand/middleware";
import { createFieldFromType } from "@/lib/field-definitions";
import { getAllFields } from "@/lib/get-all-fields";
import { createColumnsFromWidths, createRowFromPreset, getLayoutPreset, resizeColumns as resizeWidthPair } from "@/lib/layout-presets";
import { migrateFormSchema } from "@/lib/migrate-form-schema";
import { createTemplateForm, type FormTemplateId } from "@/lib/templates";
import { parseImportedFormSchema, serializeFormSchema } from "@/lib/import-export";
import { createId, uniqueFieldName } from "@/lib/utils";
import type {
  FieldType,
  FieldWidth,
  FormColumn,
  FormColumnSettings,
  FormField,
  FormRow,
  FormRowSettings,
  FormSchema,
  FormSection,
  FormSectionSettings,
  LayoutPresetId,
  SelectedElement,
} from "@/types/form";

const PRO_STORAGE_KEY = "formcraft-pro-storage";
const LEGACY_STORAGE_KEY = "formcraft-storage";

export type BuilderPreferences = {
  mobilePanel: "fields" | "canvas" | "settings" | "preview";
  leftPanel: "fields" | "layouts" | "templates" | "outline";
};

export type FormBuilderStore = {
  forms: FormSchema[];
  selectedFormId: string | null;
  selectedElement: SelectedElement | null;
  preferences: BuilderPreferences;
  createForm: (input?: { title?: string; description?: string }) => FormSchema;
  createFormFromTemplate: (templateId: FormTemplateId) => FormSchema;
  updateForm: (formId: string, updates: Partial<Pick<FormSchema, "title" | "description" | "settings">>) => void;
  deleteForm: (formId: string) => void;
  duplicateForm: (formId: string) => FormSchema;
  selectForm: (formId: string | null) => void;
  selectElement: (element: SelectedElement | null) => void;
  selectField: (fieldId: string | null) => void;
  addSection: (formId: string, input?: { title?: string; description?: string }) => FormSection;
  updateSection: (formId: string, sectionId: string, updates: Partial<Pick<FormSection, "title" | "description">> & { settings?: FormSectionSettings }) => void;
  deleteSection: (formId: string, sectionId: string) => void;
  duplicateSection: (formId: string, sectionId: string) => FormSection;
  reorderSections: (formId: string, activeSectionId: string, overSectionId: string) => void;
  addRow: (formId: string, sectionId: string, presetId: LayoutPresetId) => FormRow;
  updateRow: (formId: string, rowId: string, updates: { settings?: FormRowSettings }) => void;
  deleteRow: (formId: string, rowId: string) => void;
  duplicateRow: (formId: string, rowId: string) => FormRow;
  reorderRows: (formId: string, sectionId: string, activeRowId: string, overRowId: string) => void;
  changeRowLayout: (formId: string, rowId: string, presetId: LayoutPresetId) => void;
  updateColumn: (formId: string, columnId: string, updates: { width?: number; settings?: FormColumnSettings }) => void;
  resizeColumns: (formId: string, rowId: string, widths: number[]) => void;
  addFieldToColumn: (
    formId: string,
    sectionId: string,
    rowId: string,
    columnId: string,
    typeOrField: FieldType | FormField,
    index?: number,
  ) => FormField;
  addField: (formId: string, type: FieldType, index?: number) => FormField;
  updateField: (formId: string, fieldId: string, updates: Partial<FormField>) => void;
  deleteField: (formId: string, fieldId: string) => void;
  duplicateField: (formId: string, fieldId: string) => FormField;
  moveFieldToColumn: (formId: string, fieldId: string, targetColumnId: string, targetIndex?: number) => void;
  reorderFields: (formId: string, activeFieldId: string, overFieldId: string) => void;
  clearForm: (formId: string) => void;
  importForm: (input: unknown) => FormSchema;
  exportForm: (formId: string) => string;
  hydrateLegacyForms: () => void;
  setPreference: <K extends keyof BuilderPreferences>(key: K, value: BuilderPreferences[K]) => void;
};

function now() {
  return new Date().toISOString();
}

function touch(form: FormSchema): FormSchema {
  return { ...form, updatedAt: now() };
}

function insertAt<T>(items: T[], item: T, index = items.length) {
  const next = [...items];
  next.splice(Math.max(0, Math.min(index, next.length)), 0, item);
  return next;
}

function moveBefore<T>(items: T[], activeIndex: number, overIndex: number) {
  const next = [...items];
  const [item] = next.splice(activeIndex, 1);
  next.splice(activeIndex < overIndex ? overIndex - 1 : overIndex, 0, item);
  return next;
}

function cloneFieldData(field: FormField): FormField {
  return {
    ...field,
    validation: field.validation ? { ...field.validation } : undefined,
    options: field.options?.map((option) => ({ ...option })),
    settings: field.settings ? { ...field.settings } : undefined,
  };
}

function cloneFieldWithNewIds(field: FormField, existingFields: FormField[]): FormField {
  const baseName = `${field.name}Copy`;
  return {
    ...cloneFieldData(field),
    id: createId("field"),
    label: `${field.label} Copy`,
    name: uniqueFieldName(
      baseName,
      existingFields.map((item) => item.name),
    ),
    options: field.options?.map((option) => ({ ...option, id: createId("option") })),
  };
}

function cloneColumn(column: FormColumn): FormColumn {
  return {
    ...column,
    settings: column.settings ? { ...column.settings } : undefined,
    fields: column.fields.map(cloneFieldData),
  };
}

function cloneRow(row: FormRow): FormRow {
  return {
    ...row,
    settings: row.settings ? { ...row.settings } : undefined,
    columns: row.columns.map(cloneColumn),
  };
}

function cloneSection(section: FormSection): FormSection {
  return {
    ...section,
    settings: section.settings ? { ...section.settings } : undefined,
    rows: section.rows.map(cloneRow),
  };
}

function cloneForm(form: FormSchema): FormSchema {
  return {
    ...form,
    settings: { ...form.settings },
    layout: {
      sections: form.layout.sections.map(cloneSection),
    },
  };
}

function createEmptyForm(input?: { title?: string; description?: string }): FormSchema {
  const timestamp = now();
  return {
    id: createId("form"),
    title: input?.title?.trim() || "Untitled form",
    description: input?.description?.trim() || "A local-first form draft",
    layout: { sections: [] },
    settings: {
      submitButtonText: "Submit",
      maxWidth: "standard",
      spacing: "comfortable",
      theme: "light",
    },
    createdAt: timestamp,
    updatedAt: timestamp,
  };
}

function createSection(input?: { title?: string; description?: string }): FormSection {
  return {
    id: createId("section"),
    type: "section",
    title: input?.title?.trim() || "Untitled section",
    description: input?.description?.trim() || "",
    rows: [],
    settings: { showTitle: true, variant: "plain", padding: "md" },
  };
}

function findRow(form: FormSchema, rowId: string) {
  for (const section of form.layout.sections) {
    const rowIndex = section.rows.findIndex((row) => row.id === rowId);
    if (rowIndex >= 0) {
      return { section, row: section.rows[rowIndex]!, rowIndex };
    }
  }

  return { section: null, row: null, rowIndex: -1 };
}

function findColumn(form: FormSchema, columnId: string) {
  for (const section of form.layout.sections) {
    for (const row of section.rows) {
      const columnIndex = row.columns.findIndex((column) => column.id === columnId);
      if (columnIndex >= 0) {
        return { section, row, column: row.columns[columnIndex]!, columnIndex };
      }
    }
  }

  return { section: null, row: null, column: null, columnIndex: -1 };
}

function findFieldLocation(form: FormSchema, fieldId: string) {
  for (const section of form.layout.sections) {
    for (const row of section.rows) {
      for (const column of row.columns) {
        const fieldIndex = column.fields.findIndex((field) => field.id === fieldId);
        if (fieldIndex >= 0) {
          return { section, row, column, field: column.fields[fieldIndex]!, fieldIndex };
        }
      }
    }
  }

  return { section: null, row: null, column: null, field: null, fieldIndex: -1 };
}

function mapForm(forms: FormSchema[], formId: string, updater: (form: FormSchema) => FormSchema) {
  return forms.map((form) => (form.id === formId ? updater(form) : form));
}

function remapFieldIds(fields: FormField[], existingFields: FormField[]) {
  return fields.map((field) => cloneFieldWithNewIds(field, existingFields));
}

function cloneRowWithNewIds(row: FormRow, existingFields: FormField[]): FormRow {
  return {
    ...row,
    id: createId("row"),
    settings: row.settings ? { ...row.settings } : undefined,
    columns: row.columns.map((column) => ({
      ...column,
      id: createId("column"),
      settings: column.settings ? { ...column.settings } : undefined,
      fields: remapFieldIds(column.fields, existingFields),
    })),
  };
}

function cloneSectionWithNewIds(section: FormSection, existingFields: FormField[]): FormSection {
  return {
    ...section,
    id: createId("section"),
    title: `${section.title} Copy`,
    settings: section.settings ? { ...section.settings } : undefined,
    rows: section.rows.map((row) => cloneRowWithNewIds(row, existingFields)),
  };
}

function clampColumnWidths(widths: number[]) {
  if (widths.length === 0) {
    return [];
  }

  if (widths.length === 2) {
    return resizeWidthPair([50, 50], 0, widths[0] ?? 50);
  }

  const clamped = widths.map((width) => Math.min(80, Math.max(20, width)));
  const total = clamped.reduce((sum, width) => sum + width, 0);
  const normalized = clamped.map((width) => Number(((width / total) * 100).toFixed(2)));
  const delta = Number((100 - normalized.reduce((sum, width) => sum + width, 0)).toFixed(2));
  normalized[normalized.length - 1] = Number(((normalized.at(-1) ?? 0) + delta).toFixed(2));
  return normalized;
}

function parseLegacyStorage() {
  if (typeof localStorage === "undefined") {
    return [];
  }

  const raw = localStorage.getItem(LEGACY_STORAGE_KEY);
  if (!raw) {
    return [];
  }

  const parsed = JSON.parse(raw) as { state?: { forms?: unknown[] } };
  return (parsed.state?.forms ?? []).map((form) => migrateFormSchema(form));
}

const creator: StateCreator<FormBuilderStore> = (set, get) => ({
  forms: [],
  selectedFormId: null,
  selectedElement: null,
  preferences: {
    mobilePanel: "canvas",
    leftPanel: "fields",
  },
  createForm: (input) => {
    const form = createEmptyForm(input);
    set((state) => ({
      forms: [form, ...state.forms],
      selectedFormId: form.id,
      selectedElement: { type: "form", id: form.id },
    }));
    return form;
  },
  createFormFromTemplate: (templateId) => {
    const form = createTemplateForm(templateId);
    set((state) => ({
      forms: [form, ...state.forms],
      selectedFormId: form.id,
      selectedElement: { type: "form", id: form.id },
    }));
    return form;
  },
  updateForm: (formId, updates) =>
    set((state) => ({
      forms: mapForm(state.forms, formId, (form) =>
        touch({
          ...form,
          ...updates,
          settings: updates.settings ? { ...form.settings, ...updates.settings } : form.settings,
        }),
      ),
    })),
  deleteForm: (formId) =>
    set((state) => {
      const forms = state.forms.filter((form) => form.id !== formId);
      const selectedFormId = state.selectedFormId === formId ? (forms[0]?.id ?? null) : state.selectedFormId;
      return {
        forms,
        selectedFormId,
        selectedElement: selectedFormId ? { type: "form", id: selectedFormId } : null,
      };
    }),
  duplicateForm: (formId) => {
    const source = get().forms.find((form) => form.id === formId);
    if (!source) {
      throw new Error("Form not found");
    }

    const timestamp = now();
    const duplicate: FormSchema = {
      ...cloneForm(source),
      id: createId("form"),
      title: `${source.title} Copy`,
      createdAt: timestamp,
      updatedAt: timestamp,
      layout: {
        sections: source.layout.sections.map((section) => cloneSectionWithNewIds(section, getAllFields(source))),
      },
    };

    set((state) => ({
      forms: [duplicate, ...state.forms],
      selectedFormId: duplicate.id,
      selectedElement: { type: "form", id: duplicate.id },
    }));
    return duplicate;
  },
  selectForm: (formId) => set({ selectedFormId: formId, selectedElement: formId ? { type: "form", id: formId } : null }),
  selectElement: (element) => set({ selectedElement: element }),
  selectField: (fieldId) => set({ selectedElement: fieldId ? { type: "field", id: fieldId } : null }),
  addSection: (formId, input) => {
    const section = createSection(input);
    set((state) => ({
      forms: mapForm(state.forms, formId, (form) => touch({ ...form, layout: { sections: [...form.layout.sections, section] } })),
      selectedFormId: formId,
      selectedElement: { type: "section", id: section.id },
    }));
    return section;
  },
  updateSection: (formId, sectionId, updates) =>
    set((state) => ({
      forms: mapForm(state.forms, formId, (form) =>
        touch({
          ...form,
          layout: {
            sections: form.layout.sections.map((section) =>
              section.id === sectionId
                ? { ...section, ...updates, settings: updates.settings ? { ...section.settings, ...updates.settings } : section.settings }
                : section,
            ),
          },
        }),
      ),
    })),
  deleteSection: (formId, sectionId) =>
    set((state) => ({
      forms: mapForm(state.forms, formId, (form) =>
        touch({ ...form, layout: { sections: form.layout.sections.filter((section) => section.id !== sectionId) } }),
      ),
      selectedElement: state.selectedElement?.id === sectionId ? { type: "form", id: formId } : state.selectedElement,
    })),
  duplicateSection: (formId, sectionId) => {
    const form = get().forms.find((item) => item.id === formId);
    const source = form?.layout.sections.find((section) => section.id === sectionId);
    if (!form || !source) {
      throw new Error("Section not found");
    }

    const duplicate = cloneSectionWithNewIds(source, getAllFields(form));
    const index = form.layout.sections.findIndex((section) => section.id === sectionId) + 1;
    set((state) => ({
      forms: mapForm(state.forms, formId, (item) =>
        touch({ ...item, layout: { sections: insertAt(item.layout.sections, duplicate, index) } }),
      ),
      selectedElement: { type: "section", id: duplicate.id },
    }));
    return duplicate;
  },
  reorderSections: (formId, activeSectionId, overSectionId) =>
    set((state) => ({
      forms: mapForm(state.forms, formId, (form) => {
        const activeIndex = form.layout.sections.findIndex((section) => section.id === activeSectionId);
        const overIndex = form.layout.sections.findIndex((section) => section.id === overSectionId);
        if (activeIndex < 0 || overIndex < 0 || activeIndex === overIndex) {
          return form;
        }
        return touch({ ...form, layout: { sections: moveBefore(form.layout.sections, activeIndex, overIndex) } });
      }),
    })),
  addRow: (formId, sectionId, presetId) => {
    const row = createRowFromPreset(presetId);
    set((state) => ({
      forms: mapForm(state.forms, formId, (form) =>
        touch({
          ...form,
          layout: {
            sections: form.layout.sections.map((section) => (section.id === sectionId ? { ...section, rows: [...section.rows, row] } : section)),
          },
        }),
      ),
      selectedElement: { type: "row", id: row.id },
    }));
    return row;
  },
  updateRow: (formId, rowId, updates) =>
    set((state) => ({
      forms: mapForm(state.forms, formId, (form) => {
        const next = cloneForm(form);
        const { row } = findRow(next, rowId);
        if (!row) {
          return form;
        }
        row.settings = updates.settings ? { ...row.settings, ...updates.settings } : row.settings;
        return touch(next);
      }),
    })),
  deleteRow: (formId, rowId) =>
    set((state) => ({
      forms: mapForm(state.forms, formId, (form) =>
        touch({
          ...form,
          layout: {
            sections: form.layout.sections.map((section) => ({
              ...section,
              rows: section.rows.filter((row) => row.id !== rowId),
            })),
          },
        }),
      ),
      selectedElement: state.selectedElement?.id === rowId ? { type: "form", id: formId } : state.selectedElement,
    })),
  duplicateRow: (formId, rowId) => {
    const form = get().forms.find((item) => item.id === formId);
    if (!form) {
      throw new Error("Form not found");
    }

    const { section, row, rowIndex } = findRow(form, rowId);
    if (!section || !row) {
      throw new Error("Row not found");
    }

    const duplicate = cloneRowWithNewIds(row, getAllFields(form));
    set((state) => ({
      forms: mapForm(state.forms, formId, (item) =>
        touch({
          ...item,
          layout: {
            sections: item.layout.sections.map((currentSection) =>
              currentSection.id === section.id
                ? { ...currentSection, rows: insertAt(currentSection.rows, duplicate, rowIndex + 1) }
                : currentSection,
            ),
          },
        }),
      ),
      selectedElement: { type: "row", id: duplicate.id },
    }));
    return duplicate;
  },
  reorderRows: (formId, sectionId, activeRowId, overRowId) =>
    set((state) => ({
      forms: mapForm(state.forms, formId, (form) =>
        touch({
          ...form,
          layout: {
            sections: form.layout.sections.map((section) => {
              if (section.id !== sectionId) {
                return section;
              }
              const activeIndex = section.rows.findIndex((row) => row.id === activeRowId);
              const overIndex = section.rows.findIndex((row) => row.id === overRowId);
              if (activeIndex < 0 || overIndex < 0 || activeIndex === overIndex) {
                return section;
              }
              return { ...section, rows: moveBefore(section.rows, activeIndex, overIndex) };
            }),
          },
        }),
      ),
    })),
  changeRowLayout: (formId, rowId, presetId) =>
    set((state) => ({
      forms: mapForm(state.forms, formId, (form) => {
        const next = cloneForm(form);
        const { row } = findRow(next, rowId);
        if (!row) {
          return form;
        }
        row.columns = createColumnsFromWidths(getLayoutPreset(presetId).widths, row.columns);
        return touch(next);
      }),
    })),
  updateColumn: (formId, columnId, updates) =>
    set((state) => ({
      forms: mapForm(state.forms, formId, (form) => {
        const next = cloneForm(form);
        const { column } = findColumn(next, columnId);
        if (!column) {
          return form;
        }
        if (updates.width !== undefined) {
          column.width = updates.width;
        }
        column.settings = updates.settings ? { ...column.settings, ...updates.settings } : column.settings;
        return touch(next);
      }),
    })),
  resizeColumns: (formId, rowId, widths) =>
    set((state) => ({
      forms: mapForm(state.forms, formId, (form) => {
        const next = cloneForm(form);
        const { row } = findRow(next, rowId);
        if (!row || widths.length !== row.columns.length) {
          return form;
        }
        const nextWidths = clampColumnWidths(widths);
        row.columns = row.columns.map((column, index) => ({ ...column, width: nextWidths[index] ?? column.width }));
        return touch(next);
      }),
    })),
  addFieldToColumn: (formId, _sectionId, _rowId, columnId, typeOrField, index) => {
    const form = get().forms.find((item) => item.id === formId);
    if (!form) {
      throw new Error("Form not found");
    }

    const field =
      typeof typeOrField === "string"
        ? createFieldFromType(typeOrField, getAllFields(form))
        : {
            ...cloneFieldData(typeOrField),
            settings: { width: "full" as FieldWidth, ...(typeOrField.settings ?? {}) },
          };

    set((state) => ({
      forms: mapForm(state.forms, formId, (item) => {
        const next = cloneForm(item);
        const { column } = findColumn(next, columnId);
        if (!column) {
          throw new Error("Column not found");
        }
        column.fields = insertAt(column.fields, field, index);
        return touch(next);
      }),
      selectedFormId: formId,
      selectedElement: { type: "field", id: field.id },
    }));
    return field;
  },
  addField: (formId, type, index) => {
    const form = get().forms.find((item) => item.id === formId);
    if (!form) {
      throw new Error("Form not found");
    }

    let targetSection = form.layout.sections[0];
    if (!targetSection) {
      targetSection = get().addSection(formId, { title: "Main" });
    }

    const freshForm = get().forms.find((item) => item.id === formId)!;
    const section = freshForm.layout.sections.find((item) => item.id === targetSection.id) ?? freshForm.layout.sections[0]!;
    let row = section.rows[0];
    if (!row) {
      row = get().addRow(formId, section.id, "one");
    }

    const column = row.columns[0];
    if (!column) {
      throw new Error("Column not found");
    }

    return get().addFieldToColumn(formId, section.id, row.id, column.id, type, index);
  },
  updateField: (formId, fieldId, updates) =>
    set((state) => ({
      forms: mapForm(state.forms, formId, (form) => {
        const next = cloneForm(form);
        const { column, fieldIndex } = findFieldLocation(next, fieldId);
        if (!column || fieldIndex < 0) {
          return form;
        }
        const current = column.fields[fieldIndex]!;
        column.fields[fieldIndex] = {
          ...current,
          ...updates,
          validation: updates.validation ? { ...current.validation, ...updates.validation } : updates.validation === null ? undefined : current.validation,
          settings: updates.settings ? { ...current.settings, ...updates.settings } : current.settings,
          options: updates.options ?? current.options,
        };
        return touch(next);
      }),
    })),
  deleteField: (formId, fieldId) =>
    set((state) => ({
      forms: mapForm(state.forms, formId, (form) => {
        const next = cloneForm(form);
        const { column } = findFieldLocation(next, fieldId);
        if (!column) {
          return form;
        }
        column.fields = column.fields.filter((field) => field.id !== fieldId);
        return touch(next);
      }),
      selectedElement: state.selectedElement?.id === fieldId ? null : state.selectedElement,
    })),
  duplicateField: (formId, fieldId) => {
    const form = get().forms.find((item) => item.id === formId);
    if (!form) {
      throw new Error("Form not found");
    }

    const { field, column, fieldIndex } = findFieldLocation(form, fieldId);
    if (!field || !column) {
      throw new Error("Field not found");
    }

    const duplicate = cloneFieldWithNewIds(field, getAllFields(form));
    set((state) => ({
      forms: mapForm(state.forms, formId, (item) => {
        const next = cloneForm(item);
        const { column: nextColumn } = findColumn(next, column.id);
        if (!nextColumn) {
          return item;
        }
        nextColumn.fields = insertAt(nextColumn.fields, duplicate, fieldIndex + 1);
        return touch(next);
      }),
      selectedElement: get().selectedElement?.id === fieldId ? { type: "field", id: duplicate.id } : get().selectedElement,
    }));
    return duplicate;
  },
  moveFieldToColumn: (formId, fieldId, targetColumnId, targetIndex = Number.MAX_SAFE_INTEGER) =>
    set((state) => ({
      forms: mapForm(state.forms, formId, (form) => {
        const next = cloneForm(form);
        const { column: sourceColumn, field, fieldIndex } = findFieldLocation(next, fieldId);
        const { column: targetColumn } = findColumn(next, targetColumnId);
        if (!sourceColumn || !targetColumn || !field || fieldIndex < 0) {
          return form;
        }

        sourceColumn.fields.splice(fieldIndex, 1);
        const insertIndex = sourceColumn.id === targetColumn.id && targetIndex > fieldIndex ? targetIndex - 1 : targetIndex;
        targetColumn.fields = insertAt(targetColumn.fields, field, insertIndex);
        return touch(next);
      }),
    })),
  reorderFields: (formId, activeFieldId, overFieldId) =>
    set((state) => ({
      forms: mapForm(state.forms, formId, (form) => {
        const next = cloneForm(form);
        const source = findFieldLocation(next, activeFieldId);
        const target = findFieldLocation(next, overFieldId);
        if (!source.column || !target.column || !source.field || source.column.id !== target.column.id || source.fieldIndex === target.fieldIndex) {
          return form;
        }
        source.column.fields = moveBefore(source.column.fields, source.fieldIndex, target.fieldIndex);
        return touch(next);
      }),
    })),
  clearForm: (formId) =>
    set((state) => ({
      forms: mapForm(state.forms, formId, (form) => touch({ ...form, layout: { sections: [] } })),
      selectedElement: { type: "form", id: formId },
    })),
  importForm: (input) => {
    const parsed = parseImportedFormSchema(input);
    const timestamp = now();
    const imported: FormSchema = {
      ...cloneForm(parsed),
      id: createId("form"),
      createdAt: timestamp,
      updatedAt: timestamp,
      layout: {
        sections: parsed.layout.sections.map((section) => cloneSectionWithNewIds(section, getAllFields(parsed))),
      },
    };

    set((state) => ({ forms: [imported, ...state.forms], selectedFormId: imported.id, selectedElement: { type: "form", id: imported.id } }));
    return imported;
  },
  exportForm: (formId) => {
    const form = get().forms.find((item) => item.id === formId);
    if (!form) {
      throw new Error("Form not found");
    }

    return serializeFormSchema(form);
  },
  hydrateLegacyForms: () => {
    if (get().forms.length > 0) {
      return;
    }

    try {
      const legacyForms = parseLegacyStorage();
      if (legacyForms.length > 0) {
        set({
          forms: legacyForms,
          selectedFormId: legacyForms[0]!.id,
          selectedElement: { type: "form", id: legacyForms[0]!.id },
        });
      }
    } catch {
      // Bad legacy drafts should not block the Pro app from loading.
    }
  },
  setPreference: (key, value) =>
    set((state) => ({
      preferences: {
        ...state.preferences,
        [key]: value,
      },
    })),
});

export function createFormBuilderStore() {
  return createStore<FormBuilderStore>()(creator);
}

export const useFormBuilderStore = create<FormBuilderStore>()(
  persist(creator, {
    name: PRO_STORAGE_KEY,
    storage: createJSONStorage(() => localStorage),
    partialize: (state) => ({
      forms: state.forms,
      selectedFormId: state.selectedFormId,
      preferences: state.preferences,
    }),
    onRehydrateStorage: () => (state) => {
      state?.hydrateLegacyForms();
    },
  }),
);
