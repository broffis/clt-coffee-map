import { useForm, useStore } from "@tanstack/react-form";
import { useEffect, useId, useState } from "react";

export interface ShopDraftValues {
  readonly id: string;
  readonly name: string;
  readonly website: string;
}

type FieldName = keyof ShopDraftValues;

export type SaveOutcome =
  | { readonly ok: true }
  | {
      readonly ok: false;
      readonly errors?: Partial<Record<FieldName | "form", string>>;
      readonly message?: string;
    };

const EMPTY: ShopDraftValues = { id: "", name: "", website: "" };

export function ShopDraftForm({
  save,
}: {
  readonly save: (values: ShopDraftValues) => Promise<SaveOutcome>;
}) {
  const prefix = useId();
  const [errors, setErrors] = useState<
    Partial<Record<FieldName | "form", string>>
  >({});
  const [saved, setSaved] = useState(false);

  const form = useForm({
    defaultValues: EMPTY,
    onSubmit: async ({ value }) => {
      setSaved(false);
      const outcome = await save(value);
      if (outcome.ok) {
        setErrors({});
        setSaved(true);
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
            <input
              id={`${prefix}-${name}`}
              name={name}
              type={type}
              value={api.state.value}
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
      {field("id", "Shop ID")}
      {field("name", "Shop name")}
      {field("website", "Website (optional)", "url")}
      {errors.form !== undefined && <p role="alert">{errors.form}</p>}
      <button type="submit" disabled={submitting}>
        {submitting ? "Saving..." : "Save draft"}
      </button>
      {saved && <p role="status">Draft saved.</p>}
    </form>
  );
}
