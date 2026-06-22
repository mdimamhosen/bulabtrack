import { createMiddleware } from "@tanstack/react-start";
import { getToken } from "./auth.client";

export const attachAuthToken = createMiddleware({ type: "function" }).client(async ({ next }) => {
  const token = getToken();
  return next({
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
});
