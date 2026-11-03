/** Thin fetch wrapper for our JSON API. Throws an Error whose message is safe to show to the user. */
export class ApiClientError extends Error {
  constructor(message: string, public status: number) {
    super(message);
  }
}

export async function api<T = unknown>(url: string, opts: { method?: string; body?: unknown } = {}): Promise<T> {
  let res: Response;
  try {
    res = await fetch(url, {
      method: opts.method ?? (opts.body ? "POST" : "GET"),
      headers: opts.body ? { "Content-Type": "application/json" } : undefined,
      body: opts.body ? JSON.stringify(opts.body) : undefined,
      credentials: "same-origin",
      cache: "no-store",
      signal: AbortSignal.timeout(30_000), // never leave a button on "Please wait…" forever
    });
  } catch (e) {
    if (e instanceof DOMException && e.name === "TimeoutError") throw new ApiClientError("The server is taking too long to respond. Please try again.", 0);
    throw new ApiClientError("Can't reach the server. Check your connection and try again.", 0);
  }
  const data = await res.json().catch(() => null);
  if (!res.ok) throw new ApiClientError((data && typeof data.error === "string" && data.error) || "Something went wrong. Please try again.", res.status);
  return data as T;
}
