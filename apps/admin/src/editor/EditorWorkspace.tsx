import { useCallback, useEffect, useState } from "react";
import type { SaveOutcome } from "./draft-request";
import type {
  EditorLocationRecord,
  EditorRecords,
  LoadOutcome,
} from "./editor-records-client";
import { LocationDraftForm } from "./LocationDraftForm";
import type { LocationDraftValues } from "./location-draft-client";
import { ShopDraftForm, type ShopDraftValues } from "./ShopDraftForm";

type Selection =
  | {
      readonly kind: "shop";
      readonly formKey: number;
      readonly id?: string;
      readonly initial?: ShopDraftValues;
    }
  | {
      readonly kind: "location";
      readonly formKey: number;
      readonly id?: string;
      readonly initial?: LocationDraftValues;
    };

type State =
  | { readonly status: "loading" }
  | { readonly status: "failed"; readonly message: string }
  | { readonly status: "ready"; readonly records: EditorRecords };

function describeLocation(location: EditorLocationRecord): string {
  return location.streetLine1 === ""
    ? location.type
    : `${location.streetLine1} (${location.type})`;
}

export function EditorWorkspace({
  load,
  saveShop,
  saveLocation,
}: {
  readonly load: () => Promise<LoadOutcome>;
  readonly saveShop: (
    values: ShopDraftValues & { readonly id?: string },
  ) => Promise<SaveOutcome>;
  readonly saveLocation: (
    values: LocationDraftValues & { readonly id?: string },
  ) => Promise<SaveOutcome>;
}) {
  const [state, setState] = useState<State>({ status: "loading" });
  const [selection, setSelection] = useState<Selection | null>(null);
  const [formCount, setFormCount] = useState(0);

  const refresh = useCallback(async () => {
    const outcome = await load();
    setState(
      outcome.ok
        ? { status: "ready", records: outcome.records }
        : { status: "failed", message: outcome.message },
    );
  }, [load]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  function open(next: Omit<Selection, "formKey">) {
    setFormCount((count) => count + 1);
    setSelection({ ...next, formKey: formCount + 1 } as Selection);
  }

  async function persistShop(values: ShopDraftValues) {
    const outcome = await saveShop({ ...values, id: selection?.id });
    return afterSave(outcome);
  }

  async function persistLocation(values: LocationDraftValues) {
    const outcome = await saveLocation({ ...values, id: selection?.id });
    return afterSave(outcome);
  }

  // Later saves of a record created here must update it, not create another.
  async function afterSave(outcome: SaveOutcome): Promise<SaveOutcome> {
    if (outcome.ok) {
      const id = outcome.id;
      if (id !== undefined) {
        setSelection((current) =>
          current === null ? current : ({ ...current, id } as Selection),
        );
      }
      await refresh();
    }
    return outcome;
  }

  if (state.status === "loading") {
    return <p role="status">Loading shops...</p>;
  }
  if (state.status === "failed") {
    return (
      <div>
        <p role="alert">{state.message}</p>
        <button
          type="button"
          onClick={() => {
            setState({ status: "loading" });
            void refresh();
          }}
        >
          Try again
        </button>
      </div>
    );
  }

  const { shops } = state.records;
  return (
    <div>
      <div>
        <button type="button" onClick={() => open({ kind: "shop" })}>
          New shop
        </button>
        <button
          type="button"
          disabled={shops.length === 0}
          onClick={() => open({ kind: "location" })}
        >
          New location
        </button>
      </div>
      {shops.length === 0 ? (
        <p>No shops yet. Create a shop before adding locations.</p>
      ) : (
        <ul aria-label="Shops">
          {shops.map((shop) => (
            <li key={shop.id}>
              <strong>{shop.name}</strong>{" "}
              <button
                type="button"
                aria-label={`Edit shop ${shop.name}`}
                onClick={() =>
                  open({
                    kind: "shop",
                    id: shop.id,
                    initial: { name: shop.name, website: shop.website },
                  })
                }
              >
                Edit
              </button>
              <ul>
                {shop.locations.map((location) => (
                  <li key={location.id}>
                    {describeLocation(location)}{" "}
                    <button
                      type="button"
                      aria-label={`Edit location ${describeLocation(location)}`}
                      onClick={() => {
                        const { id, ...values } = location;
                        open({
                          kind: "location",
                          id,
                          initial: { ...values, shopId: shop.id },
                        });
                      }}
                    >
                      Edit
                    </button>
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ul>
      )}
      {selection?.kind === "shop" && (
        <section aria-label="Shop editor">
          <h3>{selection.id === undefined ? "New shop" : "Edit shop"}</h3>
          <ShopDraftForm
            key={selection.formKey}
            save={persistShop}
            initialValues={selection.initial}
          />
        </section>
      )}
      {selection?.kind === "location" && (
        <section aria-label="Location editor">
          <h3>
            {selection.id === undefined ? "New location" : "Edit location"}
          </h3>
          <LocationDraftForm
            key={selection.formKey}
            save={persistLocation}
            shops={shops}
            initialValues={selection.initial}
          />
        </section>
      )}
    </div>
  );
}
