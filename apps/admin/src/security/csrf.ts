const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

// Route handlers (such as /api/admin/*) bypass server-function checks, so any
// state-changing request must also pass the origin validation.
export function requiresCsrfCheck(context: {
  readonly handlerType: "serverFn" | "router";
  readonly request: Request;
}): boolean {
  return (
    context.handlerType === "serverFn" ||
    !SAFE_METHODS.has(context.request.method.toUpperCase())
  );
}
