import {
  AlignLeft,
  CalendarDays,
  CheckSquare,
  CircleDot,
  FileUp,
  Hash,
  Heading,
  KeyRound,
  ListChecks,
  Mail,
  Minus,
  Phone,
  ToggleRight,
  Type,
} from "lucide-react";
import { createId, toFieldName, uniqueFieldName } from "@/lib/utils";
import type { FieldDefinition, FieldSettingDefinition, FieldType, FormField } from "@/types/form";
import { fieldTypes } from "@/types/form";

const widthOptions = [
  { label: "Full width", value: "full" },
  { label: "Half width", value: "half" },
  { label: "One third", value: "one-third" },
  { label: "Two thirds", value: "two-thirds" },
];

const commonSettings: FieldSettingDefinition[] = [
  { key: "label", label: "Label", type: "text", required: true },
  { key: "name", label: "Field name / key", type: "text", required: true },
  { key: "placeholder", label: "Placeholder", type: "text" },
  { key: "description", label: "Description / helper text", type: "textarea" },
  { key: "required", label: "Required", type: "boolean" },
  { key: "disabled", label: "Disabled", type: "boolean" },
  { key: "defaultValue", label: "Default value", type: "text" },
  { key: "width", label: "Width", type: "select", options: widthOptions },
  { key: "visible", label: "Visible", type: "boolean" },
  { key: "validation.message", label: "Validation message", type: "text" },
];

const textValidationSettings: FieldSettingDefinition[] = [
  { key: "validation.minLength", label: "Min length", type: "number" },
  { key: "validation.maxLength", label: "Max length", type: "number" },
  { key: "validation.pattern", label: "Pattern / regex", type: "text" },
];

const numberValidationSettings: FieldSettingDefinition[] = [
  { key: "validation.min", label: "Min value", type: "number" },
  { key: "validation.max", label: "Max value", type: "number" },
  { key: "validation.step", label: "Step", type: "number" },
];

const dateValidationSettings: FieldSettingDefinition[] = [
  { key: "validation.minDate", label: "Min date", type: "date" },
  { key: "validation.maxDate", label: "Max date", type: "date" },
  { key: "defaultValue", label: "Default date", type: "date" },
];

const optionSettings: FieldSettingDefinition[] = [
  { key: "options", label: "Options", type: "options", required: true },
  { key: "defaultValue", label: "Default selected option", type: "text" },
];

const fileSettings: FieldSettingDefinition[] = [
  { key: "validation.acceptedFileTypes", label: "Accepted file types", type: "file-types" },
  { key: "validation.maxFileSizeMb", label: "Max file size (MB)", type: "number" },
  { key: "settings.multipleFiles", label: "Multiple files", type: "boolean" },
];

function option(id: string, label: string, value: string) {
  return { id, label, value };
}

export const fieldDefinitions: Record<FieldType, FieldDefinition> = {
  text: {
    type: "text",
    label: "Text Input",
    icon: Type,
    defaultField: { label: "Text Input", name: "textInput", placeholder: "Enter text", settings: { width: "full" }, visible: true },
    settings: [...commonSettings, ...textValidationSettings],
  },
  textarea: {
    type: "textarea",
    label: "Textarea",
    icon: AlignLeft,
    defaultField: { label: "Message", name: "message", placeholder: "Write a response", settings: { width: "full" }, visible: true },
    settings: [...commonSettings, ...textValidationSettings],
  },
  email: {
    type: "email",
    label: "Email",
    icon: Mail,
    defaultField: {
      label: "Email address",
      name: "emailAddress",
      placeholder: "name@example.com",
      required: true,
      settings: { width: "full" },
      visible: true,
    },
    settings: [...commonSettings],
  },
  number: {
    type: "number",
    label: "Number",
    icon: Hash,
    defaultField: { label: "Number", name: "number", placeholder: "0", settings: { width: "full" }, visible: true },
    settings: [...commonSettings, ...numberValidationSettings],
  },
  phone: {
    type: "phone",
    label: "Phone",
    icon: Phone,
    defaultField: { label: "Phone number", name: "phoneNumber", placeholder: "+1 555 000 0000", settings: { width: "full" }, visible: true },
    settings: [...commonSettings, ...textValidationSettings],
  },
  password: {
    type: "password",
    label: "Password",
    icon: KeyRound,
    defaultField: { label: "Password", name: "password", placeholder: "Enter password", settings: { width: "full" }, visible: true },
    settings: [...commonSettings, ...textValidationSettings],
  },
  select: {
    type: "select",
    label: "Select",
    icon: ListChecks,
    defaultField: {
      label: "Select an option",
      name: "selectOption",
      placeholder: "Choose one",
      settings: { width: "full" },
      visible: true,
      options: [option("option_1", "Option 1", "option-1"), option("option_2", "Option 2", "option-2")],
    },
    settings: [...commonSettings, ...optionSettings],
  },
  radio: {
    type: "radio",
    label: "Radio Group",
    icon: CircleDot,
    defaultField: {
      label: "Choose one",
      name: "radioChoice",
      settings: { width: "full" },
      visible: true,
      options: [option("option_1", "Option 1", "option-1"), option("option_2", "Option 2", "option-2")],
    },
    settings: [...commonSettings, ...optionSettings],
  },
  checkbox: {
    type: "checkbox",
    label: "Checkbox",
    icon: CheckSquare,
    defaultField: {
      label: "I agree",
      name: "agreement",
      settings: { width: "full", checkboxLabel: "I agree to the terms", defaultChecked: false },
      visible: true,
    },
    settings: [
      ...commonSettings,
      { key: "settings.checkboxLabel", label: "Checkbox label", type: "text" },
      { key: "settings.defaultChecked", label: "Default checked", type: "boolean" },
    ],
  },
  date: {
    type: "date",
    label: "Date Picker",
    icon: CalendarDays,
    defaultField: { label: "Date", name: "date", settings: { width: "full" }, visible: true },
    settings: [...commonSettings, ...dateValidationSettings],
  },
  switch: {
    type: "switch",
    label: "Switch",
    icon: ToggleRight,
    defaultField: { label: "Enable option", name: "enableOption", settings: { width: "full" }, visible: true, defaultValue: false },
    settings: [...commonSettings, { key: "defaultValue", label: "Default enabled", type: "boolean" }],
  },
  file: {
    type: "file",
    label: "File Upload",
    icon: FileUp,
    defaultField: { label: "Upload file", name: "uploadFile", settings: { width: "full" }, visible: true },
    settings: [...commonSettings, ...fileSettings],
  },
  sectionTitle: {
    type: "sectionTitle",
    label: "Section Title",
    icon: Heading,
    defaultField: {
      label: "Section title",
      name: "sectionTitle",
      description: "Group related fields",
      settings: { width: "full" },
      visible: true,
    },
    settings: [
      { key: "label", label: "Title", type: "text", required: true },
      { key: "name", label: "Field name / key", type: "text", required: true },
      { key: "description", label: "Description", type: "textarea" },
      { key: "width", label: "Width", type: "select", options: widthOptions },
      { key: "visible", label: "Visible", type: "boolean" },
    ],
  },
  divider: {
    type: "divider",
    label: "Divider",
    icon: Minus,
    defaultField: { label: "Divider", name: "divider", settings: { width: "full" }, visible: true },
    settings: [
      { key: "label", label: "Label", type: "text", required: true },
      { key: "name", label: "Field name / key", type: "text", required: true },
      { key: "width", label: "Width", type: "select", options: widthOptions },
      { key: "visible", label: "Visible", type: "boolean" },
    ],
  },
};

export { fieldTypes };

export function createFieldFromType(type: FieldType, existingFields: FormField[]): FormField {
  const definition = fieldDefinitions[type];
  const baseName = definition.defaultField.name ?? toFieldName(definition.defaultField.label ?? definition.label);

  return {
    id: createId("field"),
    type,
    label: definition.defaultField.label ?? definition.label,
    name: uniqueFieldName(
      baseName,
      existingFields.map((field) => field.name),
    ),
    placeholder: definition.defaultField.placeholder,
    description: definition.defaultField.description,
    required: definition.defaultField.required ?? false,
    disabled: definition.defaultField.disabled ?? false,
    defaultValue: definition.defaultField.defaultValue,
    visible: definition.defaultField.visible ?? true,
    validation: definition.defaultField.validation ? { ...definition.defaultField.validation } : undefined,
    options: definition.defaultField.options?.map((item) => ({ ...item })),
    settings: { width: "full", ...(definition.defaultField.settings ?? {}) },
  };
}

export function getFieldDefinition(type: FieldType) {
  return fieldDefinitions[type];
}

export function isInputField(field: FormField) {
  return field.type !== "sectionTitle" && field.type !== "divider" && field.visible !== false;
}
