export interface LinkRecord {
  code: string;
  url: string;
  customCode: boolean;
  clicks: number;
  createdAt: number;
  expiresAt: number | null;
  active: boolean;
  source: "admin" | "public";
}

let kv: Deno.Kv | null = null;

export async function getKv(): Promise<Deno.Kv> {
  if (!kv) {
    kv = await Deno.openKv();
  }
  return kv;
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
  updates: Partial<Pick<LinkRecord, "url" | "active">>,
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
  return true;
}

export async function incrementClicks(code: string): Promise<void> {
  const db = await getKv();
  const key = ["links", code];
  let success = false;

  while (!success) {
    const entry = await db.get<LinkRecord>(key);
    if (!entry.value) break;

    const updated = { ...entry.value, clicks: entry.value.clicks + 1 };
    const res = await db.atomic()
      .check(entry)
      .set(key, updated)
      .commit();
    success = res.ok;
  }
}

export interface ListOptions {
  page: number;
  limit: number;
  search?: string;
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

  const iter = db.list<LinkRecord>({ prefix: ["links"] });
  for await (const entry of iter) {
    const record = entry.value;
    // Backward compat: default source to "admin" for old records
    if (!record.source) record.source = "admin";
    if (!record.active) continue;
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

  allLinks.sort((a, b) => b.createdAt - a.createdAt);

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

export async function checkRateLimit(ip: string, limit: number, windowMs: number): Promise<{ allowed: boolean; remaining: number }> {
  const db = await getKv();
  const key = ["rate_limit", ip];
  const now = Date.now();

  const entry = await db.get<RateLimitEntry>(key);
  const current = entry.value;

  if (!current || now - current.windowStart > windowMs) {
    // Start new window
    await db.set(key, { count: 1, windowStart: now } as RateLimitEntry);
    return { allowed: true, remaining: limit - 1 };
  }

  if (current.count >= limit) {
    return { allowed: false, remaining: 0 };
  }

  // Increment within existing window
  const updated: RateLimitEntry = { count: current.count + 1, windowStart: current.windowStart };
  await db.set(key, updated);
  return { allowed: true, remaining: limit - updated.count };
}
