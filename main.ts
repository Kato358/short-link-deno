import { Hono } from "hono";
import {
  generateCode,
  getClientIp,
  isBot,
  isReservedCode,
  isValidCode,
  parsePublicTtl,
  parseTtl,
} from "./utils.ts";
import {
  authMiddleware,
  cookieAuthMiddleware,
  getApiKey,
  parseCookies,
} from "./auth.ts";
import {
  batchDeleteLinks,
  checkRateLimit,
  createLink,
  deleteLink,
  getAggregateTimeSeries,
  getAllClickCounts,
  getAllLinks,
  getClickCount,
  getClickTimeSeries,
  getLink,
  getTopLinks,
  healthCheck,
  incrementClicks,
  type LinkRecord,
  listLinks,
  updateLink,
} from "./db.ts";
import {
  dashboardPage,
  detailPage,
  loginPage,
  notFoundPage,
  publicPage,
} from "./templates.ts";
import { generateQRPng } from "./qrcode.ts";
import { getLang, t } from "./i18n.ts";

const app = new Hono();

// --------------- Health Check -----------------------------------------

app.get("/health", async (c) => {
  const ok = await healthCheck();
  if (ok) {
    return c.json({ status: "ok", kv: true, timestamp: Date.now() });
  }
  return c.json({ status: "error", kv: false, timestamp: Date.now() }, 503);
});

// --------------- robots.txt ------------------------------------------

app.get("/robots.txt", (c) => {
  return c.text(
    "User-agent: *\nDisallow: /api/\nDisallow: /dashboard\nDisallow: /login\nDisallow: /logout\nDisallow: /lang/\nAllow: /\n",
  );
});

// --------------- Public API Routes (No Auth, Rate Limited) -----------

app.post("/api/public/links", async (c) => {
  const ip = getClientIp(c.req.raw.headers);
  const rateLimitResult = await checkRateLimit(ip, 20, 60 * 60 * 1000);

  if (!rateLimitResult.allowed) {
    return c.json({ error: "Rate limit exceeded" }, 429);
  }

  const body = await c.req.json<{ url?: string; ttl?: string }>();

  if (!body.url || !/^https?:\/\/.+/.test(body.url)) {
    return c.json({ error: "Invalid URL" }, 400);
  }

  const ttlInput = body.ttl || "7d";
  const { ms: ttlMs, error: ttlError } = parsePublicTtl(ttlInput);
  if (ttlError) {
    return c.json({ error: ttlError }, 400);
  }

  const expiresAt = ttlMs === null ? null : Date.now() + ttlMs;
  const baseUrl = new URL(c.req.url).origin;

  for (let attempt = 0; attempt < 3; attempt++) {
    const code = generateCode();
    const record: LinkRecord = {
      code,
      url: body.url,
      customCode: false,
      clicks: 0,
      createdAt: Date.now(),
      expiresAt,
      source: "public",
    };

    const ok = await createLink(record);
    if (ok) {
      return c.json({
        code,
        url: body.url,
        shortUrl: `${baseUrl}/${code}`,
        expiresAt,
      }, 201);
    }
  }

  return c.json({ error: "Failed to generate unique code" }, 500);
});

// --------------- API Routes (Bearer / Query Key Auth) ---------------

app.post("/api/links", authMiddleware, async (c) => {
  const contentType = c.req.header("Content-Type") || "";
  let url: string | undefined;
  let code: string | undefined;
  let ttl: string | undefined;

  if (
    contentType.includes("application/x-www-form-urlencoded") ||
    contentType.includes("multipart/form-data")
  ) {
    const formData = await c.req.formData();
    url = formData.get("url")?.toString();
    code = formData.get("code")?.toString().trim() || undefined;
    ttl = formData.get("ttl")?.toString();
  } else {
    const body = await c.req.json<
      { url?: string; code?: string; ttl?: string }
    >();
    url = body.url;
    code = body.code;
    ttl = body.ttl;
  }

  if (!url || !/^https?:\/\/.+/.test(url)) {
    return c.json({ error: "Invalid URL" }, 400);
  }

  const ttlMs = parseTtl(ttl || "7d");
  const expiresAt = ttlMs === null ? null : Date.now() + ttlMs;
  const baseUrl = new URL(c.req.url).origin;

  if (code) {
    if (!isValidCode(code)) {
      return c.json({
        error:
          "Invalid code format. Use 3-32 alphanumeric, dash or underscore characters.",
      }, 400);
    }
    if (isReservedCode(code)) {
      return c.json({ error: "Reserved code" }, 400);
    }

    const record: LinkRecord = {
      code,
      url,
      customCode: true,
      clicks: 0,
      createdAt: Date.now(),
      expiresAt,
      source: "admin",
    };

    const ok = await createLink(record);
    if (!ok) {
      return c.json({ error: "Code already exists" }, 409);
    }
    return c.json(
      { code, url, shortUrl: `${baseUrl}/${code}`, expiresAt },
      201,
    );
  }

  for (let attempt = 0; attempt < 3; attempt++) {
    const autoCode = generateCode();
    const record: LinkRecord = {
      code: autoCode,
      url,
      customCode: false,
      clicks: 0,
      createdAt: Date.now(),
      expiresAt,
      source: "admin",
    };

    const ok = await createLink(record);
    if (ok) {
      return c.json({
        code: autoCode,
        url,
        shortUrl: `${baseUrl}/${autoCode}`,
        expiresAt,
      }, 201);
    }
  }

  return c.json({ error: "Failed to generate unique code" }, 500);
});

app.get("/api/links", authMiddleware, async (c) => {
  const page = Math.max(1, parseInt(c.req.query("page") || "1", 10));
  const limit = Math.min(
    100,
    Math.max(1, parseInt(c.req.query("limit") || "20", 10)),
  );
  const search = c.req.query("search") || undefined;

  const result = await listLinks({ page, limit, search });
  return c.json(result);
});

app.get("/api/links/top", authMiddleware, async (c) => {
  const n = Math.min(50, Math.max(1, parseInt(c.req.query("n") || "5", 10)));
  const top = await getTopLinks(n);
  return c.json(top);
});

app.get("/api/links/:code", authMiddleware, async (c) => {
  const code = c.req.param("code")!;
  const link = await getLink(code);

  if (!link) {
    return c.json({ error: "Not found" }, 404);
  }

  if (link.expiresAt !== null && link.expiresAt <= Date.now()) {
    return c.json({ error: "Not found" }, 404);
  }

  const clicks = await getClickCount(code);

  return c.json({
    code: link.code,
    url: link.url,
    clicks,
    createdAt: link.createdAt,
    expiresAt: link.expiresAt,
  });
});

app.get("/api/links/:code/stats", authMiddleware, async (c) => {
  const code = c.req.param("code")!;
  const days = Math.min(
    90,
    Math.max(1, parseInt(c.req.query("days") || "7", 10)),
  );
  const link = await getLink(code);

  if (!link) {
    return c.json({ error: "Not found" }, 404);
  }

  const timeSeries = await getClickTimeSeries(code, days);
  const total = await getClickCount(code);

  return c.json({ code, total, days, timeSeries });
});

app.put("/api/links/:code", authMiddleware, async (c) => {
  const code = c.req.param("code")!;
  const body = await c.req.json<{ url?: string; ttl?: string }>();

  if (!body.url || !/^https?:\/\/.+/.test(body.url)) {
    return c.json({ error: "Invalid URL" }, 400);
  }

  const updates: Partial<Pick<LinkRecord, "url" | "expiresAt">> = {
    url: body.url,
  };

  if (body.ttl !== undefined) {
    const ttlMs = parseTtl(body.ttl);
    updates.expiresAt = ttlMs === null ? null : Date.now() + ttlMs;
  }

  const updated = await updateLink(code, updates);
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
  const links = await listLinks({
    page,
    limit: 20,
    search: search || undefined,
  });
  const baseUrl = new URL(c.req.url).origin;

  const allLinks = await getAllLinks();
  const now = Date.now();
  const totalCount = allLinks.length;
  const expiredCount = allLinks.filter((l) =>
    l.expiresAt !== null && l.expiresAt <= now
  ).length;
  const activeCount = totalCount - expiredCount;

  const clickCounts = await getAllClickCounts();
  const realtimeClicks: Record<string, number> = {};
  for (const [k, v] of clickCounts) {
    realtimeClicks[k] = v;
  }

  const topLinksData = await getTopLinks(5);
  const topLinksWithUrls: Array<{ code: string; clicks: number; url: string }> =
    [];
  for (const item of topLinksData) {
    const link = await getLink(item.code);
    if (link) {
      topLinksWithUrls.push({
        code: item.code,
        clicks: item.clicks,
        url: link.url,
      });
    }
  }

  const timeSeries30 = await getAggregateTimeSeries(30);

  return c.html(
    dashboardPage({
      links,
      search,
      baseUrl,
      lang,
      error: c.req.query("error") || undefined,
      success: c.req.query("success") || undefined,
      stats: { total: totalCount, active: activeCount, expired: expiredCount },
      realtimeClicks,
      topLinks: topLinksWithUrls,
      timeSeries: timeSeries30,
    }),
  );
});

app.get("/dashboard/:code", cookieAuthMiddleware, async (c) => {
  const code = c.req.param("code")!;
  const link = await getLink(code);
  const lang = getLang(c);

  if (!link || (link.expiresAt !== null && link.expiresAt <= Date.now())) {
    return c.html(notFoundPage(lang), 404);
  }

  const baseUrl = new URL(c.req.url).origin;
  const clicks = await getClickCount(code);

  return c.html(
    detailPage({
      link: {
        code: link.code,
        url: link.url,
        clicks,
        createdAt: link.createdAt,
        expiresAt: link.expiresAt,
        customCode: link.customCode,
      },
      baseUrl,
      lang,
      error: c.req.query("error") || undefined,
      success: c.req.query("success") || undefined,
    }),
  );
});

// --------------- Login / Auth Actions --------------------------------

app.get("/logout", (c) => {
  const isSecure = new URL(c.req.url).protocol === "https:";
  c.header(
    "Set-Cookie",
    `api_key=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0${
      isSecure ? "; Secure" : ""
    }`,
  );
  return c.redirect("/");
});

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
    `api_key=${
      encodeURIComponent(apiKey)
    }; Path=/; HttpOnly; SameSite=Lax; Max-Age=86400${
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
    return c.redirect(
      "/dashboard?error=" + encodeURIComponent(t("invalid_url", lang)),
    );
  }

  const code = customCode || generateCode();

  if (!isValidCode(code)) {
    return c.redirect(
      "/dashboard?error=" + encodeURIComponent(t("invalid_code", lang)),
    );
  }

  if (isReservedCode(code)) {
    return c.redirect(
      "/dashboard?error=" + encodeURIComponent(t("code_reserved", lang)),
    );
  }

  let ttlMs: number | null;
  try {
    ttlMs = parseTtl(ttlStr);
  } catch {
    return c.redirect(
      "/dashboard?error=" + encodeURIComponent(t("invalid_ttl", lang)),
    );
  }

  const expiresAt = ttlMs === null ? null : Date.now() + ttlMs;

  const record: LinkRecord = {
    code,
    url,
    customCode: !!customCode,
    clicks: 0,
    createdAt: Date.now(),
    expiresAt,
    source: "admin",
  };

  const ok = await createLink(record);
  if (!ok) {
    return c.redirect(
      "/dashboard?error=" + encodeURIComponent(t("code_exists", lang)),
    );
  }

  return c.redirect(
    "/dashboard?success=" +
      encodeURIComponent(
        t("link_created", lang).replace("{url}", `${baseUrl}/${code}`),
      ),
  );
});

app.post("/dashboard/:code/update", cookieAuthMiddleware, async (c) => {
  const code = c.req.param("code")!;
  const formData = await c.req.formData();
  const url = formData.get("url")?.toString() || "";
  const ttl = formData.get("ttl")?.toString();
  const lang = getLang(c);

  if (!/^https?:\/\/.+/.test(url)) {
    return c.redirect(
      `/dashboard/${code}?error=${encodeURIComponent(t("invalid_url", lang))}`,
    );
  }

  const updates: Partial<Pick<LinkRecord, "url" | "expiresAt">> = { url };

  if (ttl !== undefined) {
    try {
      const ttlMs = parseTtl(ttl);
      updates.expiresAt = ttlMs === null ? null : Date.now() + ttlMs;
    } catch {
      return c.redirect(
        `/dashboard/${code}?error=${
          encodeURIComponent(t("invalid_ttl", lang))
        }`,
      );
    }
  }

  const updated = await updateLink(code, updates);
  if (!updated) {
    return c.redirect(`/dashboard/${code}?error=Not+found`);
  }

  return c.redirect(
    `/dashboard/${code}?success=${encodeURIComponent(t("link_updated", lang))}`,
  );
});

app.post("/dashboard/:code/delete", cookieAuthMiddleware, async (c) => {
  const code = c.req.param("code")!;
  const lang = getLang(c);
  await deleteLink(code);
  return c.redirect(
    "/dashboard?success=" + encodeURIComponent(t("link_deleted", lang)),
  );
});

app.post("/dashboard/batch-delete", cookieAuthMiddleware, async (c) => {
  const formData = await c.req.formData();
  const codesRaw = formData.get("codes")?.toString() || "";
  const lang = getLang(c);

  if (!codesRaw) {
    return c.redirect(
      "/dashboard?error=" + encodeURIComponent(t("no_selection", lang)),
    );
  }

  const codes = codesRaw.split(",").filter(Boolean);
  if (codes.length === 0) {
    return c.redirect(
      "/dashboard?error=" + encodeURIComponent(t("no_selection", lang)),
    );
  }

  await batchDeleteLinks(codes);
  return c.redirect(
    "/dashboard?success=" + encodeURIComponent(t("link_deleted", lang)),
  );
});

// --------------- QR Code Image (No Auth) ------------------------------

app.get("/qr/:code", async (c) => {
  const code = c.req.param("code")!;
  if (!/^[a-zA-Z0-9_-]{3,32}$/.test(code)) {
    return c.text("Invalid code", 400);
  }
  const baseUrl = new URL(c.req.url).origin;
  const png = await generateQRPng(`${baseUrl}/${code}`);
  if (png.length === 0) return c.text("Failed to generate QR", 500);
  return new Response(png as unknown as BodyInit, {
    headers: {
      "Content-Type": "image/png",
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
});

// --------------- Redirect Route (No Auth) ----------------------------

app.get("/:code", async (c) => {
  const code = c.req.param("code")!;
  const link = await getLink(code);
  const lang = getLang(c);

  if (!link) {
    return c.html(notFoundPage(lang), 404);
  }

  if (link.expiresAt !== null && link.expiresAt <= Date.now()) {
    return c.html(notFoundPage(lang), 404);
  }

  const ua = c.req.header("User-Agent") || "";
  if (isBot(ua)) {
    return c.html(
      `<!DOCTYPE html><html><head><meta http-equiv="refresh" content="0;url=${link.url}"><title>Redirect</title></head><body>Redirecting to <a href="${link.url}">${link.url}</a></body></html>`,
      200,
    );
  }

  incrementClicks(code);

  return c.redirect(link.url, 302);
});

// --------------- Language Route ------------------------------------

app.get("/lang/:locale", (c) => {
  const locale = c.req.param("locale");
  const lang = (locale === "zh" || locale === "en") ? locale : "zh";
  const referer = c.req.header("Referer") || "/";
  c.header(
    "Set-Cookie",
    `lang=${lang}; Path=/; Max-Age=31536000; SameSite=Lax`,
  );
  return c.redirect(referer);
});

// --------------- Root Route ------------------------------------------

app.get("/", (c) => {
  const lang = getLang(c);
  const baseUrl = new URL(c.req.url).origin;

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
