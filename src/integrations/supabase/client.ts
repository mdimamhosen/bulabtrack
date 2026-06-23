import { executeDbAction, executeDbRpc, executeAuthAction, saveUploadedFileServer } from "@/lib/api/database.functions";

const STORAGE_KEY = "sb-xvnoorzxozuticwyappx-auth-token";

// Decode JWT without external libraries
function decodeJwt(token: string) {
  try {
    const base64Url = token.split(".")[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    );
    return JSON.parse(jsonPayload);
  } catch (e) {
    return null;
  }
}

function getLocalSession() {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch (e) {
    return null;
  }
}

function setLocalSession(session: any) {
  if (typeof window === "undefined") return;
  if (session) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
  } else {
    localStorage.removeItem(STORAGE_KEY);
  }
}

const authListeners = new Set<(event: string, session: any) => void>();

function triggerAuthEvent(event: string, session: any) {
  for (const cb of authListeners) {
    try {
      cb(event, session);
    } catch (e) {
      console.error("Auth listener error", e);
    }
  }
}

class QueryBuilder {
  private tableName: string;
  private action: "select" | "insert" | "update" | "delete" = "select";
  private filters: Array<{ type: "eq" | "neq"; field: string; value: any }> = [];
  private operations: Array<{ type: string; args: any[] }> = [];

  constructor(tableName: string) {
    this.tableName = tableName;
  }

  select(fields = "*") {
    this.action = "select";
    this.operations.push({ type: "select", args: [fields] });
    return this;
  }

  insert(data: any) {
    this.action = "insert";
    this.operations.push({ type: "insert", args: [data] });
    return this;
  }

  update(data: any) {
    this.action = "update";
    this.operations.push({ type: "update", args: [data] });
    return this;
  }

  delete() {
    this.action = "delete";
    this.operations.push({ type: "delete", args: [] });
    return this;
  }

  eq(field: string, value: any) {
    this.filters.push({ type: "eq", field, value });
    return this;
  }

  neq(field: string, value: any) {
    this.filters.push({ type: "neq", field, value });
    return this;
  }

  order(field: string, options?: { ascending?: boolean }) {
    this.operations.push({ type: "order", args: [field, options] });
    return this;
  }

  single() {
    this.operations.push({ type: "single", args: [] });
    return this;
  }

  maybeSingle() {
    this.operations.push({ type: "maybeSingle", args: [] });
    return this;
  }

  // Support thenable behavior so the query can be awaited directly
  async then(onfulfilled?: (value: any) => any, onrejected?: (reason: any) => any) {
    try {
      const res = await executeDbAction({
        data: {
          tableName: this.tableName,
          action: this.action,
          filters: this.filters,
          operations: this.operations,
        },
      });
      if (onfulfilled) return onfulfilled(res);
      return res;
    } catch (err) {
      if (onrejected) return onrejected(err);
      throw err;
    }
  }
}

export const supabase = {
  auth: {
    async signUp(payload: any) {
      const res = await executeAuthAction({
        data: {
          action: "signUp",
          payload,
        },
      });
      if (res.data?.session) {
        setLocalSession(res.data.session);
        triggerAuthEvent("SIGNED_IN", res.data.session);
      }
      return res;
    },

    async signInWithPassword(payload: any) {
      const res = await executeAuthAction({
        data: {
          action: "signInWithPassword",
          payload,
        },
      });
      if (res.data?.session) {
        setLocalSession(res.data.session);
        triggerAuthEvent("SIGNED_IN", res.data.session);
      }
      return res;
    },

    async signOut() {
      await executeAuthAction({
        data: {
          action: "signOut",
        },
      });
      setLocalSession(null);
      triggerAuthEvent("SIGNED_OUT", null);
      return { error: null };
    },

    async getUser() {
      const session = getLocalSession();
      if (!session?.access_token) {
        return { data: { user: null }, error: null };
      }
      const decoded = decodeJwt(session.access_token);
      if (!decoded) {
        return { data: { user: null }, error: { message: "Invalid session" } };
      }
      // Decode JWT locally for client, fallback to server check if needed
      return {
        data: {
          user: {
            id: decoded.sub,
            email: decoded.email,
            user_metadata: { name: decoded.name },
          },
        },
        error: null,
      };
    },

    async getSession() {
      const session = getLocalSession();
      return { data: { session }, error: null };
    },

    async updateUser(data: any) {
      const session = getLocalSession();
      if (!session?.access_token) {
        return { data: { user: null }, error: { message: "No session active" } };
      }
      const res = await executeAuthAction({
        data: {
          action: "updateUser",
          payload: {
            token: session.access_token,
            data,
          },
        },
      });
      if (!res.error && res.data?.user) {
        // If user changed their own details, update claims
        triggerAuthEvent("USER_UPDATED", session);
      }
      return res;
    },

    onAuthStateChange(callback: (event: string, session: any) => void) {
      authListeners.add(callback);
      const session = getLocalSession();
      // Instantly notify listener of current session state
      setTimeout(() => {
        callback(session ? "SIGNED_IN" : "SIGNED_OUT", session);
      }, 0);

      return {
        data: {
          subscription: {
            unsubscribe() {
              authListeners.delete(callback);
            },
          },
        },
      };
    },

    async resetPasswordForEmail(email: string, options?: any) {
      // Mock password reset email send success
      toast.success("Password reset request sent (Mock)");
      return { error: null };
    },
  },

  from(tableName: string) {
    return new QueryBuilder(tableName);
  },

  async rpc(name: string, args: any) {
    return executeDbRpc({
      data: {
        name,
        args,
      },
    });
  },

  storage: {
    from(bucket: string) {
      return {
        async upload(filePath: string, file: File) {
          const reader = new FileReader();
          const base64Promise = new Promise<string>((resolve) => {
            reader.onloadend = () => resolve(reader.result as string);
            reader.readAsDataURL(file);
          });
          const base64Data = await base64Promise;

          const res = await saveUploadedFileServer({
            data: {
              filePath,
              base64Data,
            },
          });

          if (res.error) {
            return { data: null, error: res.error };
          }
          return { data: { path: filePath }, error: null };
        },

        getPublicUrl(filePath: string) {
          // Extracts filename to form local path /uploads/filename
          const filename = filePath.split("/").pop() || filePath;
          return {
            data: {
              publicUrl: `/uploads/${filename}`,
            },
          };
        },
      };
    },
  },
};

export function createClient(url: string, key: string, options?: any) {
  const persistSession = options?.auth?.persistSession !== false;
  return {
    ...supabase,
    auth: {
      ...supabase.auth,
      async signUp(payload: any) {
        const res = await executeAuthAction({
          data: {
            action: "signUp",
            payload,
          },
        });
        if (persistSession && res.data?.session) {
          setLocalSession(res.data.session);
          triggerAuthEvent("SIGNED_IN", res.data.session);
        }
        return res;
      },
    },
  };
}
