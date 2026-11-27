import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { PhotoUploadOutcome } from "../src/editor/photo-upload-client";
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

    expect(screen.queryByLabelText("Shop ID")).not.toBeInTheDocument();
    expect(screen.getByLabelText("Shop name")).toBeVisible();
    expect(screen.getByLabelText("Website")).toBeVisible();
    expect(screen.getByText("* Required field")).toBeVisible();
    expect(screen.getByLabelText("Shop name")).toBeRequired();
    expect(screen.getByLabelText("Website")).not.toBeRequired();
    expect(screen.getByRole("button", { name: "Save draft" })).toBeEnabled();
  });

  it("starts from initial values when editing an existing shop", async () => {
    const save = vi.fn(async () => ({ ok: true }) as SaveOutcome);
    render(
      <ShopDraftForm
        save={save}
        initialValues={{
          name: "Bean There",
          website: "https://b.example.test",
          photos: [],
        }}
      />,
    );

    expect(screen.getByLabelText("Shop name")).toHaveValue("Bean There");
    fireEvent.click(screen.getByRole("button", { name: "Save draft" }));
    await waitFor(() =>
      expect(save).toHaveBeenCalledWith({
        name: "Bean There",
        website: "https://b.example.test",
        photos: [],
      }),
    );
  });

  it("submits the entered values and confirms the saved draft", async () => {
    const { save } = setup();

    type("Shop name", "Bean There");
    type("Website", "https://bean.example.test");
    fireEvent.click(screen.getByRole("button", { name: "Save draft" }));

    expect(await screen.findByRole("status")).toHaveTextContent("Draft saved.");
    expect(save).toHaveBeenCalledWith({
      name: "Bean There",
      website: "https://bean.example.test",
      photos: [],
    });
  });

  it("shows server field errors linked to their fields and keeps input", async () => {
    setup({
      ok: false,
      errors: { name: "Shop name must not be blank." },
    });

    type("Website", "http://x.example.test");
    fireEvent.click(screen.getByRole("button", { name: "Save draft" }));

    const alert = await screen.findByText("Shop name must not be blank.");
    const field = screen.getByLabelText("Shop name");
    expect(alert).toHaveAttribute("role", "alert");
    expect(field).toHaveAttribute("aria-invalid", "true");
    expect(field).toHaveAttribute("aria-describedby", alert.id);
    expect(screen.getByLabelText("Website")).toHaveValue(
      "http://x.example.test",
    );
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

  describe("photos", () => {
    const variants = [{ width: 480, height: 320, key: "photos/p1/480.webp" }];
    const photo = new File([new Uint8Array([1])], "front.jpg", {
      type: "image/jpeg",
    });

    function setupPhotos(
      upload: PhotoUploadOutcome = { ok: true, photo: { id: "p1", variants } },
      initialPhotos: {
        id: string;
        alt: string;
        variants: typeof variants;
      }[] = [],
    ) {
      const save = vi.fn(async () => ({ ok: true }) as SaveOutcome);
      const uploadPhoto = vi.fn(async () => upload);
      render(
        <ShopDraftForm
          save={save}
          uploadPhoto={uploadPhoto}
          initialValues={{ name: "Bean", website: "", photos: initialPhotos }}
        />,
      );
      return { save, uploadPhoto };
    }

    function choose() {
      fireEvent.change(screen.getByLabelText("Add photo"), {
        target: { files: [photo] },
      });
    }

    it("allows choosing an optional logo and clears it when that photo is removed", async () => {
      const { save } = setupPhotos(undefined, [
        { id: "p1", alt: "Counter", variants },
        {
          id: "p2",
          alt: "Logo",
          variants: [{ width: 480, height: 320, key: "photos/p2/480.webp" }],
        },
      ]);
      const logo = screen.getByLabelText("Company logo");
      expect(logo).toHaveValue("");
      fireEvent.change(logo, { target: { value: "p2" } });
      fireEvent.click(screen.getByRole("button", { name: "Save draft" }));
      await waitFor(() =>
        expect(save).toHaveBeenLastCalledWith(
          expect.objectContaining({ logoPhotoId: "p2" }),
        ),
      );
      fireEvent.click(screen.getByRole("button", { name: "Remove photo 2" }));
      expect(logo).toHaveValue("");
      fireEvent.click(screen.getByRole("button", { name: "Save draft" }));
      await waitFor(() =>
        expect(save).toHaveBeenLastCalledWith(
          expect.objectContaining({ logoPhotoId: "" }),
        ),
      );
    });

    it("hides the photo section without an upload function", () => {
      setup();

      expect(screen.queryByLabelText("Add photo")).not.toBeInTheDocument();
    });

    it("uploads a photo, requires alt text, and saves the reference", async () => {
      const { save, uploadPhoto } = setupPhotos();

      choose();
      const alt = await screen.findByLabelText("Alternative text for photo 1");
      expect(uploadPhoto).toHaveBeenCalledWith(photo);
      type("Alternative text for photo 1", "Front counter");
      expect(alt).toHaveValue("Front counter");
      fireEvent.click(screen.getByRole("button", { name: "Save draft" }));

      await waitFor(() =>
        expect(save).toHaveBeenCalledWith({
          name: "Bean",
          website: "",
          photos: [{ id: "p1", alt: "Front counter", variants }],
        }),
      );
    });

    it("shows upload failures without adding a photo", async () => {
      setupPhotos({ ok: false, message: "Photos must be 10 MB or smaller." });

      choose();

      expect(await screen.findByRole("alert")).toHaveTextContent(
        "Photos must be 10 MB or smaller.",
      );
      expect(
        screen.queryByLabelText("Alternative text for photo 1"),
      ).not.toBeInTheDocument();
    });

    it("removes a photo and saves without it", async () => {
      const { save } = setupPhotos(undefined, [
        { id: "p1", alt: "Counter", variants },
      ]);

      fireEvent.click(screen.getByRole("button", { name: "Remove photo 1" }));
      fireEvent.click(screen.getByRole("button", { name: "Save draft" }));

      await waitFor(() =>
        expect(save).toHaveBeenCalledWith({
          name: "Bean",
          website: "",
          photos: [],
        }),
      );
    });

    it("shows a photo error from the server and keeps the photos", async () => {
      const save = vi.fn(
        async () =>
          ({
            ok: false,
            errors: { photos: "Photo alternative text must not be blank." },
          }) as SaveOutcome,
      );
      render(
        <ShopDraftForm
          save={save}
          uploadPhoto={async () => ({
            ok: true,
            photo: { id: "p1", variants },
          })}
        />,
      );

      choose();
      await screen.findByLabelText("Alternative text for photo 1");
      fireEvent.click(screen.getByRole("button", { name: "Save draft" }));

      expect(
        await screen.findByText("Photo alternative text must not be blank."),
      ).toHaveAttribute("role", "alert");
      expect(
        screen.getByLabelText("Alternative text for photo 1"),
      ).toBeVisible();
    });

    it("ignores an empty file selection and disables adding while uploading", async () => {
      let finish: (outcome: PhotoUploadOutcome) => void = () => undefined;
      const uploadPhoto = vi.fn(
        () =>
          new Promise<PhotoUploadOutcome>((resolve) => {
            finish = resolve;
          }),
      );
      render(<ShopDraftForm save={vi.fn()} uploadPhoto={uploadPhoto} />);

      fireEvent.change(screen.getByLabelText("Add photo"), {
        target: { files: [] },
      });
      expect(uploadPhoto).not.toHaveBeenCalled();

      choose();
      await waitFor(() =>
        expect(screen.getByLabelText("Add photo")).toBeDisabled(),
      );
      expect(screen.getByRole("status")).toHaveTextContent(
        "Uploading photo...",
      );
      finish({ ok: true, photo: { id: "p1", variants } });
      await screen.findByLabelText("Alternative text for photo 1");
      expect(screen.getByLabelText("Add photo")).toBeEnabled();
    });
  });
});
