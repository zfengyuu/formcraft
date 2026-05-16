"use client";

import { useEffect, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { DndContext, type DragEndEvent, PointerSensor, useDraggable, useDroppable, useSensor, useSensors } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { ArrowLeft, Copy, Download, Eye, GripVertical, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { fieldDefinitions, fieldTypes, getFieldDefinition } from "@/lib/field-definitions";
import { getAllFields } from "@/lib/get-all-fields";
import { layoutPresets, resizeColumns as resizeWidthPair } from "@/lib/layout-presets";
import { formTemplates, type FormTemplateId } from "@/lib/templates";
import { cn, createId } from "@/lib/utils";
import { useFormBuilderStore } from "@/stores/form-builder-store";
import type {
  FieldSettingDefinition,
  FieldType,
  FieldWidth,
  FormColumn,
  FormField,
  FormRow,
  FormSchema,
  FormSection,
  LayoutPresetId,
  SelectedElement,
} from "@/types/form";

function downloadJson(filename: string, json: string) {
  const blob = new Blob([json], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

function fieldWidthClass(field: FormField) {
  switch (field.settings?.width) {
    case "half":
      return "md:col-span-6";
    case "one-third":
      return "md:col-span-4";
    case "two-thirds":
      return "md:col-span-8";
    default:
      return "md:col-span-12";
  }
}

function plural(count: number, singular: string, pluralLabel = `${singular}s`) {
  return `${count} ${count === 1 ? singular : pluralLabel}`;
}

function getNestedValue(field: FormField, key: string) {
  if (key === "width") {
    return field.settings?.width ?? "full";
  }

  return key.split(".").reduce<unknown>((value, part) => {
    if (value && typeof value === "object" && part in value) {
      return (value as Record<string, unknown>)[part];
    }
    return undefined;
  }, field);
}

function cleanSettingValue(value: string | boolean, definition: FieldSettingDefinition) {
  if (definition.type === "boolean") {
    return Boolean(value);
  }
  if (definition.type === "number") {
    return value === "" ? undefined : Number(value);
  }
  if (definition.type === "file-types") {
    return typeof value === "string"
      ? value
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean)
      : [];
  }
  return value;
}

function updateBySetting(field: FormField, definition: FieldSettingDefinition, value: string | boolean): Partial<FormField> {
  const cleanValue = cleanSettingValue(value, definition);
  const [root, child] = definition.key.split(".");

  if (definition.key === "width") {
    return { settings: { ...field.settings, width: cleanValue as FieldWidth } };
  }

  if (root === "validation" && child) {
    return { validation: { ...field.validation, [child]: cleanValue } };
  }

  if (root === "settings" && child) {
    return { settings: { ...field.settings, [child]: cleanValue } };
  }

  return { [definition.key]: cleanValue } as Partial<FormField>;
}

function findSection(form: FormSchema, sectionId: string) {
  return form.layout.sections.find((section) => section.id === sectionId) ?? null;
}

function findRow(form: FormSchema, rowId: string) {
  for (const section of form.layout.sections) {
    const row = section.rows.find((item) => item.id === rowId);
    if (row) {
      return { section, row };
    }
  }
  return { section: null, row: null };
}

function findColumn(form: FormSchema, columnId: string) {
  for (const section of form.layout.sections) {
    for (const row of section.rows) {
      const column = row.columns.find((item) => item.id === columnId);
      if (column) {
        return { section, row, column };
      }
    }
  }
  return { section: null, row: null, column: null };
}

function findField(form: FormSchema, fieldId: string) {
  for (const section of form.layout.sections) {
    for (const row of section.rows) {
      for (const column of row.columns) {
        const field = column.fields.find((item) => item.id === fieldId);
        if (field) {
          return { section, row, column, field };
        }
      }
    }
  }
  return { section: null, row: null, column: null, field: null };
}

function FieldLibraryItem({ onAdd, type }: { onAdd: (type: FieldType) => void; type: FieldType }) {
  const definition = getFieldDefinition(type);
  const Icon = definition.icon;
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: `library:${type}`,
    data: { source: "library", type },
  });

  return (
    <button
      ref={setNodeRef}
      type="button"
      className="flex h-10 w-full items-center gap-2 rounded-lg border border-slate-800 bg-slate-900/70 px-3 text-left text-sm text-slate-200 transition hover:border-teal-400/50 hover:bg-slate-800"
      style={{ transform: CSS.Translate.toString(transform) }}
      aria-label={type === "sectionTitle" ? "Insert Section Title field" : `Add ${definition.label}`}
      onClick={() => onAdd(type)}
      {...listeners}
      {...attributes}
    >
      <Icon className="size-4 text-teal-300" />
      <span className="truncate">{definition.label}</span>
      <Plus className="ml-auto size-3.5 text-slate-500" />
    </button>
  );
}

function FieldLibrary({ onAdd }: { onAdd: (type: FieldType) => void }) {
  return (
    <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-1">
      {fieldTypes.map((type) => (
        <FieldLibraryItem key={type} type={type} onAdd={onAdd} />
      ))}
    </div>
  );
}

function LayoutLibrary({ onAddRow }: { onAddRow: (presetId: LayoutPresetId) => void }) {
  return (
    <div className="space-y-2">
      {layoutPresets.map((preset) => (
        <button
          key={preset.id}
          type="button"
          aria-label={`Add ${preset.label}`}
          className="w-full rounded-lg border border-slate-800 bg-slate-900/70 p-3 text-left transition hover:border-teal-400/60 hover:bg-slate-800"
          onClick={() => onAddRow(preset.id)}
        >
          <span className="block text-sm font-medium text-slate-100">{preset.label}</span>
          <span className="mt-1 block text-xs text-slate-500">{preset.description}</span>
          <span className="mt-2 flex gap-1">
            {preset.widths.map((width, index) => (
              <span key={`${preset.id}-${index}`} className="h-2 rounded-sm bg-teal-300/60" style={{ width: `${width}%` }} />
            ))}
          </span>
        </button>
      ))}
    </div>
  );
}

function TemplateLibrary({ onCreate }: { onCreate: (templateId: FormTemplateId) => void }) {
  return (
    <div className="space-y-2">
      {formTemplates.map((template) => (
        <button
          key={template.id}
          type="button"
          aria-label={`Use ${template.title} template`}
          className="w-full rounded-lg border border-slate-800 bg-slate-900/70 p-3 text-left transition hover:border-teal-400/60 hover:bg-slate-800"
          onClick={() => onCreate(template.id)}
        >
          <span className="block text-sm font-medium text-slate-100">{template.title}</span>
          <span className="mt-1 block text-xs text-slate-500">{template.description}</span>
        </button>
      ))}
    </div>
  );
}

function OutlinePanel({ form, selectedElement, onSelect }: { form: FormSchema; selectedElement: SelectedElement | null; onSelect: (element: SelectedElement) => void }) {
  return (
    <div className="space-y-2 text-sm">
      <button
        type="button"
        aria-label={`Select form ${form.title}`}
        className={cn("w-full rounded-lg border px-3 py-2 text-left", selectedElement?.type === "form" ? "border-teal-400 bg-teal-400/10 text-teal-100" : "border-slate-800 bg-slate-900/60 text-slate-300")}
        onClick={() => onSelect({ type: "form", id: form.id })}
      >
        {form.title}
      </button>
      {form.layout.sections.map((section, sectionIndex) => (
        <div key={section.id} className="space-y-1">
          <button
            type="button"
            aria-label={`Select section ${section.title}`}
            className={cn("w-full rounded-lg border px-3 py-2 text-left", selectedElement?.id === section.id ? "border-teal-400 bg-teal-400/10 text-teal-100" : "border-slate-800 bg-slate-900/60 text-slate-300")}
            onClick={() => onSelect({ type: "section", id: section.id })}
          >
            {sectionIndex + 1}. {section.title}
          </button>
          {section.rows.map((row, rowIndex) => (
            <div key={row.id} className="ml-3 space-y-1">
              <button
                type="button"
                aria-label={`Select row ${rowIndex + 1}`}
                className={cn("w-full rounded-lg border px-3 py-1.5 text-left text-xs", selectedElement?.id === row.id ? "border-teal-400 bg-teal-400/10 text-teal-100" : "border-slate-800 bg-slate-900/60 text-slate-400")}
                onClick={() => onSelect({ type: "row", id: row.id })}
              >
                Row {rowIndex + 1}
              </button>
              {row.columns.map((column, columnIndex) => (
                <div key={column.id} className="ml-3 space-y-1">
                  <button
                    type="button"
                    aria-label={`Select column ${columnIndex + 1}`}
                    className={cn("w-full rounded-lg border px-3 py-1.5 text-left text-xs", selectedElement?.id === column.id ? "border-teal-400 bg-teal-400/10 text-teal-100" : "border-slate-800 bg-slate-900/60 text-slate-500")}
                    onClick={() => onSelect({ type: "column", id: column.id })}
                  >
                    Column {columnIndex + 1} ({Math.round(column.width)}%)
                  </button>
                  {column.fields.map((field) => (
                    <button
                      key={field.id}
                      type="button"
                      aria-label={`Select field ${field.label}`}
                      className={cn("ml-3 w-[calc(100%-0.75rem)] rounded-lg border px-3 py-1.5 text-left text-xs", selectedElement?.id === field.id ? "border-teal-400 bg-teal-400/10 text-teal-100" : "border-slate-800 bg-slate-900/60 text-slate-400")}
                      onClick={() => onSelect({ type: "field", id: field.id })}
                    >
                      {field.label}
                    </button>
                  ))}
                </div>
              ))}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

function LeftPanel({
  form,
  onAddField,
  onAddRow,
  onCreateTemplate,
}: {
  form: FormSchema;
  onAddField: (type: FieldType) => void;
  onAddRow: (presetId: LayoutPresetId) => void;
  onCreateTemplate: (templateId: FormTemplateId) => void;
}) {
  const { preferences, selectedElement, selectElement, setPreference } = useFormBuilderStore();
  const tabs: Array<{ id: typeof preferences.leftPanel; label: string }> = [
    { id: "fields", label: "Fields" },
    { id: "layouts", label: "Layouts" },
    { id: "templates", label: "Templates" },
    { id: "outline", label: "Outline" },
  ];

  return (
    <aside className="rounded-lg border border-slate-800 bg-slate-950/80 p-3">
      <div className="mb-3 grid grid-cols-2 gap-1">
        {tabs.map((tab) => (
          <Button key={tab.id} type="button" size="sm" variant={preferences.leftPanel === tab.id ? "default" : "outline"} onClick={() => setPreference("leftPanel", tab.id)}>
            {tab.label}
          </Button>
        ))}
      </div>
      {preferences.leftPanel === "fields" ? <FieldLibrary onAdd={onAddField} /> : null}
      {preferences.leftPanel === "layouts" ? <LayoutLibrary onAddRow={onAddRow} /> : null}
      {preferences.leftPanel === "templates" ? <TemplateLibrary onCreate={onCreateTemplate} /> : null}
      {preferences.leftPanel === "outline" ? <OutlinePanel form={form} selectedElement={selectedElement} onSelect={selectElement} /> : null}
    </aside>
  );
}

function FieldBlock({ field, selected, formId }: { field: FormField; selected: boolean; formId: string }) {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: `field:${field.id}`,
    data: { source: "canvas", fieldId: field.id },
  });
  const { isOver, setNodeRef: setDropRef } = useDroppable({ id: `field:${field.id}` });
  const { deleteField, duplicateField, selectElement, updateField } = useFormBuilderStore();
  const definition = fieldDefinitions[field.type];
  const Icon = definition.icon;

  return (
    <div
      ref={(node) => {
        setNodeRef(node);
        setDropRef(node);
      }}
      style={{ transform: CSS.Translate.toString(transform) }}
      className={cn(
        "rounded-lg border bg-white p-3 text-slate-950 shadow-sm transition",
        fieldWidthClass(field),
        selected ? "border-teal-500 ring-2 ring-teal-400/25" : isOver ? "border-teal-400" : "border-slate-200 hover:border-slate-300",
      )}
    >
      <div className="flex items-start gap-2">
        <button
          type="button"
          className="mt-0.5 flex size-7 items-center justify-center rounded-md border border-slate-200 text-slate-400 hover:bg-slate-100"
          aria-label={`Drag ${field.label}`}
          {...attributes}
          {...listeners}
        >
          <GripVertical className="size-4" />
        </button>
        <button type="button" className="min-w-0 flex-1 text-left" onClick={() => selectElement({ type: "field", id: field.id })}>
          <div className="flex flex-wrap items-center gap-2">
            <Icon className="size-4 text-teal-600" />
            <span className="font-medium">{field.label}</span>
            {field.required ? <Badge tone="amber">Required</Badge> : null}
            <Badge>{definition.label}</Badge>
          </div>
          <p className="mt-1 truncate text-xs text-slate-500">{field.name}</p>
          {field.description ? <p className="mt-2 text-sm text-slate-600">{field.description}</p> : null}
        </button>
        <div className="flex gap-1">
          <Button
            size="icon"
            variant="ghost"
            className="text-slate-600 hover:bg-slate-100 hover:text-slate-950"
            aria-label={`Toggle required ${field.label}`}
            onClick={() => updateField(formId, field.id, { required: !field.required })}
          >
            *
          </Button>
          <Button
            size="icon"
            variant="ghost"
            className="text-slate-600 hover:bg-slate-100 hover:text-slate-950"
            aria-label={`Duplicate ${field.label}`}
            onClick={() => duplicateField(formId, field.id)}
          >
            <Copy />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            className="text-rose-600 hover:bg-rose-50 hover:text-rose-700"
            aria-label={field.label.endsWith(" Copy") ? `Delete copied field ${field.label}` : `Delete ${field.label}`}
            onClick={() => deleteField(formId, field.id)}
          >
            <Trash2 />
          </Button>
        </div>
      </div>
    </div>
  );
}

function ResizeHandle({ formId, row, index }: { formId: string; row: FormRow; index: number }) {
  const resizeColumns = useFormBuilderStore((state) => state.resizeColumns);

  return (
    <button
      type="button"
      aria-label={`Resize columns ${index + 1} and ${index + 2}`}
      className="hidden w-2 cursor-col-resize items-stretch justify-center md:flex"
      onPointerDown={(event) => {
        event.preventDefault();
        const startX = event.clientX;
        const startWidths = row.columns.map((column) => column.width);
        const rowWidth = (event.currentTarget.parentElement?.getBoundingClientRect().width ?? 800) || 800;

        const handleMove = (moveEvent: PointerEvent) => {
          const delta = ((moveEvent.clientX - startX) / rowWidth) * 100;
          const widths = resizeWidthPair(startWidths, index, (startWidths[index] ?? 50) + delta);
          resizeColumns(formId, row.id, widths);
        };

        const handleUp = () => {
          window.removeEventListener("pointermove", handleMove);
          window.removeEventListener("pointerup", handleUp);
        };

        window.addEventListener("pointermove", handleMove);
        window.addEventListener("pointerup", handleUp);
      }}
    >
      <span className="my-10 w-1 rounded-full bg-slate-300 transition hover:bg-teal-400" />
    </button>
  );
}

function ColumnCanvas({ column, formId, selectedElement }: { column: FormColumn; formId: string; selectedElement: SelectedElement | null }) {
  const { isOver, setNodeRef } = useDroppable({
    id: `column:${column.id}`,
    data: { source: "column", columnId: column.id },
  });
  const selectElement = useFormBuilderStore((state) => state.selectElement);

  return (
    <div className="min-w-0" style={{ flex: `1 1 ${column.width}%`, maxWidth: `${column.width}%` }}>
      <button
        type="button"
        aria-label={`Select column ${Math.round(column.width)} percent`}
        className={cn(
          "mb-2 w-full rounded-md border px-2 py-1 text-left text-xs",
          selectedElement?.id === column.id ? "border-teal-500 bg-teal-50 text-teal-700" : "border-slate-200 bg-white/70 text-slate-500",
        )}
        onClick={() => selectElement({ type: "column", id: column.id })}
      >
        Column {Math.round(column.width)}%
      </button>
      <div
        ref={setNodeRef}
        className={cn(
          "min-h-40 rounded-lg border border-dashed bg-white/70 p-3 transition",
          isOver ? "border-teal-500 ring-2 ring-teal-400/25" : "border-slate-300",
        )}
      >
        {column.fields.length === 0 ? (
          <div className="flex min-h-28 items-center justify-center rounded-md bg-slate-50 text-center text-xs text-slate-500">
            Drop fields here
          </div>
        ) : (
          <div className="grid gap-3 md:grid-cols-12">
            {column.fields.map((field) => (
              <FieldBlock key={field.id} formId={formId} field={field} selected={selectedElement?.id === field.id} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function RowCanvas({ row, formId, selectedElement }: { row: FormRow; formId: string; selectedElement: SelectedElement | null }) {
  const { changeRowLayout, deleteRow, duplicateRow, selectElement } = useFormBuilderStore();

  return (
    <div className={cn("rounded-lg border p-3", selectedElement?.id === row.id ? "border-teal-500 ring-2 ring-teal-400/20" : "border-slate-200 bg-white/70")}>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <button type="button" className="text-left text-xs font-medium uppercase text-slate-500" onClick={() => selectElement({ type: "row", id: row.id })}>
          Row layout
        </button>
        <div className="flex flex-wrap gap-1">
          <Select className="h-8 w-40 border-slate-300 bg-white text-slate-700" aria-label="Change row layout" onChange={(event) => changeRowLayout(formId, row.id, event.target.value as LayoutPresetId)}>
            <option value="">Change layout</option>
            {layoutPresets.map((preset) => (
              <option key={preset.id} value={preset.id}>
                {preset.label}
              </option>
            ))}
          </Select>
          <Button size="sm" variant="outline" className="border-slate-300 text-slate-700 hover:bg-slate-100" onClick={() => duplicateRow(formId, row.id)}>
            <Copy />
            Duplicate
          </Button>
          <Button size="sm" variant="outline" className="border-slate-300 text-rose-600 hover:bg-rose-50" onClick={() => deleteRow(formId, row.id)}>
            <Trash2 />
            Delete
          </Button>
        </div>
      </div>
      <div className="flex flex-col gap-3 md:flex-row">
        {row.columns.map((column, index) => (
          <div key={column.id} className="contents">
            <ColumnCanvas column={column} formId={formId} selectedElement={selectedElement} />
            {index < row.columns.length - 1 ? <ResizeHandle formId={formId} row={row} index={index} /> : null}
          </div>
        ))}
      </div>
    </div>
  );
}

function SectionCanvas({ section, formId, selectedElement, onAddRow }: { section: FormSection; formId: string; selectedElement: SelectedElement | null; onAddRow: (sectionId: string, presetId: LayoutPresetId) => void }) {
  const { deleteSection, duplicateSection, selectElement } = useFormBuilderStore();

  return (
    <section className={cn("space-y-3 rounded-lg border p-4", selectedElement?.id === section.id ? "border-teal-500 ring-2 ring-teal-400/20" : "border-slate-300 bg-white")}>
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <button type="button" className="min-w-0 text-left" onClick={() => selectElement({ type: "section", id: section.id })}>
          <h3 className="text-base font-semibold text-slate-950">{section.title}</h3>
          {section.description ? <p className="text-sm text-slate-500">{section.description}</p> : null}
        </button>
        <div className="flex flex-wrap gap-1">
          <Button size="sm" variant="outline" className="border-slate-300 text-slate-700 hover:bg-slate-100" aria-label="Add 1 column" onClick={() => onAddRow(section.id, "one")}>
            <Plus />
            1 column
          </Button>
          <Button size="sm" variant="outline" className="border-slate-300 text-slate-700 hover:bg-slate-100" aria-label="Add 2 columns equal" onClick={() => onAddRow(section.id, "two-equal")}>
            <Plus />
            2 columns
          </Button>
          <Button size="sm" variant="outline" className="border-slate-300 text-slate-700 hover:bg-slate-100" onClick={() => duplicateSection(formId, section.id)}>
            <Copy />
            Duplicate
          </Button>
          <Button size="sm" variant="outline" className="border-slate-300 text-rose-600 hover:bg-rose-50" onClick={() => deleteSection(formId, section.id)}>
            <Trash2 />
            Delete
          </Button>
        </div>
      </div>
      {section.rows.length === 0 ? (
        <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-6 text-center text-sm text-slate-500">
          Add a layout row to create column drop zones.
        </div>
      ) : (
        <div className="space-y-3">
          {section.rows.map((row) => (
            <RowCanvas key={row.id} row={row} formId={formId} selectedElement={selectedElement} />
          ))}
        </div>
      )}
    </section>
  );
}

function Canvas({
  form,
  selectedElement,
  onAddSection,
  onAddRowForSection,
}: {
  form: FormSchema;
  selectedElement: SelectedElement | null;
  onAddSection: () => void;
  onAddRowForSection: (sectionId: string, presetId: LayoutPresetId) => void;
}) {
  return (
    <section className="min-h-[680px] rounded-lg border border-slate-800 bg-[#f8faf9] p-4 text-slate-950">
      <div className="mb-4 flex flex-col gap-3 border-b border-slate-200 pb-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-sm font-semibold uppercase text-slate-500">Layout Canvas</h2>
          <p className="text-xs text-slate-500">Sections contain rows, rows contain resizable columns, columns contain fields.</p>
        </div>
        <Button type="button" aria-label="Add section" onClick={onAddSection}>
          <Plus />
          Add section
        </Button>
      </div>
      {form.layout.sections.length === 0 ? (
        <div className="flex min-h-96 flex-col items-center justify-center rounded-lg border border-dashed border-slate-300 bg-white/70 p-8 text-center">
          <h3 className="text-lg font-semibold">Start with a section</h3>
          <p className="mt-2 max-w-sm text-sm text-slate-500">Add a section, choose a row preset, then drop fields into columns.</p>
          <Button className="mt-5" type="button" aria-label="Start with section" onClick={onAddSection}>
            <Plus />
            Start section
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {form.layout.sections.map((section) => (
            <SectionCanvas key={section.id} formId={form.id} section={section} selectedElement={selectedElement} onAddRow={onAddRowForSection} />
          ))}
        </div>
      )}
    </section>
  );
}

function OptionsEditor({ field, onChange }: { field: FormField; onChange: (updates: Partial<FormField>) => void }) {
  const options = field.options ?? [];

  return (
    <div className="space-y-2">
      <Label>Options</Label>
      {options.map((option, index) => (
        <div key={option.id} className="grid grid-cols-[1fr_1fr_auto] gap-2">
          <Input
            aria-label={`Option ${index + 1} label`}
            value={option.label}
            onChange={(event) =>
              onChange({
                options: options.map((item) =>
                  item.id === option.id ? { ...item, label: event.target.value, value: event.target.value.toLowerCase().replace(/\s+/g, "-") } : item,
                ),
              })
            }
          />
          <Input
            aria-label={`Option ${index + 1} value`}
            value={option.value}
            onChange={(event) => onChange({ options: options.map((item) => (item.id === option.id ? { ...item, value: event.target.value } : item)) })}
          />
          <Button type="button" size="icon" variant="ghost" aria-label={`Remove option ${index + 1}`} onClick={() => onChange({ options: options.filter((item) => item.id !== option.id) })}>
            <Trash2 />
          </Button>
        </div>
      ))}
      <Button
        type="button"
        variant="outline"
        className="w-full"
        onClick={() => onChange({ options: [...options, { id: createId("option"), label: `Option ${options.length + 1}`, value: `option-${options.length + 1}` }] })}
      >
        <Plus />
        Add option
      </Button>
    </div>
  );
}

function SettingControl({ definition, field, onChange }: { definition: FieldSettingDefinition; field: FormField; onChange: (updates: Partial<FormField>) => void }) {
  if (definition.type === "options") {
    return <OptionsEditor field={field} onChange={onChange} />;
  }

  const id = `setting-${definition.key.replace(/\./g, "-")}`;
  const rawValue = getNestedValue(field, definition.key);
  const value = Array.isArray(rawValue) ? rawValue.join(", ") : rawValue;

  if (definition.type === "boolean") {
    return (
      <label htmlFor={id} className="flex items-center justify-between gap-3 rounded-lg border border-slate-800 bg-slate-900/70 p-3">
        <span className="text-sm text-slate-200">{definition.label}</span>
        <input id={id} className="size-4 accent-teal-400" type="checkbox" checked={Boolean(value)} onChange={(event) => onChange(updateBySetting(field, definition, event.target.checked))} />
      </label>
    );
  }

  if (definition.type === "textarea") {
    return (
      <div className="space-y-1.5">
        <Label htmlFor={id}>{definition.label}</Label>
        <Textarea id={id} value={String(value ?? "")} onChange={(event) => onChange(updateBySetting(field, definition, event.target.value))} />
      </div>
    );
  }

  if (definition.type === "select") {
    return (
      <div className="space-y-1.5">
        <Label htmlFor={id}>{definition.label}</Label>
        <Select id={id} value={String(value ?? "full")} onChange={(event) => onChange(updateBySetting(field, definition, event.target.value))}>
          {definition.options?.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </Select>
      </div>
    );
  }

  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{definition.label}</Label>
      <Input
        id={id}
        type={definition.type === "number" ? "number" : definition.type === "date" ? "date" : "text"}
        value={String(value ?? "")}
        onChange={(event) => onChange(updateBySetting(field, definition, event.target.value))}
      />
    </div>
  );
}

function FormSettingsPanel({ form }: { form: FormSchema }) {
  const updateForm = useFormBuilderStore((state) => state.updateForm);

  return (
    <aside className="rounded-lg border border-slate-800 bg-slate-950/80 p-4">
      <h2 className="text-sm font-semibold text-white">Form Settings</h2>
      <div className="mt-4 space-y-3">
        <div className="space-y-1.5">
          <Label htmlFor="form-title">Title</Label>
          <Input id="form-title" value={form.title} onChange={(event) => updateForm(form.id, { title: event.target.value })} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="form-description">Description</Label>
          <Textarea id="form-description" value={form.description ?? ""} onChange={(event) => updateForm(form.id, { description: event.target.value })} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="submit-text">Submit button text</Label>
          <Input id="submit-text" value={form.settings.submitButtonText ?? "Submit"} onChange={(event) => updateForm(form.id, { settings: { submitButtonText: event.target.value } })} />
        </div>
      </div>
    </aside>
  );
}

function SectionSettingsPanel({ formId, section }: { formId: string; section: FormSection }) {
  const updateSection = useFormBuilderStore((state) => state.updateSection);

  return (
    <aside className="rounded-lg border border-slate-800 bg-slate-950/80 p-4">
      <h2 className="text-sm font-semibold text-white">Section Settings</h2>
      <div className="mt-4 space-y-3">
        <div className="space-y-1.5">
          <Label htmlFor="section-title">Title</Label>
          <Input id="section-title" value={section.title} onChange={(event) => updateSection(formId, section.id, { title: event.target.value })} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="section-description">Description</Label>
          <Textarea id="section-description" value={section.description ?? ""} onChange={(event) => updateSection(formId, section.id, { description: event.target.value })} />
        </div>
        <label className="flex items-center justify-between gap-3 rounded-lg border border-slate-800 bg-slate-900/70 p-3">
          <span className="text-sm text-slate-200">Show title</span>
          <input className="size-4 accent-teal-400" type="checkbox" checked={section.settings?.showTitle !== false} onChange={(event) => updateSection(formId, section.id, { settings: { showTitle: event.target.checked } })} />
        </label>
      </div>
    </aside>
  );
}

function RowSettingsPanel({ formId, row }: { formId: string; row: FormRow }) {
  const { changeRowLayout, updateRow } = useFormBuilderStore();

  return (
    <aside className="rounded-lg border border-slate-800 bg-slate-950/80 p-4">
      <h2 className="text-sm font-semibold text-white">Row Settings</h2>
      <div className="mt-4 space-y-3">
        <div className="space-y-1.5">
          <Label htmlFor="row-layout">Layout preset</Label>
          <Select id="row-layout" onChange={(event) => changeRowLayout(formId, row.id, event.target.value as LayoutPresetId)}>
            <option value="">Keep current layout</option>
            {layoutPresets.map((preset) => (
              <option key={preset.id} value={preset.id}>
                {preset.label}
              </option>
            ))}
          </Select>
        </div>
        <label className="flex items-center justify-between gap-3 rounded-lg border border-slate-800 bg-slate-900/70 p-3">
          <span className="text-sm text-slate-200">Stack on mobile</span>
          <input className="size-4 accent-teal-400" type="checkbox" checked={row.settings?.stackOnMobile !== false} onChange={(event) => updateRow(formId, row.id, { settings: { stackOnMobile: event.target.checked } })} />
        </label>
      </div>
    </aside>
  );
}

function ColumnSettingsPanel({ formId, row, column }: { formId: string; row: FormRow; column: FormColumn }) {
  const { resizeColumns, updateColumn } = useFormBuilderStore();

  return (
    <aside className="rounded-lg border border-slate-800 bg-slate-950/80 p-4">
      <h2 className="text-sm font-semibold text-white">Column Settings</h2>
      <div className="mt-4 space-y-3">
        <div className="space-y-1.5">
          <Label htmlFor="column-width">Width percentage</Label>
          <Input
            id="column-width"
            type="number"
            min={20}
            max={80}
            value={Math.round(column.width)}
            onChange={(event) => {
              const index = row.columns.findIndex((item) => item.id === column.id);
              if (row.columns.length === 2 && index === 0) {
                resizeColumns(formId, row.id, [Number(event.target.value), 100 - Number(event.target.value)]);
              } else {
                updateColumn(formId, column.id, { width: Number(event.target.value) });
              }
            }}
          />
        </div>
      </div>
    </aside>
  );
}

function FieldSettingsPanel({ formId, field }: { formId: string; field: FormField }) {
  const updateField = useFormBuilderStore((state) => state.updateField);
  const definition = getFieldDefinition(field.type);

  return (
    <aside className="rounded-lg border border-slate-800 bg-slate-950/80 p-4">
      <div className="mb-4 flex items-center gap-2">
        <definition.icon className="size-4 text-teal-300" />
        <div>
          <h2 className="text-sm font-semibold text-white">Field Settings</h2>
          <p className="text-xs text-slate-500">{definition.label}</p>
        </div>
      </div>
      <div className="space-y-3">
        {definition.settings.map((setting) => (
          <SettingControl key={`${field.id}-${setting.key}-${setting.label}`} definition={setting} field={field} onChange={(updates) => updateField(formId, field.id, updates)} />
        ))}
      </div>
    </aside>
  );
}

function SettingsPanel({ form, selectedElement }: { form: FormSchema; selectedElement: SelectedElement | null }) {
  if (selectedElement?.type === "field") {
    const { field } = findField(form, selectedElement.id);
    if (field) {
      return <FieldSettingsPanel formId={form.id} field={field} />;
    }
  }
  if (selectedElement?.type === "column") {
    const { row, column } = findColumn(form, selectedElement.id);
    if (row && column) {
      return <ColumnSettingsPanel formId={form.id} row={row} column={column} />;
    }
  }
  if (selectedElement?.type === "row") {
    const { row } = findRow(form, selectedElement.id);
    if (row) {
      return <RowSettingsPanel formId={form.id} row={row} />;
    }
  }
  if (selectedElement?.type === "section") {
    const section = findSection(form, selectedElement.id);
    if (section) {
      return <SectionSettingsPanel formId={form.id} section={section} />;
    }
  }
  return <FormSettingsPanel form={form} />;
}

function BuilderTopBar({ form }: { form: FormSchema }) {
  const clearForm = useFormBuilderStore((state) => state.clearForm);
  const exportForm = useFormBuilderStore((state) => state.exportForm);
  const updateForm = useFormBuilderStore((state) => state.updateForm);
  const fieldCount = getAllFields(form).length;

  return (
    <header className="sticky top-0 z-20 border-b border-slate-800 bg-[#071012]/95 px-4 py-3 backdrop-blur">
      <div className="mx-auto flex max-w-[1600px] flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex min-w-0 items-center gap-3">
          <Button asChild variant="ghost" size="icon" aria-label="Back to dashboard">
            <Link href="/">
              <ArrowLeft />
            </Link>
          </Button>
          <div className="min-w-0">
            <div className="text-xs text-slate-500">FormCraft Pro / Builder</div>
            <Input
              className="mt-1 h-8 border-transparent bg-transparent px-0 text-lg font-semibold text-white focus:border-transparent focus:ring-0"
              aria-label="Form name"
              value={form.title}
              onChange={(event) => updateForm(form.id, { title: event.target.value })}
            />
          </div>
          <Badge tone="teal">{plural(fieldCount, "field")}</Badge>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild variant="outline">
            <Link href={`/forms/${form.id}/preview`}>
              <Eye />
              Preview
            </Link>
          </Button>
          <Button variant="outline" onClick={() => downloadJson(`${form.title.replace(/\s+/g, "-").toLowerCase() || "form"}.json`, exportForm(form.id))}>
            <Download />
            Export
          </Button>
          <Button
            variant="outline"
            aria-label="Clear form"
            onClick={() => {
              clearForm(form.id);
              toast.success("Canvas cleared");
            }}
          >
            <Trash2 />
            Clear form
          </Button>
        </div>
      </div>
    </header>
  );
}

export function BuilderPage({ formId }: { formId: string }) {
  const router = useRouter();
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));
  const {
    addField,
    addFieldToColumn,
    addRow,
    addSection,
    createFormFromTemplate,
    forms,
    hydrateLegacyForms,
    moveFieldToColumn,
    preferences,
    reorderFields,
    selectForm,
    selectedElement,
    setPreference,
  } = useFormBuilderStore();
  const form = forms.find((item) => item.id === formId) ?? null;
  const allFields = useMemo(() => getAllFields(form), [form]);

  useEffect(() => {
    hydrateLegacyForms();
  }, [hydrateLegacyForms]);

  useEffect(() => {
    selectForm(formId);
  }, [formId, selectForm]);

  if (!form) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#071012] p-6">
        <div className="rounded-lg border border-slate-800 bg-slate-950 p-6 text-center">
          <h1 className="text-xl font-semibold text-white">Form not found</h1>
          <p className="mt-2 text-sm text-slate-400">The local schema may have been deleted or not imported yet.</p>
          <Button asChild className="mt-5">
            <Link href="/">Back to dashboard</Link>
          </Button>
        </div>
      </main>
    );
  }

  const addRowForCurrentSelection = (presetId: LayoutPresetId) => {
    const sectionId =
      selectedElement?.type === "section"
        ? selectedElement.id
        : selectedElement?.type === "row"
          ? findRow(form, selectedElement.id).section?.id
          : selectedElement?.type === "column"
            ? findColumn(form, selectedElement.id).section?.id
            : selectedElement?.type === "field"
              ? findField(form, selectedElement.id).section?.id
              : form.layout.sections[0]?.id;
    const section = sectionId ? findSection(form, sectionId) : null;
    const targetSection = section ?? addSection(form.id, { title: "Main" });
    addRow(form.id, targetSection.id, presetId);
  };

  const addRowForSection = (sectionId: string, presetId: LayoutPresetId) => {
    addRow(form.id, sectionId, presetId);
  };

  const handleAddField = (type: FieldType) => {
    if (selectedElement?.type === "column") {
      const location = findColumn(form, selectedElement.id);
      if (location.section && location.row && location.column) {
        addFieldToColumn(form.id, location.section.id, location.row.id, location.column.id, type);
        return;
      }
    }
    addField(form.id, type);
  };

  const handleTemplate = (templateId: FormTemplateId) => {
    const nextForm = createFormFromTemplate(templateId);
    toast.success(`Created ${nextForm.title}`);
    router.push(`/forms/${nextForm.id}/builder`);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) {
      return;
    }

    const source = active.data.current?.source;
    const overId = String(over.id);
    const targetColumnId = overId.startsWith("column:") ? overId.replace("column:", "") : overId.startsWith("field:") ? findField(form, overId.replace("field:", "")).column?.id : null;

    if (source === "library" && targetColumnId) {
      const type = active.data.current?.type as FieldType;
      const location = findColumn(form, targetColumnId);
      if (location.section && location.row && location.column) {
        addFieldToColumn(form.id, location.section.id, location.row.id, location.column.id, type);
      }
      return;
    }

    if (source === "canvas") {
      const activeFieldId = String(active.id).replace("field:", "");
      if (overId.startsWith("field:")) {
        reorderFields(form.id, activeFieldId, overId.replace("field:", ""));
      } else if (targetColumnId) {
        moveFieldToColumn(form.id, activeFieldId, targetColumnId);
      }
    }
  };

  return (
    <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
      <main className="min-h-screen bg-[#071012] text-slate-100">
        <BuilderTopBar form={form} />
        <div className="mx-auto max-w-[1600px] p-4">
          <div className="mb-4 grid grid-cols-4 gap-2 lg:hidden">
            {[
              ["fields", "Fields"],
              ["canvas", "Canvas"],
              ["settings", "Settings"],
            ].map(([id, label]) => (
              <Button key={id} size="sm" variant={preferences.mobilePanel === id ? "default" : "outline"} onClick={() => setPreference("mobilePanel", id as "fields" | "canvas" | "settings")}>
                {label}
              </Button>
            ))}
            <Button asChild size="sm" variant="outline">
              <Link href={`/forms/${form.id}/preview`}>Preview</Link>
            </Button>
          </div>

          <div className="grid gap-4 lg:grid-cols-[300px_minmax(0,1fr)_360px]">
            <div className={cn(preferences.mobilePanel === "fields" ? "block" : "hidden", "lg:block")}>
              <LeftPanel form={form} onAddField={handleAddField} onAddRow={addRowForCurrentSelection} onCreateTemplate={handleTemplate} />
            </div>
            <div className={cn(preferences.mobilePanel === "canvas" ? "block" : "hidden", "lg:block")}>
              <Canvas form={form} selectedElement={selectedElement} onAddSection={() => addSection(form.id, { title: `Section ${form.layout.sections.length + 1}` })} onAddRowForSection={addRowForSection} />
            </div>
            <div className={cn("space-y-4", preferences.mobilePanel === "settings" ? "block" : "hidden", "lg:block")}>
              <SettingsPanel form={form} selectedElement={selectedElement} />
              <div className="rounded-lg border border-slate-800 bg-slate-950/80 p-4">
                <h2 className="text-sm font-semibold text-white">Schema</h2>
                <Separator className="my-3" />
                <pre className="max-h-64 overflow-auto rounded-lg bg-slate-900 p-3 text-xs text-slate-300">
                  {JSON.stringify(
                    {
                      id: form.id,
                      sections: form.layout.sections.length,
                      fields: allFields.map(({ id, type, label, name, required }) => ({ id, type, label, name, required })),
                    },
                    null,
                    2,
                  )}
                </pre>
              </div>
            </div>
          </div>
        </div>
      </main>
    </DndContext>
  );
}
