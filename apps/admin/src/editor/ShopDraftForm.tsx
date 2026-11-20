import { useForm, useStore } from "@tanstack/react-form";
import { useEffect, useId, useState } from "react";
import type { SaveOutcome } from "./draft-request";
import type { PhotoUploadOutcome, UploadedPhoto } from "./photo-upload-client";

export type { SaveOutcome } from "./draft-request";

export interface PhotoValue extends UploadedPhoto {
  readonly alt: string;
}

export interface ShopDraftValues {
  readonly name: string;
  readonly website: string;
  readonly photos: readonly PhotoValue[];
}

type FieldName = "name" | "website";

const EMPTY: ShopDraftValues = { name: "", website: "", photos: [] };

export function ShopDraftForm({
  save,
  uploadPhoto,
  initialValues = EMPTY,
}: {
  readonly save: (values: ShopDraftValues) => Promise<SaveOutcome>;
  readonly uploadPhoto?: (file: File) => Promise<PhotoUploadOutcome>;
  readonly initialValues?: ShopDraftValues;
}) {
  const prefix = useId();
  const [errors, setErrors] = useState<
    Partial<Record<FieldName | "photos" | "form", string>>
  >({});
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  // Saved values become the new defaults so re-renders do not reset the form.
  const [defaults, setDefaults] = useState(initialValues);

  const form = useForm({
    defaultValues: defaults,
    onSubmit: async ({ value }) => {
      setSaved(false);
      const outcome = await save(value);
      if (outcome.ok) {
        setErrors({});
        setSaved(true);
        setDefaults(value);
        form.reset(value);
        return;
      }
      setErrors({
        ...outcome.errors,
        ...(outcome.message === undefined ? {} : { form: outcome.message }),
      });
    },
  });
  const dirty = useStore(form.store, (state) => state.isDirty);
  const submitting = useStore(form.store, (state) => state.isSubmitting);

  useEffect(() => {
    if (!dirty) {
      return;
    }
    const warn = (event: BeforeUnloadEvent) => event.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  async function addPhoto(
    file: File | undefined,
    add: (photo: PhotoValue) => void,
  ): Promise<void> {
    if (file === undefined || uploadPhoto === undefined) {
      return;
    }
    setSaved(false);
    setUploadError(null);
    setUploading(true);
    const outcome = await uploadPhoto(file);
    setUploading(false);
    if (outcome.ok) {
      add({ ...outcome.photo, alt: "" });
    } else {
      setUploadError(outcome.message);
    }
  }

  function photos() {
    return (
      <form.Field name="photos">
        {(api) => (
          <fieldset>
            <legend>Photos</legend>
            {api.state.value.map((photo, index) => (
              <div key={photo.id}>
                <label htmlFor={`${prefix}-photo-${photo.id}`}>
                  {`Alternative text for photo ${index + 1}`}
                </label>
                <input
                  id={`${prefix}-photo-${photo.id}`}
                  type="text"
                  value={photo.alt}
                  aria-required={true}
                  onChange={(event) => {
                    setSaved(false);
                    api.handleChange(
                      api.state.value.map((item) =>
                        item.id === photo.id
                          ? { ...item, alt: event.target.value }
                          : item,
                      ),
                    );
                  }}
                />
                <button
                  type="button"
                  onClick={() => {
                    setSaved(false);
                    api.handleChange(
                      api.state.value.filter((item) => item.id !== photo.id),
                    );
                  }}
                >
                  {`Remove photo ${index + 1}`}
                </button>
              </div>
            ))}
            <label htmlFor={`${prefix}-add-photo`}>Add photo</label>
            <input
              id={`${prefix}-add-photo`}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              disabled={uploading}
              onChange={(event) => {
                const input = event.target;
                void addPhoto(input.files?.[0], (photo) =>
                  api.handleChange([...api.state.value, photo]),
                ).finally(() => {
                  input.value = "";
                });
              }}
            />
            {uploading && <p role="status">Uploading photo...</p>}
            {uploadError !== null && <p role="alert">{uploadError}</p>}
            {errors.photos !== undefined && <p role="alert">{errors.photos}</p>}
          </fieldset>
        )}
      </form.Field>
    );
  }

  function field(name: FieldName, label: string, type = "text") {
    const errorId = `${prefix}-${name}-error`;
    const error = errors[name];
    return (
      <form.Field name={name}>
        {(api) => (
          <div>
            <label htmlFor={`${prefix}-${name}`}>{label}</label>
            {name === "name" && <span aria-hidden="true"> *</span>}
            <input
              id={`${prefix}-${name}`}
              name={name}
              type={type}
              value={api.state.value}
              aria-required={name === "name" ? true : undefined}
              aria-invalid={error === undefined ? undefined : true}
              aria-describedby={error === undefined ? undefined : errorId}
              onChange={(event) => {
                setSaved(false);
                api.handleChange(event.target.value);
              }}
            />
            {error !== undefined && (
              <p id={errorId} role="alert">
                {error}
              </p>
            )}
          </div>
        )}
      </form.Field>
    );
  }

  return (
    <form
      aria-label="Shop draft"
      noValidate
      onSubmit={(event) => {
        event.preventDefault();
        void form.handleSubmit();
      }}
    >
      <p>* Required field</p>
      {field("name", "Shop name")}
      {field("website", "Website", "url")}
      {uploadPhoto !== undefined && photos()}
      {errors.form !== undefined && <p role="alert">{errors.form}</p>}
      <button type="submit" disabled={submitting}>
        {submitting ? "Saving..." : "Save draft"}
      </button>
      {saved && <p role="status">Draft saved.</p>}
    </form>
  );
}
