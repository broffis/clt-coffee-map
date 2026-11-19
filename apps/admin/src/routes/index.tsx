import { Show, SignInButton, UserButton } from "@clerk/tanstack-react-start";
import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { EditorWorkspace } from "../editor/EditorWorkspace";
import { loadEditorRecordsRequest } from "../editor/editor-records-client";
import { saveLocationDraftRequest } from "../editor/location-draft-client";
import { saveShopDraftRequest } from "../editor/shop-draft-client";

export const Route = createFileRoute("/")({
  component: Home,
});

export function Home() {
  const [checking, setChecking] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function checkAccess() {
    setChecking(true);
    setMessage(null);
    try {
      const response = await fetch("/api/admin/access", {
        cache: "no-store",
        credentials: "same-origin",
      });
      switch (response.status) {
        case 200:
          setMessage("Admin access is approved.");
          break;
        case 401:
          setMessage(
            "Your session could not be verified. Please sign in again.",
          );
          break;
        case 403:
          setMessage("This account is not approved for private admin access.");
          break;
        case 503:
          setMessage("Permissions could not be verified. Try again later.");
          break;
        default:
          setMessage("Access check failed. Please try again.");
      }
    } catch {
      setMessage("Access check failed. Please try again.");
    } finally {
      setChecking(false);
    }
  }

  return (
    <main>
      <h1>Coffee Map administration</h1>
      <p>
        Signing in does not grant private admin access. Approval is separate.
      </p>
      <Show when="signed-out">
        <SignInButton mode="modal" forceRedirectUrl="/">
          <button type="button">Sign in</button>
        </SignInButton>
      </Show>
      <Show when="signed-in">
        <UserButton />
        <button type="button" onClick={checkAccess} disabled={checking}>
          {checking ? "Checking access..." : "Check admin access"}
        </button>
        {message !== null && <p role="status">{message}</p>}
        <h2>Shops and locations</h2>
        <p>Saving creates or updates unpublished drafts only.</p>
        <EditorWorkspace
          load={loadEditorRecordsRequest}
          saveShop={saveShopDraftRequest}
          saveLocation={saveLocationDraftRequest}
        />
      </Show>
    </main>
  );
}
