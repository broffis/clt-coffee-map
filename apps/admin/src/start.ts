import { clerkMiddleware } from "@clerk/tanstack-react-start/server";
import {
  createCsrfMiddleware,
  createMiddleware,
  createStart,
} from "@tanstack/react-start";
import { readAuthorizedParties } from "./authentication/clerk-config";
import { requiresCsrfCheck } from "./security/csrf";

export const startInstance = createStart(() => ({
  requestMiddleware: [
    createCsrfMiddleware({ filter: requiresCsrfCheck }),
    createMiddleware().server(async ({ next }) => {
      const result = await next();
      result.response.headers.set("Cache-Control", "private, no-store");
      return result;
    }),
    clerkMiddleware(() => ({
      authorizedParties: readAuthorizedParties(process.env),
    })),
  ],
}));
