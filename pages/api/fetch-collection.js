// pages/api/fetch-collection.js
//
// Called by the footer widget on every page view of every site it is
// installed on. All sites request the same collection, so the response is
// cached at the Vercel CDN and in memory to keep upstream API calls to a
// minimum and stay under the API rate limit.

const { Duda } = require('@dudadev/partner-api');

// CDN: serve from cache for 10 minutes, then keep serving the cached copy for
// up to a day while it refreshes in the background.
const CDN_CACHE = 'max-age=600, stale-while-revalidate=86400';
// Browser: let a visitor reuse the response for 5 minutes across page views.
const BROWSER_CACHE = 'public, max-age=300';

// In memory copy per function instance. FRESH_MS avoids repeat upstream calls
// from a warm instance; the stale copy is served when the upstream call fails.
const FRESH_MS = 5 * 60 * 1000;
const memoryCache = new Map();

let client;
function getClient() {
  if (!client) {
    client = new Duda({
      user: process.env.DUDA_API_USERNAME,
      pass: process.env.DUDA_API_PASSWORD,
    });
  }
  return client;
}

function setCorsHeaders(res) {
  // Open on purpose: the widget runs on hundreds of different site domains.
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
}

function sendCached(res, data, source) {
  res.setHeader('Vercel-CDN-Cache-Control', CDN_CACHE);
  res.setHeader('Cache-Control', BROWSER_CACHE);
  res.setHeader('X-Footer-Cache', source);
  return res.status(200).json(data);
}

// The API client rejects with [{ status, error }, reply] for HTTP errors and
// with a plain Error for network failures (ECONNRESET, socket hang up, timeout).
function upstreamStatus(err) {
  if (Array.isArray(err) && err[0] && err[0].status) return err[0].status;
  if (err && err.status) return err.status;
  return null;
}

export default async function handler(req, res) {
  setCorsHeaders(res);

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  if (!process.env.DUDA_API_USERNAME || !process.env.DUDA_API_PASSWORD) {
    console.error('Missing API credentials');
    res.setHeader('Cache-Control', 'no-store');
    return res.status(500).json({ error: 'Missing API credentials' });
  }

  const { site_name, collection_name } = req.query;

  if (!site_name || !collection_name) {
    res.setHeader('Cache-Control', 'no-store');
    return res.status(400).json({ error: 'Missing required parameters: site_name and collection_name' });
  }

  const key = `${site_name}/${collection_name}`;
  const cached = memoryCache.get(key);

  if (cached && Date.now() - cached.at < FRESH_MS) {
    return sendCached(res, cached.data, 'memory');
  }

  try {
    const collection = await getClient().collections.get({ site_name, collection_name });
    memoryCache.set(key, { data: collection, at: Date.now() });
    return sendCached(res, collection, 'upstream');
  } catch (err) {
    const status = upstreamStatus(err);
    console.error('Collection API error:', status || (err && err.code) || err);

    // Upstream failed but we have a previous good copy: serve it.
    if (cached) {
      return sendCached(res, cached.data, 'stale');
    }

    res.setHeader('Cache-Control', 'no-store');

    if (status === 429) {
      res.setHeader('Retry-After', '30');
      return res.status(503).json({ error: 'Upstream rate limited, retry shortly' });
    }

    return res.status(502).json({ error: 'Upstream collection request failed' });
  }
}
