const TOKEN_KEY = "labtrack_auth_token";

type AuthListener = (event: "SIGNED_IN" | "SIGNED_OUT" | "USER_UPDATED") => void;
const listeners = new Set<AuthListener>();

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
  notify("SIGNED_IN");
}

export function clearToken(): void {
  localStorage.removeItem(TOKEN_KEY);
  notify("SIGNED_OUT");
}

export function onAuthStateChange(callback: AuthListener): { unsubscribe: () => void } {
  listeners.add(callback);
  return { unsubscribe: () => listeners.delete(callback) };
}

function notify(event: AuthListener extends (e: infer E) => void ? E : never) {
  listeners.forEach((cb) => cb(event));
}

export function notifyUserUpdated() {
  notify("USER_UPDATED");
}
