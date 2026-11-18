import "@tanstack/react-start/server-only";
import { auth } from "@clerk/tanstack-react-start/server";
import type { SessionVerifier } from "./session";

export const clerkSessionVerifier: SessionVerifier<Request> = {
  async verify() {
    const session = await auth({ acceptsToken: "session_token" });
    return session.isAuthenticated ? { userId: session.userId } : null;
  },
};
