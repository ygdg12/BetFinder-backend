const DEFAULT_BASE_URL = "https://api.apify.com/v2";

const getApifyToken = () => {
  const token = process.env.APIFY_TOKEN;
  if (!token || !token.trim()) {
    const err = new Error("APIFY_TOKEN is not set");
    err.statusCode = 500;
    throw err;
  }
  return token.trim();
};

const getApifyBaseUrl = () => String(process.env.APIFY_BASE_URL || DEFAULT_BASE_URL).replace(/\/+$/, "");

const apifyFetch = async (path, { method = "GET", query = {}, body } = {}) => {
  if (typeof fetch !== "function") {
    const err = new Error("Global fetch is not available (requires Node.js 18+)");
    err.statusCode = 500;
    throw err;
  }

  const url = new URL(getApifyBaseUrl() + path);
  url.searchParams.set("token", getApifyToken());
  Object.entries(query || {}).forEach(([k, v]) => {
    if (v === undefined || v === null) return;
    url.searchParams.set(k, String(v));
  });

  const res = await fetch(url, {
    method,
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });

  const text = await res.text();
  let parsed;
  try {
    parsed = text ? JSON.parse(text) : null;
  } catch {
    parsed = { raw: text };
  }

  if (!res.ok) {
    const message = parsed?.error?.message || parsed?.message || `Apify request failed (${res.status})`;
    const err = new Error(message);
    err.statusCode = 502;
    err.details = parsed;
    throw err;
  }

  return parsed;
};

const startActorRun = async ({ actorId, input, waitForFinish = 0, memory, timeout }) => {
  if (!actorId || !String(actorId).trim()) {
    const err = new Error("actorId is required");
    err.statusCode = 400;
    throw err;
  }

  return apifyFetch(`/acts/${encodeURIComponent(String(actorId).trim())}/runs`, {
    method: "POST",
    query: {
      waitForFinish,
      ...(memory ? { memory } : {}),
      ...(timeout ? { timeout } : {}),
    },
    body: input || {},
  });
};

const getRun = async (runId) => {
  if (!runId || !String(runId).trim()) {
    const err = new Error("runId is required");
    err.statusCode = 400;
    throw err;
  }
  return apifyFetch(`/actor-runs/${encodeURIComponent(String(runId).trim())}`);
};

const listDatasetItems = async ({ datasetId, limit = 1000, offset = 0, clean = true, desc = false }) => {
  if (!datasetId || !String(datasetId).trim()) {
    const err = new Error("datasetId is required");
    err.statusCode = 400;
    throw err;
  }

  const url = new URL(getApifyBaseUrl() + `/datasets/${encodeURIComponent(String(datasetId).trim())}/items`);
  url.searchParams.set("token", getApifyToken());
  url.searchParams.set("format", "json");
  url.searchParams.set("clean", clean ? "true" : "false");
  url.searchParams.set("desc", desc ? "true" : "false");
  url.searchParams.set("limit", String(limit));
  url.searchParams.set("offset", String(offset));

  const res = await fetch(url, { method: "GET" });
  const text = await res.text();

  if (!res.ok) {
    let parsed;
    try {
      parsed = text ? JSON.parse(text) : null;
    } catch {
      parsed = { raw: text };
    }
    const err = new Error(parsed?.error?.message || `Apify dataset items request failed (${res.status})`);
    err.statusCode = 502;
    err.details = parsed;
    throw err;
  }

  return text ? JSON.parse(text) : [];
};

module.exports = { startActorRun, getRun, listDatasetItems };

