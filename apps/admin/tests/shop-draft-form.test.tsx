import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { type SaveOutcome, ShopDraftForm } from "../src/editor/ShopDraftForm";

function setup(outcome: SaveOutcome = { ok: true }) {
  const save = vi.fn(async () => outcome);
  render(<ShopDraftForm save={save} />);
  return { save };
}

function type(label: string, value: string) {
  fireEvent.change(screen.getByLabelText(label), { target: { value } });
}

describe("ShopDraftForm", () => {
  it("offers labeled fields and a save button", () => {
    setup();

    expect(screen.getByLabelText("Shop ID")).toBeVisible();
    expect(screen.getByLabelText("Shop name")).toBeVisible();
    expect(screen.getByLabelText("Website (optional)")).toBeVisible();
    expect(screen.getByRole("button", { name: "Save draft" })).toBeEnabled();
  });

  it("submits the entered values and confirms the saved draft", async () => {
    const { save } = setup();

    type("Shop ID", "shop-1");
    type("Shop name", "Bean There");
    type("Website (optional)", "https://bean.example.test");
    fireEvent.click(screen.getByRole("button", { name: "Save draft" }));

    expect(await screen.findByRole("status")).toHaveTextContent("Draft saved.");
    expect(save).toHaveBeenCalledWith({
      id: "shop-1",
      name: "Bean There",
      website: "https://bean.example.test",
    });
  });

  it("shows server field errors linked to their fields and keeps input", async () => {
    setup({
      ok: false,
      errors: { name: "Shop name must not be blank." },
    });

    type("Shop ID", "shop-1");
    fireEvent.click(screen.getByRole("button", { name: "Save draft" }));

    const alert = await screen.findByText("Shop name must not be blank.");
    const field = screen.getByLabelText("Shop name");
    expect(alert).toHaveAttribute("role", "alert");
    expect(field).toHaveAttribute("aria-invalid", "true");
    expect(field).toHaveAttribute("aria-describedby", alert.id);
    expect(screen.getByLabelText("Shop ID")).toHaveValue("shop-1");
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });

  it("shows a form-level failure message", async () => {
    setup({ ok: false, message: "Saving failed. Try again later." });

    fireEvent.click(screen.getByRole("button", { name: "Save draft" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Saving failed. Try again later.",
    );
  });

  it("disables saving while a request is in flight", async () => {
    let finish: (outcome: SaveOutcome) => void = () => undefined;
    const save = vi.fn(
      () =>
        new Promise<SaveOutcome>((resolve) => {
          finish = resolve;
        }),
    );
    render(<ShopDraftForm save={save} />);

    fireEvent.click(screen.getByRole("button", { name: "Save draft" }));

    expect(
      await screen.findByRole("button", { name: "Saving..." }),
    ).toBeDisabled();
    finish({ ok: true });
    await waitFor(() =>
      expect(screen.getByRole("button", { name: "Save draft" })).toBeEnabled(),
    );
  });

  it("warns before leaving with unsaved changes, and not after saving", async () => {
    setup();
    const leave = () => {
      const event = new Event("beforeunload", { cancelable: true });
      window.dispatchEvent(event);
      return event.defaultPrevented;
    };

    expect(leave()).toBe(false);
    type("Shop name", "Bean There");
    expect(leave()).toBe(true);

    fireEvent.click(screen.getByRole("button", { name: "Save draft" }));
    await screen.findByRole("status");
    expect(leave()).toBe(false);
  });
});
