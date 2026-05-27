import type { Context, Next } from "hono";

export function getApiKey(): string {
  const key = Deno.env.get("API_KEY");
  if (!key) {
    throw new Error("API_KEY environment variable is not set");
  }
  return key;
}

export function parseCookies(header: string): Record<string, string> {
  const cookies: Record<string, string> = {};
  if (!header) return cookies;

  for (const pair of header.split(";")) {
    const idx = pair.indexOf("=");
    if (idx === -1) continue;
    const key = pair.slice(0, idx).trim();
    const value = pair.slice(idx + 1).trim();
    cookies[key] = value;
  }
  return cookies;
}

export function extractApiKey(c: Context): string | null {
  const authHeader = c.req.header("Authorization");
  if (authHeader?.startsWith("Bearer ")) {
    return authHeader.slice(7).trim();
  }

  const queryKey = c.req.query("key");
  if (queryKey) {
    return queryKey.trim();
  }

  // Fallback: read api_key cookie (for form submissions that can't set headers)
  const cookies = parseCookies(c.req.header("Cookie") ?? "");
  const cookieKey = cookies["api_key"];
  if (cookieKey) {
    return decodeURIComponent(cookieKey);
  }

  return null;
}

export function authMiddleware(c: Context, next: Next): Response | Promise<Response | void> {
  const expectedKey = getApiKey();
  const providedKey = extractApiKey(c);

  if (!providedKey || providedKey !== expectedKey) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  return next();
}

export function cookieAuthMiddleware(
  c: Context,
  next: Next,
): Response | Promise<Response | void> {
  const expectedKey = getApiKey();
  const cookies = parseCookies(c.req.header("Cookie") ?? "");
  const sessionKey = cookies["api_key"];

  if (!sessionKey || decodeURIComponent(sessionKey) !== expectedKey) {
    return c.redirect("/dashboard");
  }

  return next();
}
