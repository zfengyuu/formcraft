import type { LucideIcon } from "lucide-react";

export const fieldTypes = [
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
] as const;

export type FieldType = (typeof fieldTypes)[number];
export type LegacyFieldType = FieldType | "section";

export type FieldWidth = "full" | "half" | "one-third" | "two-thirds";

export type FieldOption = {
  id: string;
  label: string;
  value: string;
};

export type FieldValidation = {
  minLength?: number;
  maxLength?: number;
  pattern?: string;
  min?: number;
  max?: number;
  step?: number;
  minDate?: string;
  maxDate?: string;
  acceptedFileTypes?: string[];
  maxFileSizeMb?: number;
  message?: string;
};

export type FieldSettings = {
  width?: FieldWidth;
  checkboxLabel?: string;
  defaultChecked?: boolean;
  multipleFiles?: boolean;
  hiddenOnMobile?: boolean;
  [key: string]: unknown;
};

export type FormField = {
  id: string;
  type: FieldType;
  label: string;
  name: string;
  placeholder?: string;
  description?: string;
  required?: boolean;
  disabled?: boolean;
  defaultValue?: unknown;
  visible?: boolean;
  validation?: FieldValidation;
  options?: FieldOption[];
  settings?: FieldSettings;
};

export type LegacyFormField = Omit<FormField, "type" | "settings"> & {
  type: LegacyFieldType;
  width?: FieldWidth;
  settings?: FieldSettings;
};

export type FormColumnSettings = {
  align?: "start" | "center" | "end" | "stretch";
  padding?: "none" | "sm" | "md" | "lg";
  background?: "transparent" | "muted" | "panel";
};

export type FormColumn = {
  id: string;
  type: "column";
  width: number;
  fields: FormField[];
  settings?: FormColumnSettings;
};

export type FormRowSettings = {
  gap?: "sm" | "md" | "lg";
  align?: "start" | "center" | "end" | "stretch";
  stackOnMobile?: boolean;
};

export type FormRow = {
  id: string;
  type: "row";
  columns: FormColumn[];
  settings?: FormRowSettings;
};

export type FormSectionSettings = {
  showTitle?: boolean;
  variant?: "plain" | "panel" | "bordered";
  padding?: "sm" | "md" | "lg";
  collapsible?: boolean;
};

export type FormSection = {
  id: string;
  type: "section";
  title: string;
  description?: string;
  rows: FormRow[];
  settings?: FormSectionSettings;
};

export type FormLayout = {
  sections: FormSection[];
};

export type FormSettings = {
  submitButtonText?: string;
  maxWidth?: "narrow" | "standard" | "wide";
  spacing?: "compact" | "comfortable" | "spacious";
  theme?: "light" | "dark";
};

export type FormSchema = {
  id: string;
  title: string;
  description?: string;
  layout: FormLayout;
  settings: FormSettings;
  createdAt: string;
  updatedAt: string;
};

export type LegacyFormSchema = {
  id: string;
  title: string;
  description?: string;
  fields: LegacyFormField[];
  createdAt: string;
  updatedAt: string;
};

export type SelectedElement =
  | { type: "form"; id: string }
  | { type: "section"; id: string }
  | { type: "row"; id: string }
  | { type: "column"; id: string }
  | { type: "field"; id: string };

export type LayoutPresetId =
  | "one"
  | "two-equal"
  | "three-equal"
  | "four-equal"
  | "one-third-two-thirds"
  | "two-thirds-one-third"
  | "one-fourth-three-fourths"
  | "three-fourths-one-fourth";

export type LayoutPreset = {
  id: LayoutPresetId;
  label: string;
  description: string;
  widths: number[];
};

export type FieldSettingDefinition = {
  key: string;
  label: string;
  type: "text" | "textarea" | "number" | "boolean" | "select" | "options" | "date" | "file-types";
  required?: boolean;
  options?: Array<{
    label: string;
    value: string;
  }>;
};

export type FieldDefinition = {
  type: FieldType;
  label: string;
  icon: LucideIcon;
  defaultField: Partial<FormField>;
  settings: FieldSettingDefinition[];
};
