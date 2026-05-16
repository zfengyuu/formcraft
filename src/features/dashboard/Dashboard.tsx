"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Copy, Download, Eye, FileJson, FolderOpen, Import, LayoutTemplate, Pencil, Plus, Search, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getAllFields } from "@/lib/get-all-fields";
import { formTemplates, type FormTemplateId } from "@/lib/templates";
import { formatUpdatedAt } from "@/lib/utils";
import { useFormBuilderStore } from "@/stores/form-builder-store";

function downloadJson(filename: string, json: string) {
  const blob = new Blob([json], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

export function Dashboard() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { createForm, createFormFromTemplate, deleteForm, duplicateForm, exportForm, forms, hydrateLegacyForms, importForm, updateForm } =
    useFormBuilderStore();
  const [query, setQuery] = useState("");

  useEffect(() => {
    hydrateLegacyForms();
  }, [hydrateLegacyForms]);

  const visibleForms = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) {
      return forms;
    }

    return forms.filter(
      (form) =>
        form.title.toLowerCase().includes(normalized) ||
        form.description?.toLowerCase().includes(normalized) ||
        getAllFields(form).some((field) => field.label.toLowerCase().includes(normalized)) ||
        form.layout.sections.some((section) => section.title.toLowerCase().includes(normalized)),
    );
  }, [forms, query]);

  const handleCreate = () => {
    const form = createForm();
    router.push(`/forms/${form.id}/builder`);
  };

  const handleTemplate = (templateId: FormTemplateId) => {
    const form = createFormFromTemplate(templateId);
    toast.success(`Created ${form.title}`);
    router.push(`/forms/${form.id}/builder`);
  };

  const handleImport = async (file: File | undefined) => {
    if (!file) {
      return;
    }

    try {
      const form = importForm(await file.text());
      toast.success(`Imported ${form.title}`);
      router.push(`/forms/${form.id}/builder`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not import form");
    } finally {
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  return (
    <main className="min-h-screen bg-[#071012] px-4 py-5 text-slate-100 md:px-6">
      <div className="mx-auto flex max-w-7xl flex-col gap-5">
        <header className="flex flex-col gap-4 rounded-lg border border-slate-800 bg-slate-950/70 p-4 shadow-2xl shadow-black/20 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-lg bg-teal-400/15 text-teal-300">
              <FileJson className="size-5" />
            </div>
            <div>
              <h1 className="text-xl font-semibold text-white">FormCraft</h1>
              <p className="text-sm text-slate-400">Local-first form schemas, builders, and previews</p>
            </div>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row">
            <input
              ref={fileInputRef}
              className="hidden"
              type="file"
              accept="application/json,.json"
              onChange={(event) => void handleImport(event.target.files?.[0])}
            />
            <Button variant="outline" onClick={() => fileInputRef.current?.click()}>
              <Import />
              Import form
            </Button>
            <Button onClick={handleCreate}>
              <Plus />
              Create form
            </Button>
          </div>
        </header>

        <section className="flex flex-col gap-3 rounded-lg border border-slate-800 bg-[#f8faf9] p-4 text-slate-950 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-base font-semibold">Saved forms</h2>
            <p className="text-sm text-slate-600">
              {forms.length === 0 ? "No local schemas yet" : `${forms.length} local ${forms.length === 1 ? "schema" : "schemas"}`}
            </p>
          </div>
          <div className="relative w-full md:w-80">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-500" />
            <Input
              className="border-slate-300 bg-white pl-9 text-slate-950 placeholder:text-slate-500 focus:border-teal-500"
              placeholder="Search forms"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
          </div>
        </section>

        <section className="rounded-lg border border-slate-800 bg-slate-950/70 p-4">
          <div className="mb-3 flex items-center gap-2">
            <LayoutTemplate className="size-4 text-teal-300" />
            <h2 className="text-sm font-semibold text-white">Templates</h2>
          </div>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
            {formTemplates.map((template) => (
              <button
                key={template.id}
                type="button"
                aria-label={`Use ${template.title} template`}
                className="min-h-24 rounded-lg border border-slate-800 bg-slate-900/70 p-3 text-left transition hover:border-teal-400/60 hover:bg-slate-900"
                onClick={() => handleTemplate(template.id)}
              >
                <span className="block text-sm font-medium text-white">{template.title}</span>
                <span className="mt-1 line-clamp-2 block text-xs text-slate-500">{template.description}</span>
              </button>
            ))}
          </div>
        </section>

        {visibleForms.length === 0 ? (
          <section className="flex min-h-96 flex-col items-center justify-center rounded-lg border border-dashed border-slate-700 bg-slate-950/60 p-8 text-center">
            <FolderOpen className="mb-4 size-10 text-teal-300" />
            <h2 className="text-xl font-semibold text-white">Start building your form</h2>
            <p className="mt-2 max-w-md text-sm text-slate-400">
              Create a local schema or import JSON to open the visual builder.
            </p>
            <Button className="mt-5" onClick={handleCreate}>
              <Plus />
              Create first form
            </Button>
          </section>
        ) : (
          <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {visibleForms.map((form) => {
              const fieldCount = getAllFields(form).length;
              const sectionCount = form.layout.sections.length;
              const fieldLabel = `${fieldCount} ${fieldCount === 1 ? "field" : "fields"}`;
              const sectionLabel = `${sectionCount} ${sectionCount === 1 ? "section" : "sections"}`;
              return (
                <article
                  key={form.id}
                  className="flex min-h-64 flex-col justify-between rounded-lg border border-slate-800 bg-slate-950/80 p-4 shadow-xl shadow-black/20"
                >
                  <div>
                    <div className="mb-3 flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <h3 className="truncate text-lg font-semibold text-white">{form.title}</h3>
                        <p className="mt-1 line-clamp-2 text-sm text-slate-400">{form.description || "No description"}</p>
                      </div>
                      <div className="flex shrink-0 flex-col gap-1">
                        <Badge tone="teal">{fieldLabel}</Badge>
                        <Badge>{sectionLabel}</Badge>
                      </div>
                    </div>
                    <div className="rounded-lg border border-slate-800 bg-slate-900/70 p-3 text-xs text-slate-400">
                      Last updated <span className="text-slate-200">{formatUpdatedAt(form.updatedAt)}</span>
                    </div>
                  </div>

                  <div className="mt-5 grid grid-cols-2 gap-2">
                    <Button asChild variant="secondary">
                      <Link href={`/forms/${form.id}/builder`}>
                        <Pencil />
                        Builder
                      </Link>
                    </Button>
                    <Button asChild variant="outline">
                      <Link href={`/forms/${form.id}/preview`}>
                        <Eye />
                        Preview
                      </Link>
                    </Button>
                    <Button
                      variant="outline"
                      aria-label={`Duplicate ${form.title}`}
                      onClick={() => {
                        duplicateForm(form.id);
                        toast.success("Form duplicated");
                      }}
                    >
                      <Copy />
                      Duplicate
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => downloadJson(`${form.title.replace(/\s+/g, "-").toLowerCase() || "form"}.json`, exportForm(form.id))}
                    >
                      <Download />
                      Export
                    </Button>
                    <Button
                      variant="outline"
                      className="col-span-1"
                      onClick={() => {
                        const title = window.prompt("Rename form", form.title);
                        if (title?.trim()) {
                          updateForm(form.id, { title: title.trim() });
                        }
                      }}
                    >
                      <Pencil />
                      Rename
                    </Button>
                    <Button
                      variant="destructive"
                      aria-label={form.title.endsWith(" Copy") ? `Delete copied form ${form.title}` : `Delete ${form.title}`}
                      onClick={() => {
                        deleteForm(form.id);
                        toast.success("Form deleted");
                      }}
                    >
                      <Trash2 />
                      Delete
                    </Button>
                  </div>
                </article>
              );
            })}
          </section>
        )}
      </div>
    </main>
  );
}
