import { useForm, useStore } from "@tanstack/react-form";
import { useEffect, useId, useState } from "react";
import type { SaveOutcome } from "./draft-request";
import type { LocationDraftValues } from "./location-draft-client";

type FieldName = keyof LocationDraftValues;

const TYPES = ["cafe", "bakery", "mobile coffee", "coffee roaster"] as const;

const EMPTY: LocationDraftValues = {
  shopId: "",
  type: "cafe",
  streetLine1: "",
  streetLine2: "",
  postalCode: "",
  latitude: "",
  longitude: "",
  website: "",
};

export function LocationDraftForm({
  save,
  shops,
  initialValues = EMPTY,
}: {
  readonly save: (values: LocationDraftValues) => Promise<SaveOutcome>;
  readonly shops: readonly { readonly id: string; readonly name: string }[];
  readonly initialValues?: LocationDraftValues;
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

  function field(
    name: FieldName,
    label: string,
    control: "input" | "select" = "input",
    options: readonly { value: string; label: string }[] = [],
  ) {
    const errorId = `${prefix}-${name}-error`;
    const error = errors[name];
    return (
      <form.Field name={name}>
        {(api) => {
          const shared = {
            id: `${prefix}-${name}`,
            name,
            value: api.state.value,
            "aria-invalid": error === undefined ? undefined : (true as const),
            "aria-describedby": error === undefined ? undefined : errorId,
          };
          const change = (value: string) => {
            setSaved(false);
            api.handleChange(value);
          };
          return (
            <div>
              <label htmlFor={shared.id}>{label}</label>
              {control === "select" ? (
                <select
                  {...shared}
                  onChange={(event) => change(event.target.value)}
                >
                  {options.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  {...shared}
                  type={name === "website" ? "url" : "text"}
                  inputMode={
                    name === "latitude" || name === "longitude"
                      ? "decimal"
                      : undefined
                  }
                  onChange={(event) => change(event.target.value)}
                />
              )}
              {error !== undefined && (
                <p id={errorId} role="alert">
                  {error}
                </p>
              )}
            </div>
          );
        }}
      </form.Field>
    );
  }

  return (
    <form
      aria-label="Location draft"
      noValidate
      onSubmit={(event) => {
        event.preventDefault();
        void form.handleSubmit();
      }}
    >
      {field("shopId", "Shop", "select", [
        { value: "", label: "Select a shop" },
        ...shops.map((shop) => ({ value: shop.id, label: shop.name })),
      ])}
      {field(
        "type",
        "Type",
        "select",
        TYPES.map((type) => ({ value: type, label: type })),
      )}
      {field("streetLine1", "Street address")}
      {field("streetLine2", "Street address line 2 (optional)")}
      {field("postalCode", "Postal code (optional)")}
      {field("latitude", "Latitude (optional for mobile)")}
      {field("longitude", "Longitude (optional for mobile)")}
      {field("website", "Location website (optional)")}
      {errors.form !== undefined && <p role="alert">{errors.form}</p>}
      <button type="submit" disabled={submitting}>
        {submitting ? "Saving..." : "Save location"}
      </button>
      {saved && <p role="status">Location saved.</p>}
    </form>
  );
}
