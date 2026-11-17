export interface VerifiedSession {
  readonly userId: string;
}

export interface SessionVerifier<TRequest> {
  verify(request: TRequest): Promise<VerifiedSession | null>;
}

export interface ClerkSessionClient {
  authenticateRequest(request: Request): Promise<{
    readonly isAuthenticated: boolean;
    readonly toAuth: () => { readonly userId: string | null };
  }>;
}

export class SessionVerificationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SessionVerificationError";
  }
}

export async function requireVerifiedSession<TRequest>(
  verifier: SessionVerifier<TRequest>,
  request: TRequest,
): Promise<VerifiedSession> {
  let session: VerifiedSession | null;
  try {
    session = await verifier.verify(request);
  } catch {
    throw new SessionVerificationError("Admin session could not be verified.");
  }
  if (session === null || session.userId.trim() === "") {
    throw new SessionVerificationError("No verified admin session was found.");
  }
  return session;
}

export function createClerkSessionVerifier(
  client: ClerkSessionClient,
): SessionVerifier<Request> {
  return {
    async verify(request) {
      const state = await client.authenticateRequest(request);
      if (!state.isAuthenticated) {
        return null;
      }
      const userId = state.toAuth().userId;
      return userId === null ? null : { userId };
    },
  };
}
