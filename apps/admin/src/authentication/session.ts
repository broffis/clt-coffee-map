export interface VerifiedSession {
  readonly userId: string;
}

export interface SessionVerifier<TRequest> {
  verify(request: TRequest): Promise<VerifiedSession | null>;
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
