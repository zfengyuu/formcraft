import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, test, vi } from "vitest";
import { Dashboard } from "@/features/dashboard/Dashboard";
import { useFormBuilderStore } from "@/stores/form-builder-store";

const push = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push }),
}));

describe("Dashboard", () => {
  beforeEach(() => {
    push.mockReset();
    useFormBuilderStore.setState({ forms: [], selectedFormId: null, selectedElement: null });
  });

  test("creates a form and navigates to the builder", () => {
    render(<Dashboard />);

    fireEvent.click(screen.getByRole("button", { name: /create form/i }));

    const form = useFormBuilderStore.getState().forms[0];
    expect(form.title).toBe("Untitled form");
    expect(push).toHaveBeenCalledWith(`/forms/${form.id}/builder`);
  });

  test("shows saved form cards with duplicate and delete actions", () => {
    const form = useFormBuilderStore.getState().createForm({ title: "Contact", description: "Lead intake" });
    const section = useFormBuilderStore.getState().addSection(form.id, { title: "Main" });
    const row = useFormBuilderStore.getState().addRow(form.id, section.id, "one");
    useFormBuilderStore.getState().addFieldToColumn(form.id, section.id, row.id, row.columns[0]!.id, "email");

    render(<Dashboard />);

    expect(screen.getByText("Contact")).toBeInTheDocument();
    expect(screen.getByText("Lead intake")).toBeInTheDocument();
    expect(screen.getByText("1 field")).toBeInTheDocument();
    expect(screen.getByText("1 section")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /duplicate contact/i }));
    expect(useFormBuilderStore.getState().forms).toHaveLength(2);

    fireEvent.click(screen.getByRole("button", { name: /delete contact/i }));
    expect(useFormBuilderStore.getState().forms.some((item) => item.id === form.id)).toBe(false);
  });

  test("creates a populated template form", () => {
    render(<Dashboard />);

    fireEvent.click(screen.getByRole("button", { name: /use contact form template/i }));

    const form = useFormBuilderStore.getState().forms[0];
    expect(form.title).toBe("Contact Form");
    expect(form.layout.sections.length).toBeGreaterThan(0);
    expect(push).toHaveBeenCalledWith(`/forms/${form.id}/builder`);
  });
});
