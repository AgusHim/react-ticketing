import assert from "node:assert/strict";
import { mkdtemp, readFile, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import {
  prerenderPublic,
  renderDocument,
  renderSitemap,
} from "../scripts/prerender-public.mjs";

const template = `<!doctype html>
<html lang="id">
<head>
  <!-- usloop:seo:start -->
  <meta name="description" content="Base" />
  <title>Base</title>
  <!-- usloop:seo:end -->
</head>
<body><div id="root"></div><script src="/assets/app.js"></script></body>
</html>`;

test("renderDocument escapes metadata and provides crawler-readable content", () => {
  const html = renderDocument(template, {
    title: 'Kajian "Aman" <script>',
    description: "Belajar & bertumbuh",
    canonical: "https://usloop.id/events/kajian-aman",
    image: "",
    type: "article",
    structuredData: {
      "@context": "https://schema.org",
      name: "</script><script>alert(1)</script>",
    },
    body: "<main><h1>Kajian Aman</h1></main>",
  });

  assert.match(html, /Kajian &quot;Aman&quot; &lt;script&gt; · usloop\.id/);
  assert.match(html, /Belajar &amp; bertumbuh/);
  assert.doesNotMatch(html, /<\/script><script>alert/);
  assert.match(html, /<div id="root"><main><h1>Kajian Aman/);
});

test("prerenderPublic writes community/event HTML, sitemap, robots, and manifest", async () => {
  const outputDir = await mkdtemp(path.join(os.tmpdir(), "usloop-prerender-"));
  await writeFile(path.join(outputDir, "index.html"), template, "utf8");
  const responses = new Map([
    [
      "/api/v1/communities",
      {
        data: [
          {
            id: "community-1",
            slug: "majelis-usloop",
            name: "Majelis Usloop",
            description: "Ruang belajar bersama.",
            location: "Solo",
            cover_url: "https://cdn.example.test/cover.jpg",
            updated_at: "2026-07-30T10:00:00.000Z",
          },
        ],
        meta: { total: 1 },
      },
    ],
    [
      "/api/v1/events",
      {
        data: [
          {
            id: "event-1",
            slug: "kajian-akbar",
            name: "Kajian Akbar",
            description: "Kajian untuk semua.",
            location: "Solo",
            date: "2026-08-17T12:00:00.000Z",
            updated_at: "2026-07-30T11:00:00.000Z",
            community: {
              slug: "majelis-usloop",
              name: "Majelis Usloop",
            },
          },
        ],
        meta: { total: 1 },
      },
    ],
  ]);
  const fetchImpl = async (url) => {
    const payload = responses.get(url.pathname);
    return new Response(JSON.stringify(payload), {
      status: payload ? 200 : 404,
      headers: { "content-type": "application/json" },
    });
  };

  const result = await prerenderPublic({
    apiBaseUrl: "http://api.example.test",
    siteUrl: "https://usloop.id",
    outputDir,
    fetchImpl,
  });

  assert.deepEqual(result, { communities: 1, events: 1 });
  const communityHtml = await readFile(
    path.join(outputDir, "communities", "majelis-usloop", "index.html"),
    "utf8",
  );
  assert.match(communityHtml, /<h1>Majelis Usloop<\/h1>/);
  assert.match(
    communityHtml,
    /<link rel="canonical" href="https:\/\/usloop\.id\/communities\/majelis-usloop"/,
  );
  assert.match(communityHtml, /"@type":"Organization"/);

  const eventHtml = await readFile(
    path.join(outputDir, "events", "kajian-akbar", "index.html"),
    "utf8",
  );
  assert.match(eventHtml, /<h1>Kajian Akbar<\/h1>/);
  assert.match(eventHtml, /"@type":"Event"/);

  const sitemap = await readFile(path.join(outputDir, "sitemap.xml"), "utf8");
  assert.match(sitemap, /https:\/\/usloop\.id\/communities\/majelis-usloop/);
  assert.match(sitemap, /https:\/\/usloop\.id\/events\/kajian-akbar/);
  assert.match(sitemap, /<lastmod>2026-07-30T11:00:00.000Z<\/lastmod>/);

  const robots = await readFile(path.join(outputDir, "robots.txt"), "utf8");
  assert.match(robots, /Disallow: \/portal\//);
  assert.match(robots, /Sitemap: https:\/\/usloop\.id\/sitemap\.xml/);

  const manifest = JSON.parse(
    await readFile(path.join(outputDir, "prerender-manifest.json"), "utf8"),
  );
  assert.equal(manifest.communities, 1);
  assert.equal(manifest.events, 1);
});

test("renderSitemap XML-escapes URLs", () => {
  const sitemap = renderSitemap([
    { canonical: "https://usloop.id/events?q=a&location=solo" },
  ]);
  assert.match(sitemap, /q=a&amp;location=solo/);
});
