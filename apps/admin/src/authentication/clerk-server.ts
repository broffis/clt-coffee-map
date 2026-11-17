import { createClerkClient } from "@clerk/backend";
import { createClerkSessionVerifier, type SessionVerifier } from "./session";

export function createClerkServerSessionVerifier(
  secretKey: string,
  publishableKey: string,
): SessionVerifier<Request> {
  if (secretKey.trim() === "" || publishableKey.trim() === "") {
    throw new Error("Clerk server credentials are required.");
  }
  const client = createClerkClient({ secretKey, publishableKey });
  return createClerkSessionVerifier({
    authenticateRequest: async (request) => {
      const state = await client.authenticateRequest(request);
      return {
        isAuthenticated: state.isAuthenticated,
        toAuth: () => ({
          userId: state.isAuthenticated ? state.toAuth().userId : null,
        }),
      };
    },
  });
}
