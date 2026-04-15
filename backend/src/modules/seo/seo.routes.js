const router = require("express").Router();
const pool = require("../../config/db");

const ROOT_DOMAIN = "tutorialhub.co.in";
const WWW_HOST = `www.${ROOT_DOMAIN}`;
const API_HOST = `api.${ROOT_DOMAIN}`;

function getRequestHost(req) {
  const forwardedHost = String(req.headers["x-forwarded-host"] || "").trim();
  const rawHost = forwardedHost || req.get("host") || "";
  return rawHost.split(",")[0].trim().replace(/:\d+$/, "").toLowerCase();
}

function getRequestProtocol(req) {
  const forwardedProto = String(req.headers["x-forwarded-proto"] || "").trim();
  return (forwardedProto || req.protocol || "https").split(",")[0].trim().toLowerCase();
}

function buildOrigin(req, explicitHost) {
  return `${getRequestProtocol(req)}://${explicitHost || getRequestHost(req)}`;
}

function isRootHost(host) {
  return host === ROOT_DOMAIN || host === WWW_HOST;
}

function isApiHost(host) {
  return host === API_HOST;
}

function extractCenterSlug(host) {
  if (!host || isRootHost(host) || isApiHost(host) || !host.endsWith(`.${ROOT_DOMAIN}`)) {
    return "";
  }

  const suffix = `.${ROOT_DOMAIN}`;
  return host.slice(0, -suffix.length).split(".").filter(Boolean)[0] || "";
}

function formatDate(value = new Date()) {
  return new Date(value).toISOString().slice(0, 10);
}

function xmlEscape(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function renderUrlSet(items) {
  const body = items
    .map(
      (item) => `  <url>
    <loc>${xmlEscape(item.loc)}</loc>
    <lastmod>${formatDate(item.lastmod)}</lastmod>
    <changefreq>${item.changefreq || "weekly"}</changefreq>
    <priority>${item.priority || "0.7"}</priority>
  </url>`
    )
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${body}
</urlset>`;
}

function renderSitemapIndex(items) {
  const body = items
    .map(
      (item) => `  <sitemap>
    <loc>${xmlEscape(item.loc)}</loc>
    <lastmod>${formatDate(item.lastmod)}</lastmod>
  </sitemap>`
    )
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${body}
</sitemapindex>`;
}

async function getActiveCenters() {
  const { rows } = await pool.query(
    `
    SELECT slug, NOW() AS lastmod
    FROM coaching_centers
    WHERE status = 'active'
      AND slug IS NOT NULL
      AND slug <> ''
    ORDER BY slug
    `
  );

  return rows;
}

async function resolveCenter(host) {
  const slug = extractCenterSlug(host);
  if (!slug) {
    return null;
  }

  const { rows } = await pool.query(
    `
    SELECT id, slug, NOW() AS lastmod
    FROM coaching_centers
    WHERE LOWER(slug) = $1
      AND status = 'active'
    LIMIT 1
    `,
    [slug]
  );

  return rows[0] || null;
}

router.get("/robots.txt", async (req, res) => {
  const host = getRequestHost(req);

  if (isApiHost(host)) {
    res.type("text/plain").send("User-agent: *\nDisallow: /");
    return;
  }

  const origin = buildOrigin(req, host);
  const lines = [
    "User-agent: *",
    "Allow: /",
    "",
    `Sitemap: ${origin}/sitemap.xml`,
  ];

  if (isRootHost(host)) {
    lines.push(`Sitemap: ${origin}/sitemap-centers.xml`);
  }

  res.type("text/plain").send(lines.join("\n"));
});

router.get("/sitemap.xml", async (req, res) => {
  const host = getRequestHost(req);

  if (isApiHost(host)) {
    res.status(404).type("application/xml").send(renderUrlSet([]));
    return;
  }

  const origin = buildOrigin(req, host);

  if (isRootHost(host)) {
    const xml = renderUrlSet([
      { loc: `${origin}/`, priority: "1.0", changefreq: "weekly" },
      { loc: `${origin}/login`, priority: "0.8", changefreq: "monthly" },
      { loc: `${origin}/signup`, priority: "0.8", changefreq: "monthly" },
    ]);

    res.type("application/xml").send(xml);
    return;
  }

  const center = await resolveCenter(host);
  if (!center) {
    res.status(404).type("application/xml").send(renderUrlSet([]));
    return;
  }

  const xml = renderUrlSet([
    { loc: `${origin}/`, lastmod: center.lastmod, priority: "1.0", changefreq: "daily" },
    { loc: `${origin}/login`, lastmod: center.lastmod, priority: "0.8", changefreq: "monthly" },
  ]);

  res.type("application/xml").send(xml);
});

router.get("/sitemap-centers.xml", async (req, res) => {
  const host = getRequestHost(req);
  if (!isRootHost(host)) {
    res.status(404).type("application/xml").send(renderSitemapIndex([]));
    return;
  }

  const protocol = getRequestProtocol(req);
  const centers = await getActiveCenters();
  const xml = renderSitemapIndex(
    centers.map((center) => ({
      loc: `${protocol}://${center.slug}.${ROOT_DOMAIN}/sitemap.xml`,
      lastmod: center.lastmod,
    }))
  );

  res.type("application/xml").send(xml);
});

module.exports = router;
