import { useCallback, useEffect, useState } from "react";
import type { CandidateLoadOutcome, CandidateRecord } from "./candidate-client";
import type { SaveOutcome } from "./draft-request";
import type {
  EditorLocationRecord,
  EditorRecords,
  LoadOutcome,
} from "./editor-records-client";
import { LocationDraftForm } from "./LocationDraftForm";
import type { LocationDraftValues } from "./location-draft-client";
import type { PhotoUploadOutcome } from "./photo-upload-client";
import type {
  PublicationAction,
  PublicationOutcome,
} from "./publication-client";
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
  updatePublication,
  loadCandidates,
  reviewCandidate,
  uploadPhoto,
}: {
  readonly load: () => Promise<LoadOutcome>;
  readonly saveShop: (
    values: ShopDraftValues & { readonly id?: string },
  ) => Promise<SaveOutcome>;
  readonly saveLocation: (
    values: LocationDraftValues & { readonly id?: string },
  ) => Promise<SaveOutcome>;
  readonly updatePublication: (
    shopId: string,
    locationId: string | undefined,
    action: PublicationAction,
  ) => Promise<PublicationOutcome>;
  readonly uploadPhoto?: (file: File) => Promise<PhotoUploadOutcome>;
  readonly loadCandidates?: () => Promise<CandidateLoadOutcome>;
  readonly reviewCandidate?: (
    candidateId: string,
    type: string,
    name?: string,
    website?: string,
  ) => Promise<SaveOutcome>;
}) {
  const [state, setState] = useState<State>({ status: "loading" });
  const [selection, setSelection] = useState<Selection | null>(null);
  const [formCount, setFormCount] = useState(0);
  const [publicationState, setPublicationState] = useState<{
    readonly id: string;
    readonly busy: boolean;
    readonly message?: string;
  } | null>(null);
  const [shopPublicationState, setShopPublicationState] = useState<{
    readonly id: string;
    readonly busy: boolean;
    readonly message?: string;
  } | null>(null);
  const [candidateState, setCandidateState] = useState<
    | { readonly status: "unavailable"; readonly message: string }
    | {
        readonly status: "ready";
        readonly candidates: readonly CandidateRecord[];
      }
    | null
  >(null);
  const [candidateTypes, setCandidateTypes] = useState<Record<string, string>>(
    {},
  );
  const [candidateNames, setCandidateNames] = useState<Record<string, string>>(
    {},
  );
  const [candidateWebsites, setCandidateWebsites] = useState<
    Record<string, string>
  >({});
  const [reviewingCandidate, setReviewingCandidate] = useState<string | null>(
    null,
  );

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
    if (loadCandidates !== undefined) {
      void (async () => {
        const outcome = await loadCandidates();
        setCandidateState(
          outcome.ok
            ? { status: "ready", candidates: outcome.candidates }
            : { status: "unavailable", message: outcome.message },
        );
      })();
    }
  }, [loadCandidates, refresh]);

  async function review(candidate: CandidateRecord): Promise<void> {
    if (reviewCandidate === undefined) {
      return;
    }
    const type = candidateTypes[candidate.id] ?? candidate.type ?? "cafe";
    const name = candidateNames[candidate.id] ?? candidate.name;
    const website = candidateWebsites[candidate.id] ?? candidate.website ?? "";
    setReviewingCandidate(candidate.id);
    const outcome = await reviewCandidate(candidate.id, type, name, website);
    setReviewingCandidate(null);
    if (!outcome.ok) {
      setCandidateState({
        status: "unavailable",
        message: outcome.message ?? "Candidate could not be reviewed.",
      });
      return;
    }
    await refresh();
    const candidates = await loadCandidates?.();
    if (candidates?.ok) {
      setCandidateState({ status: "ready", candidates: candidates.candidates });
    }
  }

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

  async function changePublication(
    shopId: string,
    locationId: string,
    action: PublicationAction,
  ): Promise<void> {
    setPublicationState({ id: locationId, busy: true });
    const outcome = await updatePublication(shopId, locationId, action);
    if (outcome.ok) {
      setPublicationState({
        id: locationId,
        busy: false,
        message:
          action === "publish-location"
            ? "Location published."
            : "Location unpublished.",
      });
      await refresh();
      return;
    }

    setPublicationState({
      id: locationId,
      busy: false,
      message: outcome.message,
    });
  }

  async function republishShop(shopId: string): Promise<void> {
    setShopPublicationState({ id: shopId, busy: true });
    const outcome = await updatePublication(
      shopId,
      undefined,
      "republish-shop",
    );
    if (outcome.ok) {
      setShopPublicationState({
        id: shopId,
        busy: false,
        message: "Shop details republished.",
      });
      await refresh();
      return;
    }
    setShopPublicationState({
      id: shopId,
      busy: false,
      message: outcome.message,
    });
  }

  async function retryPhotoDelivery(shopId: string): Promise<void> {
    setShopPublicationState({ id: shopId, busy: true });
    const outcome = await updatePublication(
      shopId,
      undefined,
      "retry-photo-delivery",
    );
    setShopPublicationState({
      id: shopId,
      busy: false,
      message: outcome.ok ? "Photo delivery completed." : outcome.message,
    });
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
      {candidateState?.status === "unavailable" && (
        <p role="alert">{candidateState.message}</p>
      )}
      {candidateState?.status === "ready" &&
        candidateState.candidates.length > 0 && (
          <section aria-labelledby="candidate-heading">
            <h2 id="candidate-heading">Source candidates</h2>
            <p>
              Review candidates into unpublished drafts. They never become
              public automatically.
            </p>
            <ul aria-label="Source candidates">
              {candidateState.candidates.map((candidate) => {
                const type =
                  candidateTypes[candidate.id] ?? candidate.type ?? "cafe";
                return (
                  <li key={candidate.id}>
                    <strong>{candidate.name}</strong>{" "}
                    <span>
                      ({candidate.sourceRecordId}, {candidate.release})
                    </span>
                    <label>
                      Name
                      <input
                        value={candidateNames[candidate.id] ?? candidate.name}
                        onChange={(event) =>
                          setCandidateNames((current) => ({
                            ...current,
                            [candidate.id]: event.target.value,
                          }))
                        }
                      />
                    </label>
                    <label>
                      Website
                      <input
                        value={
                          candidateWebsites[candidate.id] ??
                          candidate.website ??
                          ""
                        }
                        onChange={(event) =>
                          setCandidateWebsites((current) => ({
                            ...current,
                            [candidate.id]: event.target.value,
                          }))
                        }
                      />
                    </label>
                    <label>
                      Type
                      <select
                        value={type}
                        onChange={(event) =>
                          setCandidateTypes((current) => ({
                            ...current,
                            [candidate.id]: event.target.value,
                          }))
                        }
                      >
                        {[
                          "cafe",
                          "bakery",
                          "mobile coffee",
                          "coffee roaster",
                        ].map((option) => (
                          <option key={option} value={option}>
                            {option}
                          </option>
                        ))}
                      </select>
                    </label>
                    <button
                      type="button"
                      disabled={reviewingCandidate === candidate.id}
                      onClick={() => void review(candidate)}
                    >
                      {reviewingCandidate === candidate.id
                        ? "Reviewing..."
                        : "Review as draft"}
                    </button>
                  </li>
                );
              })}
            </ul>
          </section>
        )}
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
                    initial: {
                      name: shop.name,
                      website: shop.website,
                      photos: shop.photos ?? [],
                      ...(shop.logoPhotoId === undefined
                        ? {}
                        : { logoPhotoId: shop.logoPhotoId }),
                    },
                  })
                }
              >
                Edit
              </button>
              {shop.published && (
                <>
                  <button
                    type="button"
                    disabled={
                      shopPublicationState?.id === shop.id &&
                      shopPublicationState.busy
                    }
                    onClick={() => void republishShop(shop.id)}
                  >
                    {shopPublicationState?.id === shop.id &&
                    shopPublicationState.busy
                      ? "Republishing..."
                      : "Republish shop details"}
                  </button>
                  <button
                    type="button"
                    disabled={
                      shopPublicationState?.id === shop.id &&
                      shopPublicationState.busy
                    }
                    onClick={() => void retryPhotoDelivery(shop.id)}
                  >
                    Retry photo delivery
                  </button>
                  {shopPublicationState?.id === shop.id &&
                    shopPublicationState.message !== undefined && (
                      <p role="status">{shopPublicationState.message}</p>
                    )}
                </>
              )}
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
                    <button
                      type="button"
                      disabled={
                        publicationState?.id === location.id &&
                        publicationState.busy
                      }
                      onClick={() =>
                        void changePublication(
                          shop.id,
                          location.id,
                          location.published
                            ? "unpublish-location"
                            : "publish-location",
                        )
                      }
                    >
                      {publicationState?.id === location.id &&
                      publicationState.busy
                        ? "Updating..."
                        : location.published
                          ? "Unpublish"
                          : "Publish"}
                    </button>
                    {publicationState?.id === location.id &&
                      publicationState.message !== undefined && (
                        <p role="status">{publicationState.message}</p>
                      )}
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
            uploadPhoto={uploadPhoto}
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
