import { expect, test } from "@playwright/test";

const apiBase = "http://127.0.0.1:3000";
const publicEvent = {
  id: "event-1",
  slug: "kajian-akbar-solo",
  name: "Kajian Akbar Solo",
  date: "2026-08-17T12:00:00.000Z",
  location: "Solo",
  description: "Kajian bersama komunitas Usloop.",
  status: "published",
  community: {
    id: "community-1",
    slug: "majelis-usloop",
    name: "Majelis Usloop",
    type: "dakwah",
  },
};

test("event dapat dicari, difilter, dan dibuka detailnya", async ({ page }) => {
  await page.route(`${apiBase}/api/v1/events?**`, async (route) => {
    const url = new URL(route.request().url());
    const searching = url.searchParams.get("q") === "Kajian";
    if (searching) {
      expect(url.searchParams.get("location")).toBe("Solo");
    }
    await route.fulfill({
      json: {
        data: searching ? [publicEvent] : [publicEvent],
        meta: { total: 1, page: 1, limit: 12 },
      },
    });
  });
  await page.route(`${apiBase}/api/v1/events/${publicEvent.slug}`, (route) =>
    route.fulfill({ json: { data: publicEvent } }),
  );

  await page.goto("/");
  await page.getByLabel("Cari event").fill("Kajian");
  await page.getByLabel("Filter lokasi").fill("Solo");
  await page.getByRole("button", { name: "Cari" }).click();
  await expect(
    page.getByRole("heading", { name: publicEvent.name }),
  ).toBeVisible();
  await page.getByRole("link", { name: /Lihat Event/ }).click();

  await expect(page).toHaveURL(`/events/${publicEvent.slug}`);
  await expect(
    page.getByRole("heading", { name: publicEvent.name }),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: "Lanjutkan Booking" }),
  ).toHaveAttribute("href", `/booking?event_id=${publicEvent.id}`);
  await expect(
    page.getByRole("link", { name: publicEvent.community.name }),
  ).toHaveAttribute("href", `/communities/${publicEvent.community.slug}`);
  await expect(page).toHaveTitle(`${publicEvent.name} · usloop.id`);
  await expect(page.locator('meta[property="og:type"]')).toHaveAttribute(
    "content",
    "article",
  );
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
    "href",
    new RegExp(`/events/${publicEvent.slug}$`),
  );
  await expect(page.getByRole("button", { name: "Bagikan" })).toBeVisible();
});

test("home menampilkan event dari komunitas yang diikuti", async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem("token", "test-token"));
  await page.route(`${apiBase}/api/v1/me`, (route) =>
    route.fulfill({
      json: {
        data: {
          id: "user-1",
          name: "Jamaah",
          email: "jamaah@example.test",
          role: "user",
        },
      },
    }),
  );
  await page.route(`${apiBase}/api/v1/events?**`, (route) =>
    route.fulfill({
      json: { data: [], meta: { total: 0, page: 1, limit: 12 } },
    }),
  );
  await page.route(`${apiBase}/api/v1/me/events`, (route) => {
    expect(route.request().headers().authorization).toBe("Bearer test-token");
    return route.fulfill({ json: { data: [publicEvent] } });
  });

  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: "Dari Komunitas yang Kamu Ikuti" }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: publicEvent.name }),
  ).toBeVisible();
});
