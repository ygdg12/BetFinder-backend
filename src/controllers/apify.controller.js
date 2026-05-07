const Property = require("../models/Property");
const User = require("../models/User");
const { toBool, toNumber } = require("../utils/property");
const { startActorRun, getRun, listDatasetItems } = require("../utils/apify");

const getImportAgent = async () => {
  const email = String(process.env.APIFY_IMPORT_AGENT_EMAIL || process.env.ADMIN_EMAIL || "").trim().toLowerCase();
  if (!email) {
    const err = new Error("APIFY_IMPORT_AGENT_EMAIL (or ADMIN_EMAIL) must be set");
    err.statusCode = 500;
    throw err;
  }

  const user = await User.findOne({ email }).select("_id role email");
  if (!user) {
    const err = new Error(`Import user not found for email: ${email}`);
    err.statusCode = 500;
    throw err;
  }

  return user;
};

const normalizeApifyItem = (item) => {
  if (!item || typeof item !== "object") return null;

  const sourceUrl = item.url || item.sourceUrl || item.listingUrl || item.link || item.href;
  const externalId = item.id || item.externalId || item.listingId || sourceUrl;

  const title = item.title || item.name || item.headline;
  const description = item.description || item.details || item.summary || "";
  const images = Array.isArray(item.images) ? item.images : Array.isArray(item.imageUrls) ? item.imageUrls : item.image ? [item.image] : [];

  const price = toNumber(item.price ?? item.amount ?? item.rent ?? item.salePrice);
  const priceType = item.priceType || item.listingType || item.dealType;
  const type = item.type || item.propertyType;
  const status = item.status || "available";

  const city = item.city || item.location?.city;
  const area = item.area || item.location?.area || item.neighborhood;
  const address = item.address || item.location?.address || item.streetAddress || `${area || ""}`.trim();
  const country = item.country || item.location?.country || "Italy";

  const lat = toNumber(item.lat ?? item.latitude ?? item.location?.coordinates?.lat ?? item.location?.lat);
  const lng = toNumber(item.lng ?? item.longitude ?? item.location?.coordinates?.lng ?? item.location?.lng);

  const bedrooms = toNumber(item.bedrooms ?? item.beds ?? item.features?.bedrooms, 0);
  const bathrooms = toNumber(item.bathrooms ?? item.baths ?? item.features?.bathrooms, 0);
  const size = toNumber(item.size ?? item.areaSize ?? item.sqm ?? item.squareMeters, 0);

  const payload = {
    title,
    description,
    price,
    priceType,
    type,
    status,
    location: {
      address,
      city,
      area,
      country,
      coordinates: { lat, lng },
    },
    features: {
      bedrooms,
      bathrooms,
      size,
      floors: toNumber(item.floors ?? item.features?.floors),
      garage: toBool(item.garage ?? item.features?.garage),
      pool: toBool(item.pool ?? item.features?.pool),
      garden: toBool(item.garden ?? item.features?.garden),
      balcony: toBool(item.balcony ?? item.features?.balcony),
      elevator: toBool(item.elevator ?? item.features?.elevator),
      furnished: toBool(item.furnished ?? item.features?.furnished),
      parking: toBool(item.parking ?? item.features?.parking),
      airConditioning: toBool(item.airConditioning ?? item.ac ?? item.features?.airConditioning),
    },
    contactPhone: item.contactPhone || item.phone || "",
    contactEmail: item.contactEmail || item.email || "",
    images: images.filter(Boolean),
    source: {
      provider: "apify",
      externalId: externalId ? String(externalId) : undefined,
      url: sourceUrl ? String(sourceUrl) : undefined,
    },
  };

  return payload;
};

const validatePropertyPayload = (payload) => {
  const missing = [];
  if (!payload?.title) missing.push("title");
  if (!payload?.description) missing.push("description");
  if (!payload?.price || payload.price < 1) missing.push("price");
  if (!payload?.priceType || !["sale", "rent"].includes(payload.priceType)) missing.push("priceType");
  if (!payload?.type || !["house", "apartment", "land", "office", "villa", "studio"].includes(payload.type)) missing.push("type");
  if (!payload?.location?.address) missing.push("location.address");
  if (!payload?.location?.city) missing.push("location.city");
  if (!payload?.location?.area) missing.push("location.area");
  if (!payload?.features?.size || payload.features.size < 1) missing.push("features.size");
  if (payload?.features?.bedrooms === undefined || payload.features.bedrooms < 0) missing.push("features.bedrooms");
  if (payload?.features?.bathrooms === undefined || payload.features.bathrooms < 0) missing.push("features.bathrooms");
  return missing;
};

const runActor = async (req, res, next) => {
  try {
    const actorId = String(req.body.actorId || process.env.APIFY_ACTOR_ID || "").trim();
    const input = req.body.input || {};
    const waitForFinish = toNumber(req.body.waitForFinish, 0);

    const started = await startActorRun({ actorId, input, waitForFinish });
    const run = started?.data;
    res.status(201).json({
      runId: run?.id,
      status: run?.status,
      defaultDatasetId: run?.defaultDatasetId,
      startedAt: run?.startedAt,
      finishedAt: run?.finishedAt || null,
      raw: started,
    });
  } catch (error) {
    next(error);
  }
};

const importRunDataset = async ({ runId, datasetId }) => {
  const importUser = await getImportAgent();

  const items = await listDatasetItems({ datasetId, limit: 1000, offset: 0, clean: true, desc: false });
  const results = {
    runId,
    datasetId,
    total: Array.isArray(items) ? items.length : 0,
    imported: 0,
    updated: 0,
    skipped: 0,
    errors: 0,
    details: [],
  };

  if (!Array.isArray(items) || items.length === 0) {
    return results;
  }

  for (const item of items) {
    try {
      const payload = normalizeApifyItem(item);
      if (!payload) {
        results.skipped += 1;
        continue;
      }

      payload.agent = importUser._id;
      payload.isApproved = true;
      payload.moderationStatus = "approved";
      payload.rejectionReason = "";
      payload.source = {
        ...(payload.source || {}),
        runId: runId ? String(runId) : undefined,
      };

      const missing = validatePropertyPayload(payload);
      if (missing.length) {
        results.skipped += 1;
        results.details.push({
          externalId: payload.source?.externalId,
          url: payload.source?.url,
          skipped: true,
          reason: `Missing/invalid fields: ${missing.join(", ")}`,
        });
        continue;
      }

      const filter = payload.source?.externalId
        ? { "source.provider": "apify", "source.externalId": String(payload.source.externalId) }
        : payload.source?.url
          ? { "source.provider": "apify", "source.url": String(payload.source.url) }
          : null;

      if (!filter) {
        results.skipped += 1;
        results.details.push({ skipped: true, reason: "Missing externalId/url for upsert" });
        continue;
      }

      const existing = await Property.findOne(filter).select("_id");
      if (existing) {
        await Property.updateOne({ _id: existing._id }, payload, { runValidators: true });
        results.updated += 1;
        results.details.push({ _id: existing._id, externalId: payload.source?.externalId, url: payload.source?.url, updated: true });
      } else {
        const created = await Property.create(payload);
        results.imported += 1;
        results.details.push({ _id: created._id, externalId: payload.source?.externalId, url: payload.source?.url, imported: true });
      }
    } catch (e) {
      results.errors += 1;
      results.details.push({ error: e.message || String(e) });
    }
  }

  return results;
};

const importRun = async (req, res, next) => {
  try {
    const runId = String(req.params.runId || "").trim();
    const run = await getRun(runId);
    const datasetId = run?.data?.defaultDatasetId;
    if (!datasetId) {
      res.status(400);
      throw new Error("Run has no defaultDatasetId to import");
    }

    const results = await importRunDataset({ runId, datasetId });
    res.json({ runId, datasetId, results });
  } catch (error) {
    next(error);
  }
};

const apifyWebhook = async (req, res, next) => {
  try {
    const expected = String(process.env.APIFY_WEBHOOK_SECRET || "").trim();
    const received = String(req.headers["x-webhook-secret"] || "").trim();
    if (expected && received !== expected) {
      return res.status(401).json({ message: "Invalid webhook secret" });
    }

    const event = req.body || {};
    const runId =
      event?.resource?.id ||
      event?.resource?.runId ||
      event?.data?.runId ||
      event?.runId ||
      event?.resourceId ||
      event?.payload?.runId;

    if (!runId) {
      return res.status(400).json({ message: "Missing runId in webhook payload" });
    }

    const run = await getRun(runId);
    const datasetId = run?.data?.defaultDatasetId;
    if (!datasetId) {
      return res.status(202).json({ ok: true, runId, message: "No defaultDatasetId yet" });
    }

    const results = await importRunDataset({ runId, datasetId });
    return res.json({ ok: true, runId, datasetId, results });
  } catch (error) {
    next(error);
  }
};

module.exports = { runActor, importRun, apifyWebhook };

