import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, test, vi } from "vitest";
import { PreviewPage } from "@/features/preview/PreviewPage";
import { useFormBuilderStore } from "@/stores/form-builder-store";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

describe("PreviewPage", () => {
  beforeEach(() => {
    useFormBuilderStore.setState({ forms: [], selectedFormId: null, selectedElement: null });
  });

  test("validates required fields and renders local submission JSON", async () => {
    const form = useFormBuilderStore.getState().createForm({ title: "Contact" });
    const section = useFormBuilderStore.getState().addSection(form.id, { title: "Details" });
    const row = useFormBuilderStore.getState().addRow(form.id, section.id, "two-equal");
    const field = useFormBuilderStore.getState().addFieldToColumn(form.id, section.id, row.id, row.columns[0]!.id, "email");
    useFormBuilderStore.getState().updateField(form.id, field.id, { label: "Work email", name: "workEmail" });

    render(<PreviewPage formId={form.id} />);

    fireEvent.click(screen.getByRole("button", { name: /submit locally/i }));
    expect(await screen.findByText("This field is required")).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("Work email"), { target: { value: "ada@example.com" } });
    fireEvent.click(screen.getByRole("button", { name: /submit locally/i }));

    await waitFor(() => expect(screen.getByText(/"workEmail": "ada@example.com"/)).toBeInTheDocument());
  });
});
