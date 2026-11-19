import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { SaveOutcome } from "../src/editor/draft-request";
import { LocationDraftForm } from "../src/editor/LocationDraftForm";

const shops = [
  { id: "s1", name: "Bean There" },
  { id: "s2", name: "Roast Co" },
];

function setup(outcome: SaveOutcome = { ok: true }, initialValues?: object) {
  const save = vi.fn(async () => outcome);
  render(
    <LocationDraftForm
      save={save}
      shops={shops}
      initialValues={initialValues as never}
    />,
  );
  return { save };
}

function type(label: string, value: string) {
  fireEvent.change(screen.getByLabelText(label), { target: { value } });
}

describe("LocationDraftForm", () => {
  it("offers labeled fields including the four location types", () => {
    setup();

    expect(screen.getByLabelText("Shop")).toBeVisible();
    const types = screen.getByLabelText("Type");
    expect(
      Array.from(types.querySelectorAll("option")).map((o) => o.value),
    ).toEqual(["cafe", "bakery", "mobile coffee", "coffee roaster"]);
    for (const label of [
      "Street address",
      "Street address line 2",
      "Postal code",
      "Latitude",
      "Longitude",
      "Location website",
    ]) {
      expect(screen.getByLabelText(label)).toBeVisible();
    }
    expect(screen.getByText("* Required field")).toBeVisible();
    expect(screen.getByLabelText("Shop")).toBeRequired();
    expect(screen.getByLabelText("Type")).toBeRequired();
    expect(screen.getByLabelText("Street address")).not.toBeRequired();
    expect(screen.queryByLabelText(/region|city|id/i)).not.toBeInTheDocument();
  });

  it("submits the entered values and confirms the saved draft", async () => {
    const { save } = setup();

    type("Shop", "s2");
    type("Type", "bakery");
    type("Street address", "1 Main St");
    type("Latitude", "35.2");
    type("Longitude", "-80.8");
    fireEvent.click(screen.getByRole("button", { name: "Save location" }));

    expect(await screen.findByRole("status")).toHaveTextContent(
      "Location saved.",
    );
    expect(save).toHaveBeenCalledWith({
      shopId: "s2",
      type: "bakery",
      streetLine1: "1 Main St",
      streetLine2: "",
      postalCode: "",
      latitude: "35.2",
      longitude: "-80.8",
      website: "",
    });
  });

  it("prefills when editing", () => {
    setup(
      { ok: true },
      {
        shopId: "s1",
        type: "coffee roaster",
        streetLine1: "9 Oak",
        streetLine2: "",
        postalCode: "28203",
        latitude: "",
        longitude: "",
        website: "",
      },
    );

    expect(screen.getByLabelText("Shop")).toHaveValue("s1");
    expect(screen.getByLabelText("Type")).toHaveValue("coffee roaster");
    expect(screen.getByLabelText("Street address")).toHaveValue("9 Oak");
  });

  it("links server field errors to their fields", async () => {
    setup({ ok: false, errors: { latitude: "Latitude is out of range." } });

    fireEvent.click(screen.getByRole("button", { name: "Save location" }));

    const alert = await screen.findByText("Latitude is out of range.");
    const field = screen.getByLabelText("Latitude");
    expect(alert).toHaveAttribute("role", "alert");
    expect(field).toHaveAttribute("aria-invalid", "true");
    expect(field).toHaveAttribute("aria-describedby", alert.id);
  });

  it("shows form-level failures and warns on unsaved changes", async () => {
    setup({ ok: false, message: "Saving is unavailable right now." });

    type("Street address", "x");
    const event = new Event("beforeunload", { cancelable: true });
    window.dispatchEvent(event);
    expect(event.defaultPrevented).toBe(true);

    fireEvent.click(screen.getByRole("button", { name: "Save location" }));
    await waitFor(() =>
      expect(screen.getByRole("alert")).toHaveTextContent(
        "Saving is unavailable right now.",
      ),
    );
  });
});
