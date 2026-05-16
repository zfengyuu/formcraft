import { describe, expect, test } from "vitest";
import { createRowFromPreset, layoutPresets, resizeColumns } from "@/lib/layout-presets";

describe("layout presets", () => {
  test("creates rows whose column widths sum to 100", () => {
    for (const preset of layoutPresets) {
      const row = createRowFromPreset(preset.id);
      expect(row.columns.reduce((sum, column) => sum + column.width, 0)).toBe(100);
      expect(row.columns.every((column) => column.fields.length === 0)).toBe(true);
    }
  });

  test("resizes adjacent columns while clamping widths between 20 and 80", () => {
    expect(resizeColumns([50, 50], 0, 35)).toEqual([35, 65]);
    expect(resizeColumns([50, 50], 0, 5)).toEqual([20, 80]);
    expect(resizeColumns([50, 50], 0, 95)).toEqual([80, 20]);
  });
});
