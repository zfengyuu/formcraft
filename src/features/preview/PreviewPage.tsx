"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, Clipboard, Code2, RotateCcw, Send, Wrench } from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { fieldDefinitions, isInputField } from "@/lib/field-definitions";
import { generateZodSchema } from "@/lib/generate-zod-schema";
import { getAllFields } from "@/lib/get-all-fields";
import { cn } from "@/lib/utils";
import { useFormBuilderStore } from "@/stores/form-builder-store";
import type { FormColumn, FormField, FormSchema } from "@/types/form";

type SubmissionValues = Record<string, unknown>;

function widthClass(field: FormField) {
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

function defaultValuesFor(form: FormSchema): SubmissionValues {
  return getAllFields(form).reduce<SubmissionValues>((values, field) => {
    if (!isInputField(field)) {
      return values;
    }

    if (field.type === "checkbox") {
      values[field.name] = field.settings?.defaultChecked ?? field.defaultValue ?? false;
    } else if (field.type === "switch") {
      values[field.name] = field.defaultValue ?? false;
    } else {
      values[field.name] = field.defaultValue ?? "";
    }

    return values;
  }, {});
}

function serializeSubmission(values: SubmissionValues, fields: FormField[]) {
  const next: SubmissionValues = {};

  for (const field of fields) {
    if (!isInputField(field)) {
      continue;
    }

    const value = values[field.name];
    if (field.type === "file" && value instanceof FileList) {
      next[field.name] = Array.from(value).map((file) => file.name);
    } else {
      next[field.name] = value;
    }
  }

  return next;
}

function FieldError({ message }: { message?: unknown }) {
  if (!message || typeof message !== "string") {
    return null;
  }

  return <p className="text-xs text-rose-600">{message}</p>;
}

function PreviewField({
  field,
  error,
  register,
}: {
  field: FormField;
  error?: unknown;
  register: ReturnType<typeof useForm<SubmissionValues>>["register"];
}) {
  const definition = fieldDefinitions[field.type];

  if (field.visible === false) {
    return null;
  }

  if (field.type === "sectionTitle") {
    return (
      <div className={cn("space-y-1", widthClass(field))}>
        <h3 className="text-lg font-semibold text-slate-950">{field.label}</h3>
        {field.description ? <p className="text-sm text-slate-500">{field.description}</p> : null}
      </div>
    );
  }

  if (field.type === "divider") {
    return (
      <div className={cn(widthClass(field))}>
        <Separator className="bg-slate-200" />
      </div>
    );
  }

  if (field.type === "checkbox" || field.type === "switch") {
    return (
      <div className={cn("space-y-2", widthClass(field))}>
        <label className="flex items-start gap-3 rounded-lg border border-slate-200 bg-white p-3">
          <input type="checkbox" className="mt-1 size-4 accent-teal-500" disabled={field.disabled} {...register(field.name)} />
          <span>
            <span className="block text-sm font-medium text-slate-950">
              {field.type === "checkbox" ? String(field.settings?.checkboxLabel ?? field.label) : field.label}
              {field.required ? <span className="text-rose-600"> *</span> : null}
            </span>
            {field.description ? <span className="block text-xs text-slate-500">{field.description}</span> : null}
          </span>
        </label>
        <FieldError message={error} />
      </div>
    );
  }

  const commonProps = {
    id: field.name,
    "aria-label": field.label,
    disabled: field.disabled,
    placeholder: field.placeholder,
    ...register(field.name),
  };

  return (
    <div className={cn("space-y-1.5", widthClass(field))}>
      <Label htmlFor={field.name} className="text-slate-700">
        {field.label}
        {field.required ? <span className="text-rose-600"> *</span> : null}
      </Label>
      {field.type === "textarea" ? (
        <Textarea className="border-slate-300 bg-white text-slate-950" {...commonProps} />
      ) : field.type === "select" ? (
        <Select className="border-slate-300 bg-white text-slate-950" {...commonProps}>
          <option value="">{field.placeholder || "Select an option"}</option>
          {field.options?.map((option) => (
            <option key={option.id} value={option.value}>
              {option.label}
            </option>
          ))}
        </Select>
      ) : field.type === "radio" ? (
        <div className="space-y-2 rounded-lg border border-slate-200 bg-white p-3">
          {field.options?.map((option) => (
            <label key={option.id} className="flex items-center gap-2 text-sm text-slate-700">
              <input type="radio" value={option.value} className="accent-teal-500" disabled={field.disabled} {...register(field.name)} />
              {option.label}
            </label>
          ))}
        </div>
      ) : field.type === "file" ? (
        <Input
          className="border-slate-300 bg-white text-slate-950 file:mr-3 file:rounded-md file:border-0 file:bg-slate-100 file:px-3 file:py-1 file:text-sm"
          type="file"
          accept={field.validation?.acceptedFileTypes?.join(",")}
          multiple={Boolean(field.settings?.multipleFiles)}
          {...commonProps}
        />
      ) : (
        <Input
          className="border-slate-300 bg-white text-slate-950"
          type={
            field.type === "email"
              ? "email"
              : field.type === "password"
                ? "password"
                : field.type === "number"
                  ? "number"
                  : field.type === "date"
                    ? "date"
                    : "text"
          }
          min={field.validation?.min ?? field.validation?.minDate}
          max={field.validation?.max ?? field.validation?.maxDate}
          step={field.validation?.step}
          {...commonProps}
        />
      )}
      {field.description ? <p className="text-xs text-slate-500">{field.description}</p> : null}
      <FieldError message={error} />
      <p className="flex items-center gap-1 text-[11px] text-slate-400">
        <definition.icon className="size-3" />
        {definition.label}
      </p>
    </div>
  );
}

function PreviewColumn({
  column,
  errors,
  register,
}: {
  column: FormColumn;
  errors: ReturnType<typeof useForm<SubmissionValues>>["formState"]["errors"];
  register: ReturnType<typeof useForm<SubmissionValues>>["register"];
}) {
  return (
    <div className="min-w-0" style={{ flex: `1 1 ${column.width}%`, maxWidth: `${column.width}%` }}>
      <div className="grid gap-4 md:grid-cols-12">
        {column.fields.map((field) => (
          <PreviewField key={field.id} field={field} register={register} error={errors[field.name]?.message} />
        ))}
      </div>
    </div>
  );
}

export function PreviewPage({ formId }: { formId: string }) {
  const form = useFormBuilderStore((state) => state.forms.find((item) => item.id === formId) ?? null);
  const hydrateLegacyForms = useFormBuilderStore((state) => state.hydrateLegacyForms);
  const [submissionJson, setSubmissionJson] = useState("");
  const allFields = useMemo(() => getAllFields(form), [form]);
  const schema = useMemo(() => (form ? generateZodSchema(form) : generateZodSchema([])), [form]);
  const defaultValues = useMemo(() => (form ? defaultValuesFor(form) : {}), [form]);
  const {
    formState: { errors },
    handleSubmit,
    register,
    reset,
  } = useForm<SubmissionValues>({
    resolver: zodResolver(schema),
    defaultValues,
  });

  useEffect(() => {
    hydrateLegacyForms();
  }, [hydrateLegacyForms]);

  useEffect(() => {
    reset(defaultValues);
  }, [defaultValues, reset]);

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

  const submit = (values: SubmissionValues) => {
    const json = JSON.stringify(serializeSubmission(values, allFields), null, 2);
    setSubmissionJson(json);
    toast.success("Submitted locally");
  };

  return (
    <main className="min-h-screen bg-[#071012] p-4 text-slate-100 md:p-6">
      <div className="mx-auto flex max-w-6xl flex-col gap-4">
        <header className="flex flex-col gap-3 rounded-lg border border-slate-800 bg-slate-950/80 p-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3">
            <Button asChild variant="ghost" size="icon" aria-label="Back to dashboard">
              <Link href="/">
                <ArrowLeft />
              </Link>
            </Button>
            <div>
              <div className="text-xs text-slate-500">FormCraft / Preview</div>
              <h1 className="text-xl font-semibold text-white">{form.title}</h1>
              {form.description ? <p className="text-sm text-slate-400">{form.description}</p> : null}
            </div>
          </div>
          <div className="flex gap-2">
            <Button asChild variant="outline">
              <Link href={`/forms/${form.id}/builder`}>
                <Wrench />
                Builder
              </Link>
            </Button>
            <Badge tone="teal">{allFields.filter(isInputField).length} inputs</Badge>
          </div>
        </header>

        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_380px]">
          <form onSubmit={handleSubmit(submit)} className="rounded-lg border border-slate-800 bg-[#f8faf9] p-5 text-slate-950">
            <div className="mb-5">
              <h2 className="text-lg font-semibold">{form.title}</h2>
              <p className="text-sm text-slate-500">Fill this local preview and submit to inspect the JSON payload.</p>
            </div>
            <div className="space-y-5">
              {form.layout.sections.map((section) => (
                <section key={section.id} className="space-y-4">
                  {section.settings?.showTitle !== false ? (
                    <div>
                      <h3 className="text-base font-semibold">{section.title}</h3>
                      {section.description ? <p className="text-sm text-slate-500">{section.description}</p> : null}
                    </div>
                  ) : null}
                  {section.rows.map((row) => (
                    <div key={row.id} className="flex flex-col gap-4 md:flex-row">
                      {row.columns.map((column) => (
                        <PreviewColumn key={column.id} column={column} errors={errors} register={register} />
                      ))}
                    </div>
                  ))}
                </section>
              ))}
            </div>
            <div className="mt-6 flex flex-wrap gap-2 border-t border-slate-200 pt-4">
              <Button type="submit">
                <Send />
                Submit locally
              </Button>
              <Button
                type="button"
                variant="outline"
                className="border-slate-300 text-slate-700 hover:bg-slate-100"
                onClick={() => {
                  reset(defaultValues);
                  setSubmissionJson("");
                }}
              >
                <RotateCcw />
                Reset
              </Button>
            </div>
          </form>

          <aside className="rounded-lg border border-slate-800 bg-slate-950/80 p-4">
            <div className="mb-3 flex items-center justify-between gap-2">
              <div>
                <h2 className="flex items-center gap-2 text-sm font-semibold text-white">
                  <Code2 className="size-4 text-teal-300" />
                  Submitted JSON
                </h2>
                <p className="text-xs text-slate-500">Temporary local output only.</p>
              </div>
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={!submissionJson}
                onClick={() => {
                  void navigator.clipboard?.writeText(submissionJson);
                  toast.success("Copied JSON");
                }}
              >
                <Clipboard />
                Copy JSON
              </Button>
            </div>
            <pre className="min-h-96 overflow-auto rounded-lg border border-slate-800 bg-slate-900 p-3 text-xs text-slate-200">
              {submissionJson || "{\n  \"status\": \"No local submission yet\"\n}"}
            </pre>
          </aside>
        </div>
      </div>
    </main>
  );
}
