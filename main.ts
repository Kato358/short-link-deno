import { Hono } from "hono";
import { generateCode, isReservedCode, isValidCode, parseTtl, parsePublicTtl, getClientIp } from "./utils.ts";
import { authMiddleware, cookieAuthMiddleware, getApiKey, parseCookies } from "./auth.ts";
import {
  createLink,
  deleteLink,
  getLink,
  incrementClicks,
  listLinks,
  updateLink,
  batchDeleteLinks,
  getAllLinks,
  checkRateLimit,
  type LinkRecord,
} from "./db.ts";
import { dashboardPage, detailPage, loginPage, notFoundPage, publicPage } from "./templates.ts";
import { getLang, t } from "./i18n.ts";

const app = new Hono();

// --------------- Public API Routes (No Auth, Rate Limited) -----------

app.post("/api/public/links", async (c) => {
  const lang = getLang(c);
  const ip = getClientIp(c.req.raw.headers);
  const rateLimitResult = await checkRateLimit(ip, 20, 60 * 60 * 1000);

  if (!rateLimitResult.allowed) {
    return c.json({ error: t("rate_limit_error", lang) }, 429);
  }

  const body = await c.req.json<{ url?: string; ttl?: string }>();

  if (!body.url || !/^https?:\/\/.+/.test(body.url)) {
    return c.json({ error: t("invalid_url", lang) }, 400);
  }

  const ttlInput = body.ttl || "7d";
  const { ms: ttlMs, error: ttlError } = parsePublicTtl(ttlInput);
  if (ttlError) {
    return c.json({ error: ttlError }, 400);
  }

  const code = generateCode();
  const expiresAt = ttlMs === null ? null : Date.now() + ttlMs;

  const record: LinkRecord = {
    code,
    url: body.url,
    customCode: false,
    clicks: 0,
    createdAt: Date.now(),
    expiresAt,
    active: true,
    source: "public",
  };

  const ok = await createLink(record);
  if (!ok) {
    // Extremely unlikely with random codes, but retry once
    const code2 = generateCode();
    record.code = code2;
    const ok2 = await createLink(record);
    if (!ok2) {
      return c.json({ error: "Failed to generate unique code" }, 500);
    }
    const baseUrl = new URL(c.req.url).origin;
    return c.json({ code: code2, url: body.url, shortUrl: `${baseUrl}/${code2}`, expiresAt }, 201);
  }

  const baseUrl = new URL(c.req.url).origin;
  return c.json({ code, url: body.url, shortUrl: `${baseUrl}/${code}`, expiresAt }, 201);
});

// --------------- API Routes (Bearer / Query Key Auth) ---------------

app.post("/api/links", authMiddleware, async (c) => {
  const contentType = c.req.header("Content-Type") || "";
  let url: string | undefined;
  let code: string | undefined;
  let ttl: string | undefined;

  if (contentType.includes("application/x-www-form-urlencoded") || contentType.includes("multipart/form-data")) {
    const formData = await c.req.formData();
    url = formData.get("url")?.toString();
    code = formData.get("code")?.toString().trim() || undefined;
    ttl = formData.get("ttl")?.toString();
  } else {
    const body = await c.req.json<{ url?: string; code?: string; ttl?: string }>();
    url = body.url;
    code = body.code;
    ttl = body.ttl;
  }

  if (!url || !/^https?:\/\/.+/.test(url)) {
    return c.json({ error: "Invalid URL" }, 400);
  }

  const finalCode = code || generateCode();

  if (!isValidCode(finalCode)) {
    return c.json({ error: "Invalid code format. Use 3-32 alphanumeric, dash or underscore characters." }, 400);
  }

  if (isReservedCode(finalCode)) {
    return c.json({ error: "Reserved code" }, 400);
  }

  const ttlMs = parseTtl(ttl || "7d");
  const expiresAt = ttlMs === null ? null : Date.now() + ttlMs;

  const record: LinkRecord = {
    code: finalCode,
    url,
    customCode: !!code,
    clicks: 0,
    createdAt: Date.now(),
    expiresAt,
    active: true,
    source: "admin",
  };

  const ok = await createLink(record);
  if (!ok) {
    return c.json({ error: "Code already exists" }, 409);
  }

  const baseUrl = new URL(c.req.url).origin;
  return c.json({ code: finalCode, url, shortUrl: `${baseUrl}/${finalCode}`, expiresAt }, 201);
});

app.get("/api/links", authMiddleware, async (c) => {
  const page = Math.max(1, parseInt(c.req.query("page") || "1", 10));
  const limit = Math.min(100, Math.max(1, parseInt(c.req.query("limit") || "20", 10)));
  const search = c.req.query("search") || undefined;

  const result = await listLinks({ page, limit, search });
  return c.json(result);
});

app.get("/api/links/:code", authMiddleware, async (c) => {
  const code = c.req.param("code")!;
  const link = await getLink(code);

  if (!link || !link.active) {
    return c.json({ error: "Not found" }, 404);
  }

  return c.json({
    code: link.code,
    url: link.url,
    clicks: link.clicks,
    createdAt: link.createdAt,
    expiresAt: link.expiresAt,
  });
});

app.put("/api/links/:code", authMiddleware, async (c) => {
  const code = c.req.param("code")!;
  const body = await c.req.json<{ url?: string }>();

  if (!body.url || !/^https?:\/\/.+/.test(body.url)) {
    return c.json({ error: "Invalid URL" }, 400);
  }

  const updated = await updateLink(code, { url: body.url });
  if (!updated) {
    return c.json({ error: "Not found" }, 404);
  }

  return c.json({
    code: updated.code,
    url: updated.url,
    clicks: updated.clicks,
    createdAt: updated.createdAt,
    expiresAt: updated.expiresAt,
  });
});

app.delete("/api/links/:code", authMiddleware, async (c) => {
  const code = c.req.param("code")!;
  const ok = await deleteLink(code);

  if (!ok) {
    return c.json({ error: "Not found" }, 404);
  }

  return c.json({ ok: true });
});

app.delete("/api/links", authMiddleware, async (c) => {
  const body = await c.req.json<{ codes?: string[] }>();

  if (!body.codes || !Array.isArray(body.codes) || body.codes.length === 0) {
    return c.json({ error: "codes array is required" }, 400);
  }

  const deleted = await batchDeleteLinks(body.codes);
  return c.json({ deleted });
});

// --------------- Dashboard Routes (Cookie Auth) ---------------------

app.get("/dashboard", async (c) => {
  const lang = getLang(c);

  // Check authentication inline - show login form if not authenticated
  const cookies = parseCookies(c.req.header("Cookie") || "");
  const sessionKey = cookies["api_key"];
  let expectedKey: string;
  try {
    expectedKey = getApiKey();
  } catch {
    return c.html(loginPage(t("server_error", lang), lang));
  }

  if (!sessionKey || decodeURIComponent(sessionKey) !== expectedKey) {
    return c.html(loginPage(undefined, lang));
  }

  const page = Math.max(1, parseInt(c.req.query("page") || "1", 10));
  const search = c.req.query("search") || "";
  const links = await listLinks({ page, limit: 20, search: search || undefined });
  const baseUrl = new URL(c.req.url).origin;

  // Compute statistics from all links (including soft-deleted)
  const allLinks = await getAllLinks();
  const now = Date.now();
  const totalCount = allLinks.length;
  const activeCount = allLinks.filter(l => l.active && (l.expiresAt === null || l.expiresAt > now)).length;
  const expiredCount = allLinks.filter(l => l.active && l.expiresAt !== null && l.expiresAt <= now).length;

  return c.html(
    dashboardPage({
      links,
      search,
      baseUrl,
      lang,
      error: c.req.query("error") || undefined,
      success: c.req.query("success") || undefined,
      stats: { total: totalCount, active: activeCount, expired: expiredCount },
    }),
  );
});

app.get("/dashboard/:code", cookieAuthMiddleware, async (c) => {
  const code = c.req.param("code")!;
  const link = await getLink(code);
  const lang = getLang(c);

  if (!link || !link.active) {
    return c.html(notFoundPage(lang), 404);
  }

  const baseUrl = new URL(c.req.url).origin;

  return c.html(
    detailPage({
      link: {
        code: link.code,
        url: link.url,
        clicks: link.clicks,
        createdAt: link.createdAt,
        expiresAt: link.expiresAt,
        customCode: link.customCode,
        active: link.active,
      },
      baseUrl,
      lang,
      error: c.req.query("error") || undefined,
      success: c.req.query("success") || undefined,
    }),
  );
});

// --------------- Login / Auth Actions --------------------------------

app.post("/login", async (c) => {
  const formData = await c.req.formData();
  const apiKey = formData.get("apiKey")?.toString() || "";
  const lang = getLang(c);

  try {
    const expectedKey = getApiKey();
    if (apiKey !== expectedKey) {
      return c.html(loginPage(t("invalid_api_key", lang), lang));
    }
  } catch {
    return c.html(loginPage(t("server_error", lang), lang));
  }

  const isSecure = new URL(c.req.url).protocol === "https:";
  c.header(
    "Set-Cookie",
    `api_key=${encodeURIComponent(apiKey)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=86400${
      isSecure ? "; Secure" : ""
    }`,
  );
  return c.redirect("/dashboard");
});

app.post("/dashboard/create", cookieAuthMiddleware, async (c) => {
  const formData = await c.req.formData();
  const url = formData.get("url")?.toString() || "";
  const customCode = formData.get("code")?.toString().trim() || "";
  const ttlStr = formData.get("ttl")?.toString() || "7d";
  const lang = getLang(c);

  const baseUrl = new URL(c.req.url).origin;

  if (!/^https?:\/\/.+/.test(url)) {
    return c.redirect("/dashboard?error=" + encodeURIComponent(t("invalid_url", lang)));
  }

  const code = customCode || generateCode();

  if (!isValidCode(code)) {
    return c.redirect("/dashboard?error=" + encodeURIComponent(t("invalid_code", lang)));
  }

  if (isReservedCode(code)) {
    return c.redirect("/dashboard?error=" + encodeURIComponent(t("code_reserved", lang)));
  }

  let ttlMs: number | null;
  try {
    ttlMs = parseTtl(ttlStr);
  } catch {
    return c.redirect("/dashboard?error=" + encodeURIComponent(t("invalid_ttl", lang)));
  }

  const expiresAt = ttlMs === null ? null : Date.now() + ttlMs;

  const record: LinkRecord = {
    code,
    url,
    customCode: !!customCode,
    clicks: 0,
    createdAt: Date.now(),
    expiresAt,
    active: true,
    source: "admin",
  };

  const ok = await createLink(record);
  if (!ok) {
    return c.redirect("/dashboard?error=" + encodeURIComponent(t("code_exists", lang)));
  }

  return c.redirect(
    "/dashboard?success=" + encodeURIComponent(t("link_created", lang).replace("{url}", `${baseUrl}/${code}`)),
  );
});

app.post("/dashboard/:code/delete", cookieAuthMiddleware, async (c) => {
  const code = c.req.param("code")!;
  const lang = getLang(c);
  await deleteLink(code);
  return c.redirect("/dashboard?success=" + encodeURIComponent(t("link_deleted", lang)));
});

app.post("/dashboard/batch-delete", cookieAuthMiddleware, async (c) => {
  const formData = await c.req.formData();
  const codesRaw = formData.get("codes")?.toString() || "";
  const lang = getLang(c);

  if (!codesRaw) {
    return c.redirect("/dashboard?error=" + encodeURIComponent(t("no_selection", lang)));
  }

  const codes = codesRaw.split(",").filter(Boolean);
  if (codes.length === 0) {
    return c.redirect("/dashboard?error=" + encodeURIComponent(t("no_selection", lang)));
  }

  await batchDeleteLinks(codes);
  return c.redirect("/dashboard?success=" + encodeURIComponent(t("link_deleted", lang)));
});

// --------------- Redirect Route (No Auth) ----------------------------

app.get("/:code", async (c) => {
  const code = c.req.param("code")!;
  const link = await getLink(code);
  const lang = getLang(c);

  if (!link || !link.active) {
    return c.html(notFoundPage(lang), 404);
  }

  if (link.expiresAt !== null && link.expiresAt < Date.now()) {
    return c.html(notFoundPage(lang), 404);
  }

  // Atomic click increment (non-blocking)
  incrementClicks(code);

  return c.redirect(link.url, 302);
});

// --------------- Language Route ------------------------------------

app.get("/lang/:locale", (c) => {
  const locale = c.req.param("locale");
  const lang = (locale === "zh" || locale === "en") ? locale : "zh";
  const referer = c.req.header("Referer") || "/";
  c.header("Set-Cookie", `lang=${lang}; Path=/; Max-Age=31536000; SameSite=Lax`);
  return c.redirect(referer);
});

// --------------- Root Route ------------------------------------------

app.get("/", (c) => {
  const lang = getLang(c);
  const baseUrl = new URL(c.req.url).origin;

  // Check login status via cookie
  const cookies = parseCookies(c.req.header("Cookie") || "");
  const sessionKey = cookies["api_key"];
  let isLoggedIn = false;
  try {
    const expectedKey = getApiKey();
    if (sessionKey && decodeURIComponent(sessionKey) === expectedKey) {
      isLoggedIn = true;
    }
  } catch {
    // API_KEY not set, stay as public
  }

  return c.html(publicPage({ lang, baseUrl, isLoggedIn }));
});

// --------------- Start Server ----------------------------------------

const port = parseInt(Deno.env.get("PORT") || "3000", 10);
Deno.serve({ port }, app.fetch);
