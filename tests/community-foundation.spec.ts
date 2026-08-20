import { expect, test } from "@playwright/test";

const apiBase = "http://127.0.0.1:3000";
const community = {
  id: "community-1",
  name: "Majelis Usloop Solo",
  slug: "majelis-usloop-solo",
  type: "dakwah",
  description: "Ruang bertumbuh dan belajar bersama.",
  location: "Solo",
  status: "active",
  created_at: "2026-07-30T00:00:00.000Z",
  updated_at: "2026-07-30T00:00:00.000Z",
};

test("profil komunitas dapat dibuka tanpa login", async ({ page }) => {
  await page.route(`${apiBase}/api/v1/communities/${community.slug}`, (route) =>
    route.fulfill({ json: { data: community } }),
  );
  await page.route(
    `${apiBase}/api/v1/communities/${community.slug}/events?**`,
    (route) =>
      route.fulfill({
        json: {
          data: [
            {
              id: "community-event",
              slug: "kajian-komunitas",
              name: "Kajian Komunitas",
              date: "2026-08-20T12:00:00.000Z",
              location: "Solo",
              description: "Event komunitas",
              status: "published",
              community: {
                id: community.id,
                slug: community.slug,
                name: community.name,
                type: community.type,
              },
            },
          ],
          meta: { total: 1, page: 1, limit: 6 },
        },
      }),
  );

  await page.goto(`/communities/${community.slug}`);

  await expect(
    page.getByRole("heading", { name: community.name }),
  ).toBeVisible();
  await expect(page.getByText(community.description).first()).toBeVisible();
  await expect(page.getByText(community.location, { exact: true }).first()).toBeVisible();
  await expect(page.getByRole("link", { name: "Masuk untuk mengikuti" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Event Komunitas" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Kajian Komunitas" })).toBeVisible();
  await expect(page).toHaveTitle(`${community.name} · usloop.id`);
  await expect(page.locator('meta[property="og:title"]')).toHaveAttribute(
    "content",
    community.name,
  );
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
    "href",
    new RegExp(`/communities/${community.slug}$`),
  );
  await expect(page.getByRole("button", { name: "Bagikan" })).toBeVisible();
});

test("user dapat follow dan unfollow komunitas", async ({ page }) => {
  let following = false;
  await page.addInitScript(() => localStorage.setItem("token", "test-token"));
  await page.route(`${apiBase}/api/v1/me`, (route) =>
    route.fulfill({
      json: {
        data: {
          id: "user-1",
          name: "Jamaah Usloop",
          email: "jamaah@example.test",
          role: "user",
        },
      },
    }),
  );
  await page.route(`${apiBase}/api/v1/communities/${community.slug}`, (route) =>
    route.fulfill({
      json: { data: { ...community, follower_count: 3 } },
    }),
  );
  await page.route(
    `${apiBase}/api/v1/communities/${community.id}/follow`,
    async (route) => {
      expect(route.request().headers().authorization).toBe("Bearer test-token");
      if (route.request().method() === "GET") {
        await route.fulfill({ json: { data: { following } } });
        return;
      }
      following = route.request().method() === "POST";
      await route.fulfill({ json: { data: { following } } });
    },
  );

  await page.goto(`/communities/${community.slug}`);
  await expect(page.getByText("3 pengikut").first()).toBeVisible();
  await page.getByRole("button", { name: "Ikuti komunitas" }).click();
  await expect(page.getByRole("button", { name: "Berhenti mengikuti" })).toBeVisible();
  await expect(page.getByText("4 pengikut").first()).toBeVisible();
  await page.getByRole("button", { name: "Berhenti mengikuti" }).click();
  await expect(page.getByRole("button", { name: "Ikuti komunitas" })).toBeVisible();
  await expect(page.getByText("3 pengikut").first()).toBeVisible();
});

test.describe("shell account dan portal komunitas", () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => localStorage.setItem("token", "test-token"));
    await page.route(`${apiBase}/api/v1/me`, (route) =>
      route.fulfill({
        json: {
          data: {
            id: "user-1",
            name: "Pengurus Usloop",
            email: "pengurus@example.test",
            role: "user",
          },
        },
      }),
    );
  });

  test("user dapat membuat komunitas dan membuka portalnya", async ({ page }) => {
    await page.route(`${apiBase}/api/v1/me/communities`, (route) =>
      route.fulfill({ json: { data: [] } }),
    );
    await page.route(`${apiBase}/api/v1/communities`, async (route) => {
      expect(route.request().headers().authorization).toBe("Bearer test-token");
      expect(await route.request().postDataJSON()).toMatchObject({
        name: community.name,
        type: "dakwah",
      });
      await route.fulfill({ status: 201, json: { data: community } });
    });

    await page.goto("/account/communities");
    await expect(
      page.getByRole("heading", { name: "Komunitas Saya" }),
    ).toBeVisible();

    await page.getByLabel("Nama").fill(community.name);
    await page.getByLabel("Lokasi").fill(community.location);
    await page.getByLabel("Deskripsi").fill(community.description);
    await page.getByRole("button", { name: "Buat komunitas" }).click();

    await expect(
      page.getByRole("heading", { name: community.name }),
    ).toBeVisible();
    await page.getByRole("link", { name: "Buka portal" }).click();
    await expect(
      page.getByRole("heading", { name: "Portal Komunitas" }),
    ).toBeVisible();
  });

  test("portal memuat anggota tenant dan membuat undangan", async ({ page }) => {
    await page.route(
      `${apiBase}/api/v1/portal/${community.id}/members`,
      (route) =>
        route.fulfill({
          json: {
            data: [
              {
                id: "member-1",
                community_id: community.id,
                user_id: "user-1",
                role: "owner",
                status: "active",
                user: {
                  id: "user-1",
                  name: "Pengurus Usloop",
                  email: "pengurus@example.test",
                  role: "user",
                },
              },
            ],
          },
        }),
    );
    await page.route(
      `${apiBase}/api/v1/portal/${community.id}/invitations`,
      async (route) => {
        expect(await route.request().postDataJSON()).toMatchObject({
          email: "tim@example.test",
          role: "event_manager",
        });
        await route.fulfill({
          status: 201,
          json: {
            data: {
              token: "invite-once",
              expires_at: "2026-08-06T00:00:00.000Z",
            },
          },
        });
      },
    );

    await page.goto(`/portal/${community.id}/members`);
    await expect(page.getByText("Pengurus Usloop")).toBeVisible();
    await page.getByLabel("Email").fill("tim@example.test");
    await page.getByRole("button", { name: "Buat undangan" }).click();
    await expect(page.getByText(/invitations\/invite-once/)).toBeVisible();
  });

  test("user dapat melihat dan mencabut sesi perangkat", async ({ page }) => {
    await page.route(`${apiBase}/api/v1/auth/sessions`, async (route) => {
      if (route.request().method() === "GET") {
        await route.fulfill({
          json: {
            data: [
              {
                id: "session-current",
                user_agent: "Chrome Current",
                ip_address: "127.0.0.1",
                expires_at: "2026-08-29T00:00:00.000Z",
                last_used_at: "2026-07-30T00:00:00.000Z",
                created_at: "2026-07-30T00:00:00.000Z",
                current: true,
              },
              {
                id: "session-old",
                user_agent: "Mobile Lama",
                ip_address: "10.0.0.2",
                expires_at: "2026-08-20T00:00:00.000Z",
                last_used_at: "2026-07-29T00:00:00.000Z",
                created_at: "2026-07-20T00:00:00.000Z",
                current: false,
              },
            ],
          },
        });
        return;
      }
      await route.fallback();
    });
    await page.route(
      `${apiBase}/api/v1/auth/sessions/session-old`,
      (route) => route.fulfill({ status: 204 }),
    );

    await page.goto("/account/sessions");
    await expect(
      page.getByRole("heading", { name: "Sesi Perangkat" }),
    ).toBeVisible();
    await expect(page.getByText(/Chrome Current · sesi saat ini/)).toBeVisible();
    await expect(page.getByText("Mobile Lama")).toBeVisible();
    await page
      .getByText("Mobile Lama")
      .locator("xpath=ancestor::div[contains(@class, 'flex-col')]")
      .getByRole("button", { name: "Cabut sesi" })
      .click();
    await expect(page.getByText("Mobile Lama")).not.toBeVisible();
  });

  test("account menampilkan komunitas yang diikuti", async ({ page }) => {
    await page.route(`${apiBase}/api/v1/me/following`, (route) =>
      route.fulfill({ json: { data: [community] } }),
    );

    await page.goto("/account/following");
    await expect(
      page.getByRole("heading", { name: "Komunitas Diikuti" }),
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: community.name }),
    ).toBeVisible();
    await expect(
      page.getByRole("link", { name: "Buka komunitas" }),
    ).toHaveAttribute("href", `/communities/${community.slug}`);
  });

  test("pengurus dapat memperbarui profil publik komunitas", async ({ page }) => {
    await page.route(`${apiBase}/api/v1/portal/${community.id}/`, async (route) => {
      if (route.request().method() === "GET") {
        await route.fulfill({
          json: { data: { community, role: "owner" } },
        });
        return;
      }
      const payload = await route.request().postDataJSON();
      expect(payload).toMatchObject({
        name: "Majelis Usloop Baru",
        location: "Surakarta",
      });
      expect(payload).not.toHaveProperty("slug");
      expect(payload).not.toHaveProperty("type");
      await route.fulfill({
        json: {
          data: {
            ...community,
            ...payload,
            name: "Majelis Usloop Baru",
            location: "Surakarta",
          },
        },
      });
    });

    await page.goto(`/portal/${community.id}/profile`);
    await page.getByLabel("Nama komunitas").fill("Majelis Usloop Baru");
    await page.getByLabel("Lokasi").fill("Surakarta");
    await page.getByRole("button", { name: "Simpan profil" }).click();
    await expect(page.getByLabel("Nama komunitas")).toHaveValue(
      "Majelis Usloop Baru",
    );
    await expect(page.getByLabel("Slug permanen")).toBeDisabled();
    await expect(page.getByLabel("Template komunitas")).toBeDisabled();
  });

  test("owner dapat mengubah role dan menghapus anggota non-owner", async ({ page }) => {
    const owner = {
      id: "member-owner",
      community_id: community.id,
      user_id: "user-1",
      role: "owner",
      status: "active",
      user: {
        id: "user-1",
        name: "Pengurus Usloop",
        email: "pengurus@example.test",
        role: "user",
      },
    };
    const manager = {
      id: "member-manager",
      community_id: community.id,
      user_id: "user-2",
      role: "event_manager",
      status: "active",
      user: {
        id: "user-2",
        name: "Manager Event",
        email: "manager@example.test",
        role: "user",
      },
    };
    await page.route(`${apiBase}/api/v1/portal/${community.id}/`, (route) =>
      route.fulfill({ json: { data: { community, role: "owner" } } }),
    );
    await page.route(
      `${apiBase}/api/v1/portal/${community.id}/members`,
      (route) => route.fulfill({ json: { data: [owner, manager] } }),
    );
    await page.route(
      `${apiBase}/api/v1/portal/${community.id}/members/${manager.id}`,
      async (route) => {
        if (route.request().method() === "PATCH") {
          expect(await route.request().postDataJSON()).toEqual({
            role: "moderator",
          });
          await route.fulfill({ json: { data: { role: "moderator" } } });
          return;
        }
        await route.fulfill({ status: 204 });
      },
    );

    await page.goto(`/portal/${community.id}/members`);
    await page.getByLabel("Peran Manager Event").selectOption("moderator");
    await expect(page.getByLabel("Peran Manager Event")).toHaveValue("moderator");
    await page.getByRole("button", { name: "Hapus" }).click();
    await expect(page.getByText("Manager Event")).not.toBeVisible();
    await expect(page.getByText("owner")).toBeVisible();
  });
});

test("refresh cookie memulihkan account saat access token tidak ada", async ({ page }) => {
  await page.route(`${apiBase}/api/v1/auth/refresh`, (route) =>
    route.fulfill({
      json: {
        token: "rotated-access-token",
        expires_at: "2026-07-30T01:00:00.000Z",
        data: {
          id: "user-1",
          name: "Pengurus Usloop",
          email: "pengurus@example.test",
          role: "user",
        },
      },
    }),
  );
  await page.route(`${apiBase}/api/v1/me`, (route) => {
    expect(route.request().headers().authorization).toBe(
      "Bearer rotated-access-token",
    );
    return route.fulfill({
      json: {
        data: {
          id: "user-1",
          name: "Pengurus Usloop",
          email: "pengurus@example.test",
          role: "user",
        },
      },
    });
  });
  await page.route(`${apiBase}/api/v1/me/communities`, (route) =>
    route.fulfill({ json: { data: [] } }),
  );

  await page.goto("/account/communities");
  await expect(
    page.getByRole("heading", { name: "Komunitas Saya" }),
  ).toBeVisible();
  await expect
    .poll(() => page.evaluate(() => localStorage.getItem("token")))
    .toBe("rotated-access-token");
});
