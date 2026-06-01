export interface LinkRecord {
  code: string;
  url: string;
  customCode: boolean;
  clicks: number;
  createdAt: number;
  expiresAt: number | null;
  source: "admin" | "public";
}

let kv: Deno.Kv | null = null;

export async function getKv(): Promise<Deno.Kv> {
  if (!kv) {
    kv = await Deno.openKv();
  }
  return kv;
}

export async function healthCheck(): Promise<boolean> {
  try {
    const db = await getKv();
    await db.get(["health_ping"]);
    return true;
  } catch {
    return false;
  }
}

export async function getLink(code: string): Promise<LinkRecord | null> {
  const db = await getKv();
  const entry = await db.get<LinkRecord>(["links", code]);
  return entry.value ?? null;
}

export async function createLink(record: LinkRecord): Promise<boolean> {
  const db = await getKv();
  const res = await db.atomic()
    .check({ key: ["links", record.code], versionstamp: null })
    .set(["links", record.code], record)
    .commit();
  return res.ok;
}

export async function updateLink(
  code: string,
  updates: Partial<Pick<LinkRecord, "url" | "expiresAt">>,
): Promise<LinkRecord | null> {
  const db = await getKv();
  const existing = await db.get<LinkRecord>(["links", code]);
  if (!existing.value) return null;

  const updated = { ...existing.value, ...updates };
  await db.set(["links", code], updated);
  return updated;
}

export async function deleteLink(code: string): Promise<boolean> {
  const db = await getKv();
  const existing = await db.get<LinkRecord>(["links", code]);
  if (!existing.value) return false;
  await db.delete(["links", code]);
  await db.delete(["clicks", code]);
  const iter = db.list({ prefix: ["clicks_daily", code] });
  for await (const entry of iter) {
    await db.delete(entry.key);
  }
  return true;
}

export async function incrementClicks(code: string): Promise<void> {
  const db = await getKv();
  const now = new Date();
  const dateStr = `${now.getFullYear()}-${
    String(now.getMonth() + 1).padStart(2, "0")
  }-${String(now.getDate()).padStart(2, "0")}`;

  await db.atomic()
    .sum(["clicks", code], 1n)
    .sum(["clicks_daily", code, dateStr], 1n)
    .commit();
}

export async function getClickCount(code: string): Promise<number> {
  const db = await getKv();
  const entry = await db.get<Deno.KvU64>(["clicks", code]);
  return Number(entry.value ?? 0n);
}

export async function getClickTimeSeries(
  code: string,
  days: number,
): Promise<{ date: string; count: number }[]> {
  const db = await getKv();
  const result: { date: string; count: number }[] = [];
  const now = new Date();

  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const dateStr = `${d.getFullYear()}-${
      String(d.getMonth() + 1).padStart(2, "0")
    }-${String(d.getDate()).padStart(2, "0")}`;
    const entry = await db.get<Deno.KvU64>(["clicks_daily", code, dateStr]);
    result.push({ date: dateStr, count: Number(entry.value ?? 0n) });
  }

  return result;
}

export async function getAllClickCounts(): Promise<Map<string, number>> {
  const db = await getKv();
  const map = new Map<string, number>();
  const iter = db.list<Deno.KvU64>({ prefix: ["clicks"] });
  for await (const entry of iter) {
    const code = entry.key[1] as string;
    map.set(code, Number(entry.value));
  }
  return map;
}

export async function getTopLinks(
  n: number,
): Promise<{ code: string; clicks: number }[]> {
  const map = await getAllClickCounts();
  const sorted = [...map.entries()].sort((a, b) => b[1] - a[1]);
  return sorted.slice(0, n).map(([code, clicks]) => ({ code, clicks }));
}

export async function getAggregateTimeSeries(
  days: number,
): Promise<{ date: string; count: number }[]> {
  const db = await getKv();
  const dateMap = new Map<string, number>();
  const now = new Date();

  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const dateStr = `${d.getFullYear()}-${
      String(d.getMonth() + 1).padStart(2, "0")
    }-${String(d.getDate()).padStart(2, "0")}`;
    dateMap.set(dateStr, 0);
  }

  const iter = db.list<Deno.KvU64>({ prefix: ["clicks_daily"] });
  for await (const entry of iter) {
    const dateStr = entry.key[2] as string;
    if (dateMap.has(dateStr)) {
      dateMap.set(dateStr, dateMap.get(dateStr)! + Number(entry.value));
    }
  }

  return [...dateMap.entries()].map(([date, count]) => ({ date, count }));
}

export interface ListOptions {
  page: number;
  limit: number;
  search?: string;
  sort?: "createdAt" | "code";
  order?: "asc" | "desc";
}

export interface ListResult {
  data: LinkRecord[];
  total: number;
  page: number;
  limit: number;
}

export async function listLinks(options: ListOptions): Promise<ListResult> {
  const db = await getKv();
  const allLinks: LinkRecord[] = [];
  const now = Date.now();

  const iter = db.list<LinkRecord>({ prefix: ["links"] });
  for await (const entry of iter) {
    const record = entry.value;
    if (!record.source) record.source = "admin";
    if (record.expiresAt !== null && record.expiresAt <= now) continue;
    if (options.search) {
      const q = options.search.toLowerCase();
      if (
        !record.code.toLowerCase().includes(q) &&
        !record.url.toLowerCase().includes(q)
      ) {
        continue;
      }
    }
    allLinks.push(record);
  }

  // 根据 sort 和 order 参数排序，默认按创建时间降序
  const sortField = options.sort ?? "createdAt";
  const sortOrder = options.order ?? "desc";
  allLinks.sort((a, b) => {
    let cmp: number;
    if (sortField === "code") {
      cmp = a.code.localeCompare(b.code);
    } else {
      cmp = a.createdAt - b.createdAt;
    }
    return sortOrder === "desc" ? -cmp : cmp;
  });

  const total = allLinks.length;
  const start = (options.page - 1) * options.limit;
  const data = allLinks.slice(start, start + options.limit);

  return { data, total, page: options.page, limit: options.limit };
}

export async function batchDeleteLinks(codes: string[]): Promise<number> {
  const db = await getKv();
  let deleted = 0;
  for (const code of codes) {
    const existing = await db.get<LinkRecord>(["links", code]);
    if (existing.value) {
      await db.delete(["links", code]);
      await db.delete(["clicks", code]);
      const iter = db.list({ prefix: ["clicks_daily", code] });
      for await (const entry of iter) {
        await db.delete(entry.key);
      }
      deleted++;
    }
  }
  return deleted;
}

export async function getAllLinks(): Promise<LinkRecord[]> {
  const db = await getKv();
  const allLinks: LinkRecord[] = [];

  const iter = db.list<LinkRecord>({ prefix: ["links"] });
  for await (const entry of iter) {
    const record = entry.value;
    if (!record.source) record.source = "admin";
    allLinks.push(record);
  }

  return allLinks;
}

// ---- Rate Limit ----

interface RateLimitEntry {
  count: number;
  windowStart: number;
}

export async function checkRateLimit(
  ip: string,
  limit: number,
  windowMs: number,
): Promise<{ allowed: boolean; remaining: number; resetAt: number }> {
  const db = await getKv();
  const key = ["rate_limit", ip];
  const now = Date.now();

  const entry = await db.get<RateLimitEntry>(key);
  const current = entry.value;

  if (!current || now - current.windowStart > windowMs) {
    // 新窗口开始
    await db.set(key, { count: 1, windowStart: now } as RateLimitEntry);
    return { allowed: true, remaining: limit - 1, resetAt: now + windowMs };
  }

  if (current.count >= limit) {
    return {
      allowed: false,
      remaining: 0,
      resetAt: current.windowStart + windowMs,
    };
  }

  const updated: RateLimitEntry = {
    count: current.count + 1,
    windowStart: current.windowStart,
  };
  await db.set(key, updated);
  return {
    allowed: true,
    remaining: limit - updated.count,
    resetAt: current.windowStart + windowMs,
  };
}
