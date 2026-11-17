import { clerkMiddleware } from "@clerk/tanstack-react-start/server";
import {
  createCsrfMiddleware,
  createMiddleware,
  createStart,
} from "@tanstack/react-start";
import { readAuthorizedParties } from "./authentication/clerk-config";

export const startInstance = createStart(() => ({
  requestMiddleware: [
    createCsrfMiddleware({
      filter: (context) => context.handlerType === "serverFn",
    }),
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
