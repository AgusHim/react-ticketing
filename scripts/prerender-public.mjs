import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";

const SEO_START = "<!-- usloop:seo:start -->";
const SEO_END = "<!-- usloop:seo:end -->";
const PAGE_LIMIT = 50;

export async function prerenderPublic({
  apiBaseUrl,
  siteUrl,
  outputDir,
  fetchImpl = fetch,
}) {
  const apiBase = normalizeBaseUrl(apiBaseUrl, "SEO_API_BASE_URL");
  const siteBase = normalizeBaseUrl(siteUrl, "PUBLIC_SITE_URL");
  const templatePath = path.join(outputDir, "index.html");
  const template = await readFile(templatePath, "utf8");
  assertTemplate(template);

  const [communities, events] = await Promise.all([
    fetchAllPages(fetchImpl, apiBase, "/api/v1/communities"),
    fetchAllPages(fetchImpl, apiBase, "/api/v1/events"),
  ]);
  const routes = [];

  for (const community of communities) {
    const segment = safeRouteSegment(community.slug, "community slug");
    const pathname = `/communities/${segment}`;
    const canonical = new URL(pathname, siteBase).href;
    const description = summarize(
      community.description || `Ikuti aktivitas ${community.name} di usloop.id`,
    );
    const image = absoluteOptionalUrl(
      community.cover_url || community.logo_url,
      siteBase,
    );
    const structuredData = compactObject({
      "@context": "https://schema.org",
      "@type": "Organization",
      name: community.name,
      url: canonical,
      description,
      logo: image,
      location: community.location
        ? { "@type": "Place", name: community.location }
        : undefined,
    });
    const html = renderDocument(template, {
      title: community.name,
      description,
      canonical,
      image,
      type: "website",
      structuredData,
      body: renderCommunityBody(community, canonical),
    });
    await writeRoute(outputDir, "communities", segment, html);
    routes.push({ canonical, lastModified: community.updated_at });
  }

  for (const event of events) {
    const segment = safeRouteSegment(event.slug || event.id, "event slug");
    const pathname = `/events/${segment}`;
    const canonical = new URL(pathname, siteBase).href;
    const description = summarize(
      event.description || `${event.name} di ${event.location}`,
    );
    const image = absoluteOptionalUrl(event.image_url, siteBase);
    const structuredData = compactObject({
      "@context": "https://schema.org",
      "@type": "Event",
      name: event.name,
      description,
      url: canonical,
      startDate: event.date,
      image: image ? [image] : undefined,
      location: event.location
        ? { "@type": "Place", name: event.location }
        : undefined,
      organizer: event.community
        ? {
            "@type": "Organization",
            name: event.community.name,
            url: new URL(
              `/communities/${safeRouteSegment(event.community.slug, "community slug")}`,
              siteBase,
            ).href,
          }
        : undefined,
    });
    const html = renderDocument(template, {
      title: event.name,
      description,
      canonical,
      image,
      type: "article",
      structuredData,
      body: renderEventBody(event, canonical, siteBase),
    });
    await writeRoute(outputDir, "events", segment, html);
    routes.push({ canonical, lastModified: event.updated_at });
  }

  const sitemapEntries = [
    { canonical: siteBase.href },
    ...routes.sort((left, right) =>
      left.canonical.localeCompare(right.canonical),
    ),
  ];
  if (sitemapEntries.length > 50_000) {
    throw new Error("Sitemap exceeds the 50,000 URL limit");
  }
  await writeFile(
    path.join(outputDir, "sitemap.xml"),
    renderSitemap(sitemapEntries),
    "utf8",
  );
  await writeFile(
    path.join(outputDir, "robots.txt"),
    renderRobots(siteBase),
    "utf8",
  );
  await writeFile(
    path.join(outputDir, "prerender-manifest.json"),
    `${JSON.stringify(
      {
        generated_at: new Date().toISOString(),
        communities: communities.length,
        events: events.length,
        routes: routes.map(({ canonical }) => canonical),
      },
      null,
      2,
    )}\n`,
    "utf8",
  );

  return { communities: communities.length, events: events.length };
}

export function renderDocument(template, metadata) {
  assertTemplate(template);
  const seoBlock = renderSeoBlock(metadata);
  const withMetadata = template.replace(
    new RegExp(`${escapeRegExp(SEO_START)}[\\s\\S]*?${escapeRegExp(SEO_END)}`),
    seoBlock,
  );
  const rootPattern = /<div id="root"><\/div>/;
  if (!rootPattern.test(withMetadata)) {
    throw new Error('HTML template must contain <div id="root"></div>');
  }
  return withMetadata.replace(
    rootPattern,
    `<div id="root">${metadata.body}</div>`,
  );
}

export function renderSitemap(entries) {
  const urls = entries
    .map(({ canonical, lastModified }) => {
      const lastmod = validDate(lastModified)
        ? `\n    <lastmod>${escapeXml(new Date(lastModified).toISOString())}</lastmod>`
        : "";
      return `  <url>\n    <loc>${escapeXml(canonical)}</loc>${lastmod}\n  </url>`;
    })
    .join("\n");
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`;
}

async function fetchAllPages(fetchImpl, apiBase, pathname) {
  const items = [];
  for (let page = 1; page <= 1_000; page += 1) {
    const url = new URL(pathname, apiBase);
    url.searchParams.set("page", String(page));
    url.searchParams.set("limit", String(PAGE_LIMIT));
    const response = await fetchImpl(url);
    if (!response.ok) {
      throw new Error(`Prerender fetch failed (${response.status}) for ${url}`);
    }
    const payload = await response.json();
    if (!Array.isArray(payload.data) || !Number.isFinite(payload.meta?.total)) {
      throw new Error(`Invalid paginated response from ${url}`);
    }
    items.push(...payload.data);
    if (items.length >= payload.meta.total || payload.data.length === 0) {
      return items;
    }
  }
  throw new Error(`Pagination safety limit reached for ${pathname}`);
}

function renderSeoBlock({
  title,
  description,
  canonical,
  image,
  type,
  structuredData,
}) {
  const pageTitle = `${title} · usloop.id`;
  const imageTags = image
    ? `\n  <meta property="og:image" content="${escapeHtml(image)}" />\n  <meta name="twitter:image" content="${escapeHtml(image)}" />`
    : "";
  const twitterCard = image ? "summary_large_image" : "summary";
  const jsonLd = JSON.stringify(structuredData)
    .replaceAll("<", "\\u003c")
    .replaceAll(">", "\\u003e")
    .replaceAll("&", "\\u0026");
  return `${SEO_START}
  <meta name="description" content="${escapeHtml(description)}" />
  <meta property="og:title" content="${escapeHtml(title)}" />
  <meta property="og:description" content="${escapeHtml(description)}" />
  <meta property="og:type" content="${escapeHtml(type)}" />
  <meta property="og:url" content="${escapeHtml(canonical)}" />${imageTags}
  <meta name="twitter:card" content="${twitterCard}" />
  <meta name="twitter:title" content="${escapeHtml(title)}" />
  <meta name="twitter:description" content="${escapeHtml(description)}" />
  <link rel="canonical" href="${escapeHtml(canonical)}" />
  <script type="application/ld+json">${jsonLd}</script>
  <title>${escapeHtml(pageTitle)}</title>
  ${SEO_END}`;
}

function renderCommunityBody(community, canonical) {
  return `<main data-prerendered="community">
    <article>
      <h1>${escapeHtml(community.name)}</h1>
      <p>${escapeHtml(community.description || "Komunitas di usloop.id")}</p>
      ${community.location ? `<p>Lokasi: ${escapeHtml(community.location)}</p>` : ""}
      <a href="${escapeHtml(canonical)}">Buka komunitas</a>
    </article>
  </main>`;
}

function renderEventBody(event, canonical, siteBase) {
  const organizer = event.community
    ? `<p>Penyelenggara: <a href="${escapeHtml(
        new URL(
          `/communities/${safeRouteSegment(event.community.slug, "community slug")}`,
          siteBase,
        ).href,
      )}">${escapeHtml(event.community.name)}</a></p>`
    : "";
  return `<main data-prerendered="event">
    <article>
      <h1>${escapeHtml(event.name)}</h1>
      <p>${escapeHtml(event.description || "Event di usloop.id")}</p>
      <time datetime="${escapeHtml(event.date)}">${escapeHtml(event.date)}</time>
      ${event.location ? `<p>Lokasi: ${escapeHtml(event.location)}</p>` : ""}
      ${organizer}
      <a href="${escapeHtml(canonical)}">Buka event</a>
    </article>
  </main>`;
}

async function writeRoute(outputDir, collection, segment, html) {
  const directory = path.join(outputDir, collection, segment);
  await mkdir(directory, { recursive: true });
  await writeFile(path.join(directory, "index.html"), html, "utf8");
}

function renderRobots(siteBase) {
  const sitemap = new URL("/sitemap.xml", siteBase).href;
  return `User-agent: *
Allow: /
Disallow: /account/
Disallow: /portal/
Disallow: /admin_api/
Disallow: /invitations/
Disallow: /booking
Disallow: /verify-ticket

Sitemap: ${sitemap}
`;
}

function normalizeBaseUrl(value, name) {
  let url;
  try {
    url = new URL(value);
  } catch {
    throw new Error(`${name} must be an absolute HTTP(S) URL`);
  }
  if (!["http:", "https:"].includes(url.protocol)) {
    throw new Error(`${name} must use HTTP(S)`);
  }
  if (url.username || url.password) {
    throw new Error(`${name} must not contain credentials`);
  }
  url.hash = "";
  url.search = "";
  if (!url.pathname.endsWith("/")) url.pathname += "/";
  return url;
}

function safeRouteSegment(value, label) {
  const segment = String(value || "").toLowerCase();
  if (!/^[a-z0-9](?:[a-z0-9-]{0,158}[a-z0-9])?$/.test(segment)) {
    throw new Error(`Invalid ${label}: ${value}`);
  }
  return segment;
}

function summarize(value) {
  const normalized = String(value || "").replace(/\s+/g, " ").trim();
  if (normalized.length <= 180) return normalized;
  return `${normalized.slice(0, 177).trimEnd()}...`;
}

function absoluteOptionalUrl(value, siteBase) {
  if (!value) return "";
  try {
    const url = new URL(value, siteBase);
    return ["http:", "https:"].includes(url.protocol) ? url.href : "";
  } catch {
    return "";
  }
}

function compactObject(value) {
  return Object.fromEntries(
    Object.entries(value).filter(([, item]) => item !== undefined && item !== ""),
  );
}

function validDate(value) {
  return value && !Number.isNaN(new Date(value).getTime());
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function escapeXml(value) {
  return escapeHtml(value);
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function assertTemplate(template) {
  if (!template.includes(SEO_START) || !template.includes(SEO_END)) {
    throw new Error("HTML template is missing usloop SEO markers");
  }
}

const isDirectRun =
  process.argv[1] &&
  import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href;

if (isDirectRun) {
  const outputDir = path.resolve(process.env.SEO_OUTPUT_DIR || "dist");
  const result = await prerenderPublic({
    apiBaseUrl:
      process.env.SEO_API_BASE_URL ||
      process.env.VITE_API_BASE_URL ||
      "http://127.0.0.1:3000",
    siteUrl: process.env.PUBLIC_SITE_URL || "https://usloop.id",
    outputDir,
  });
  process.stdout.write(
    `Prerendered ${result.communities} communities and ${result.events} events.\n`,
  );
}
