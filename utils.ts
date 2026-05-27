const BASE62_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

const RESERVED_CODES = new Set([
  "api",
  "admin",
  "static",
  "health",
  "dashboard",
  "login",
  "favicon.ico",
  "robots.txt",
]);

export function isReservedCode(code: string): boolean {
  return RESERVED_CODES.has(code.toLowerCase());
}

export function isValidCode(code: string): boolean {
  return /^[a-zA-Z0-9_-]{3,32}$/.test(code);
}

export function generateCode(length = 6): string {
  let code = "";
  const arr = new Uint8Array(length);
  crypto.getRandomValues(arr);
  for (let i = 0; i < length; i++) {
    code += BASE62_CHARS[arr[i] % 62];
  }
  return code;
}

/**
 * Parse a human-readable TTL string into milliseconds.
 * Supports: 30m, 24h, 7d, 4w, null/empty = permanent
 */
export function parseTtl(input: string): number | null {
  const s = input.trim().toLowerCase();
  if (!s || s === "never" || s === "permanent" || s === "0") {
    return null;
  }

  const match = s.match(/^(\d+)\s*(m|h|d|w)$/);
  if (!match) {
    throw new Error(`Invalid TTL format: ${input}`);
  }

  const value = parseInt(match[1], 10);
  const unit = match[2];

  const MULTIPLIERS: Record<string, number> = {
    m: 60 * 1000,
    h: 60 * 60 * 1000,
    d: 24 * 60 * 60 * 1000,
    w: 7 * 24 * 60 * 60 * 1000,
  };

  return value * MULTIPLIERS[unit];
}

/**
 * Validate that a TTL is allowed for public links (max 30 days, no permanent).
 * Returns the parsed ms value, or null if invalid/not allowed.
 */
export function parsePublicTtl(input: string): { ms: number | null; error: string | null } {
  const s = input.trim().toLowerCase();
  if (!s || s === "never" || s === "permanent" || s === "0") {
    return { ms: null, error: "Public links cannot be permanent" };
  }

  try {
    const ms = parseTtl(input);
    if (ms === null) {
      return { ms: null, error: "Public links cannot be permanent" };
    }
    const maxMs = 30 * 24 * 60 * 60 * 1000; // 30 days
    if (ms > maxMs) {
      return { ms: null, error: "Public links cannot exceed 30 days" };
    }
    return { ms, error: null };
  } catch {
    return { ms: null, error: "Invalid TTL format" };
  }
}

/**
 * Extract client IP from request headers (for Deno Deploy / reverse proxy).
 */
export function getClientIp(headers: Headers): string {
  return headers.get("x-forwarded-for")?.split(",")[0]?.trim()
    || headers.get("x-real-ip")
    || "127.0.0.1";
}
