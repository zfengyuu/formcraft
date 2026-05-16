import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, test, vi } from "vitest";
import { BuilderPage } from "@/features/builder/BuilderPage";
import { useFormBuilderStore } from "@/stores/form-builder-store";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

describe("BuilderPage", () => {
  beforeEach(() => {
    useFormBuilderStore.setState({ forms: [], selectedFormId: null, selectedElement: null });
  });

  test("adds a section, row preset, field and edits field settings", () => {
    const form = useFormBuilderStore.getState().createForm({ title: "Contact" });

    render(<BuilderPage formId={form.id} />);

    fireEvent.click(screen.getByRole("button", { name: /add section/i }));
    fireEvent.click(screen.getByRole("button", { name: /add 2 columns equal/i }));
    fireEvent.click(screen.getByRole("button", { name: /add email/i }));
    fireEvent.change(screen.getByLabelText("Label"), { target: { value: "Work email" } });
    fireEvent.change(screen.getByLabelText("Field name / key"), { target: { value: "workEmail" } });

    const fields = useFormBuilderStore.getState().forms.find((item) => item.id === form.id)?.layout.sections[0]?.rows[0]?.columns[0]?.fields ?? [];
    expect(fields[0]?.type).toBe("email");
    expect(fields[0]?.label).toBe("Work email");
    expect(fields[0]?.name).toBe("workEmail");
  });

  test("outline selects nested elements and settings panel switches by element type", () => {
    const form = useFormBuilderStore.getState().createForm({ title: "Survey" });
    const section = useFormBuilderStore.getState().addSection(form.id, { title: "Questions" });
    const row = useFormBuilderStore.getState().addRow(form.id, section.id, "one");
    useFormBuilderStore.getState().addFieldToColumn(form.id, section.id, row.id, row.columns[0]!.id, "text");

    render(<BuilderPage formId={form.id} />);

    fireEvent.click(screen.getByRole("button", { name: /outline/i }));
    fireEvent.click(screen.getByRole("button", { name: /select section questions/i }));
    expect(screen.getByText("Section Settings")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /select field text input/i }));
    expect(screen.getByText("Field Settings")).toBeInTheDocument();
  });
});
