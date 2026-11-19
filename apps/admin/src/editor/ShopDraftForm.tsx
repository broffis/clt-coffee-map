import { useForm, useStore } from "@tanstack/react-form";
import { useEffect, useId, useState } from "react";
import type { SaveOutcome } from "./draft-request";

export type { SaveOutcome } from "./draft-request";

export interface ShopDraftValues {
  readonly name: string;
  readonly website: string;
}

type FieldName = keyof ShopDraftValues;

const EMPTY: ShopDraftValues = { name: "", website: "" };

export function ShopDraftForm({
  save,
  initialValues = EMPTY,
}: {
  readonly save: (values: ShopDraftValues) => Promise<SaveOutcome>;
  readonly initialValues?: ShopDraftValues;
}) {
  const prefix = useId();
  const [errors, setErrors] = useState<
    Partial<Record<FieldName | "form", string>>
  >({});
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
      {errors.form !== undefined && <p role="alert">{errors.form}</p>}
      <button type="submit" disabled={submitting}>
        {submitting ? "Saving..." : "Save draft"}
      </button>
      {saved && <p role="status">Draft saved.</p>}
    </form>
  );
}
