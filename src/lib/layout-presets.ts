import { createId } from "@/lib/utils";
import type { FormColumn, FormRow, LayoutPreset, LayoutPresetId } from "@/types/form";

export const layoutPresets: LayoutPreset[] = [
  { id: "one", label: "1 column", description: "One full-width column", widths: [100] },
  { id: "two-equal", label: "2 columns equal", description: "Two equal columns", widths: [50, 50] },
  { id: "three-equal", label: "3 columns equal", description: "Three equal columns", widths: [33.34, 33.33, 33.33] },
  { id: "four-equal", label: "4 columns equal", description: "Four equal columns", widths: [25, 25, 25, 25] },
  { id: "one-third-two-thirds", label: "1/3 + 2/3", description: "Narrow column followed by wide column", widths: [33.33, 66.67] },
  { id: "two-thirds-one-third", label: "2/3 + 1/3", description: "Wide column followed by narrow column", widths: [66.67, 33.33] },
  { id: "one-fourth-three-fourths", label: "1/4 + 3/4", description: "Quarter column followed by three-quarter column", widths: [25, 75] },
  { id: "three-fourths-one-fourth", label: "3/4 + 1/4", description: "Three-quarter column followed by quarter column", widths: [75, 25] },
];

export function getLayoutPreset(id: LayoutPresetId) {
  return layoutPresets.find((preset) => preset.id === id) ?? layoutPresets[0]!;
}

function roundWidths(widths: number[]) {
  const rounded = widths.map((width) => Number(width.toFixed(2)));
  const delta = Number((100 - rounded.reduce((sum, width) => sum + width, 0)).toFixed(2));
  rounded[rounded.length - 1] = Number(((rounded.at(-1) ?? 0) + delta).toFixed(2));
  return rounded;
}

export function normalizeColumnWidths(widths: number[]) {
  if (widths.length === 0) {
    return [];
  }

  const total = widths.reduce((sum, width) => sum + width, 0);
  if (total <= 0) {
    return roundWidths(widths.map(() => 100 / widths.length));
  }

  return roundWidths(widths.map((width) => (width / total) * 100));
}

export function resizeColumns(widths: number[], leftIndex: number, requestedLeftWidth: number) {
  const next = [...widths];
  const rightIndex = leftIndex + 1;
  if (leftIndex < 0 || rightIndex >= widths.length) {
    return normalizeColumnWidths(next);
  }

  const pairTotal = widths[leftIndex]! + widths[rightIndex]!;
  const minLeft = Math.max(20, pairTotal - 80);
  const maxLeft = Math.min(80, pairTotal - 20);
  const leftWidth = Math.min(maxLeft, Math.max(minLeft, requestedLeftWidth));

  next[leftIndex] = Number(leftWidth.toFixed(2));
  next[rightIndex] = Number((pairTotal - leftWidth).toFixed(2));

  return roundWidths(next);
}

export function createColumnsFromWidths(widths: number[], existingColumns: FormColumn[] = []): FormColumn[] {
  const normalized = normalizeColumnWidths(widths);
  const fields = existingColumns.flatMap((column) => column.fields);

  return normalized.map((width, index) => ({
    id: existingColumns[index]?.id ?? createId("column"),
    type: "column",
    width,
    fields: index === 0 ? fields : [],
    settings: existingColumns[index]?.settings ? { ...existingColumns[index]!.settings } : { align: "stretch", padding: "none" },
  }));
}

export function createRowFromPreset(presetId: LayoutPresetId): FormRow {
  const preset = getLayoutPreset(presetId);
  return {
    id: createId("row"),
    type: "row",
    columns: createColumnsFromWidths(preset.widths),
    settings: {
      gap: "md",
      align: "stretch",
      stackOnMobile: true,
    },
  };
}
