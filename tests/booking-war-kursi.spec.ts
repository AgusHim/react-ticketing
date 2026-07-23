import { expect, test, type Page } from '@playwright/test';

const apiBase = 'http://127.0.0.1:3000';
const eventId = 'e2e-war-kursi';
const seatId = 'seat-a1';

type TestTicket = {
  ticket_id: string;
  ticket_code: string;
  name: string;
  gender: string;
  category: string;
};

type LockedSeat = {
  id: string;
  seat_id: string;
  admin_id: string;
  event_id: string;
};

type BookedSeat = {
  seat_id: string;
  ticket_id: string;
  event_id: string;
  name: string;
};

function tokenFor(ticket: TestTicket) {
  const payload = Buffer.from(JSON.stringify({
    ...ticket,
    ticket_name: 'VIP',
    event_id: eventId,
    type: 'war_kursi',
  })).toString('base64');
  return `e2e.${payload}.signature`;
}

function ticketFromAuthorization(headers: Record<string, string>, fallback: TestTicket) {
  const authorization = headers.authorization || '';
  const token = authorization.replace(/^Bearer\s+/i, '');
  const payload = token.split('.')[1];
  if (!payload) return fallback;

  try {
    return JSON.parse(Buffer.from(payload, 'base64').toString('utf8')) as TestTicket;
  } catch {
    return fallback;
  }
}

async function mockBookingBackend(
  page: Page,
  ticket: TestTicket,
  state: {
    lockedSeats: Map<string, LockedSeat>;
    bookedSeats: BookedSeat[];
    expireLocks: boolean;
  },
) {
  await page.route(`${apiBase}/**`, async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    const path = url.pathname;

    if (request.method() === 'GET' && path === `/api/events/${eventId}`) {
      await route.fulfill({
        json: {
          data: {
            id: eventId,
            name: 'Integration Test Event',
            date: '2026-07-01T12:00:00.000Z',
            location: 'Jakarta',
            description: 'E2E event',
            status: 'active',
            color: '#2563eb',
            created_at: '2026-06-01T00:00:00.000Z',
            updated_at: '2026-06-01T00:00:00.000Z',
          },
        },
      });
      return;
    }

    if (request.method() === 'GET' && path === '/api/seats') {
      await route.fulfill({
        json: {
          data: [
            {
              id: seatId,
              name: 'A1',
              category: 'VIP',
              gender: 'both',
              color: '#2563eb',
              event_id: eventId,
              x: 20,
              y: 20,
              width: 64,
              height: 64,
            },
            {
              id: 'stage',
              name: 'STAGE',
              category: 'STAGE',
              color: '#1f2937',
              event_id: eventId,
              x: 20,
              y: 120,
              width: 180,
              height: 56,
            },
          ],
        },
      });
      return;
    }

    if (request.method() === 'GET' && path === '/api/seats/locked') {
      await route.fulfill({
        json: {
          data: state.expireLocks ? [] : Array.from(state.lockedSeats.values()),
        },
      });
      return;
    }

    if (request.method() === 'GET' && path === '/api/booked-seats') {
      await route.fulfill({
        json: {
          data: state.bookedSeats.map(({ seat_id, event_id }) => ({ seat_id, event_id })),
        },
      });
      return;
    }

    if (request.method() === 'GET' && path === '/api/booked-seats/me') {
      const requester = ticketFromAuthorization(request.headers(), ticket);
      const booked = state.bookedSeats.find((item) => item.ticket_id === requester.ticket_id) || null;
      await route.fulfill({ json: { data: booked } });
      return;
    }

    if (request.method() === 'POST' && path === '/api/verify-ticket-pdf') {
      await route.fulfill({
        json: {
          data: [
            {
              ...ticket,
              ticket_name: 'VIP',
              event_id: eventId,
              token: tokenFor(ticket),
            },
          ],
        },
      });
      return;
    }

    if (request.method() === 'POST' && path === '/api/seats/lock') {
      const body = request.postDataJSON() as { seat_id: string; action?: 'lock' | 'unlock' };
      const requester = ticketFromAuthorization(request.headers(), ticket);
      const existing = state.lockedSeats.get(body.seat_id);

      if (body.action === 'unlock') {
        if (existing?.admin_id === requester.ticket_id) {
          state.lockedSeats.delete(body.seat_id);
        }
        await route.fulfill({ json: { status: 'unlocked' } });
        return;
      }

      if (existing || state.bookedSeats.some((booked) => booked.seat_id === body.seat_id)) {
        await route.fulfill({
          json: {
            status: 'taken',
            data: { message: 'Kursi sudah dikunci peserta lain' },
          },
        });
        return;
      }

      state.lockedSeats.set(body.seat_id, {
        id: `${eventId}:${body.seat_id}`,
        seat_id: body.seat_id,
        admin_id: requester.ticket_id,
        event_id: eventId,
      });
      await route.fulfill({ json: { status: 'locked' } });
      return;
    }

    if (request.method() === 'POST' && path === '/api/seats/confirm') {
      const body = request.postDataJSON() as { seat_id: string };
      const requester = ticketFromAuthorization(request.headers(), ticket);
      const lock = state.lockedSeats.get(body.seat_id);

      if (!lock || lock.admin_id !== requester.ticket_id) {
        await route.fulfill({
          status: 409,
          json: { message: 'Kursi belum terkunci untuk tiket ini' },
        });
        return;
      }

      state.lockedSeats.delete(body.seat_id);
      state.bookedSeats.push({
        seat_id: body.seat_id,
        ticket_id: requester.ticket_id,
        event_id: eventId,
        name: requester.name,
      });
      await route.fulfill({ json: { data: { status: 'confirmed' } } });
      return;
    }

    await route.fallback();
  });
}

async function uploadTicket(page: Page) {
  await page.addInitScript((id) => {
    window.localStorage.setItem(`tutorial_seen_${id}`, 'true');
  }, eventId);
  await page.goto(`/booking/${eventId}`);
  await expect(page.locator('h1', { hasText: 'Integration Test Event' })).toBeVisible();
  await page.getByTestId('mobile-add-ticket-button').click();
  await page.locator('input[data-testid="ticket-pdf-input"]').last().setInputFiles({
    name: 'ticket.pdf',
    mimeType: 'application/pdf',
    buffer: Buffer.from('%PDF-1.4 e2e ticket'),
  });
}

test('klik ulang kursi milik sendiri melepas lock', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'mobile-chrome', 'Flow ini memverifikasi action bar khusus mobile.');
  const ticket = {
    ticket_id: 'ticket-unlock',
    ticket_code: 'TCK-UNLOCK',
    name: 'Budi Santoso',
    gender: 'male',
    category: 'VIP',
  };
  const state = {
    lockedSeats: new Map<string, LockedSeat>(),
    bookedSeats: [],
    expireLocks: false,
  };

  await mockBookingBackend(page, ticket, state);
  await uploadTicket(page);

  const seat = page.getByTestId(`seat-${seatId}`);
  await seat.click();
  await expect(seat).toHaveAttribute('data-seat-status', 'mine');

  await seat.click();
  await expect(seat).toHaveAttribute('data-seat-status', 'available');
  await expect(page.getByTestId('mobile-confirm-button')).toHaveCount(0);
  expect(state.lockedSeats.has(seatId)).toBe(false);
});

test('upload tiket, lock kursi tetap setelah refresh, timeout melepas lock, lalu invoice benar', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'mobile-chrome', 'Flow ini memverifikasi action bar khusus mobile.');
  const ticket = {
    ticket_id: 'ticket-1',
    ticket_code: 'TCK-001',
    name: 'Budi Santoso',
    gender: 'male',
    category: 'VIP',
  };
  const state = {
    lockedSeats: new Map<string, LockedSeat>(),
    bookedSeats: [],
    expireLocks: false,
  };

  await mockBookingBackend(page, ticket, state);
  await uploadTicket(page);

  await expect(page.getByTestId('ticket-session-ticket-1').last()).toBeVisible();
  await page.getByTestId(`seat-${seatId}`).click();
  await expect(page.getByTestId(`seat-${seatId}`)).toHaveAttribute('data-seat-status', 'mine');
  await expect(page.locator('strong', { hasText: '5:00' }).last()).toBeVisible();

  await page.reload();
  await expect(page.getByTestId('ticket-session-ticket-1').last()).toBeVisible();
  await expect(page.getByTestId(`seat-${seatId}`)).toHaveAttribute('data-seat-status', 'mine');

  state.expireLocks = true;
  state.lockedSeats.clear();
  await page.reload();
  await expect(page.getByTestId(`seat-${seatId}`)).toHaveAttribute('data-seat-status', 'available');
  await expect(page.getByTestId('mobile-confirm-button')).toHaveCount(0);

  state.expireLocks = false;
  await page.getByTestId(`seat-${seatId}`).click();
  await page.getByTestId('mobile-confirm-button').click();
  await page.getByTestId('confirm-booking-submit').click();

  await expect(page.getByTestId('mobile-invoice-button')).toBeVisible();
  await page.getByTestId('mobile-invoice-button').click();
  await expect(page.getByRole('dialog', { name: 'Invoice Booking' })).toContainText('Budi Santoso');
  await expect(page.getByRole('dialog', { name: 'Invoice Booking' })).toContainText('Kursi: A1');
});

test('dua peserta tidak bisa mengunci kursi yang sama bersamaan', async ({ browser }) => {
  const state = {
    lockedSeats: new Map<string, LockedSeat>(),
    bookedSeats: [],
    expireLocks: false,
  };
  const ticketA = {
    ticket_id: 'ticket-a',
    ticket_code: 'TCK-A',
    name: 'Peserta A',
    gender: 'male',
    category: 'VIP',
  };
  const ticketB = {
    ticket_id: 'ticket-b',
    ticket_code: 'TCK-B',
    name: 'Peserta B',
    gender: 'male',
    category: 'VIP',
  };

  const mobileContext = {
    viewport: { width: 412, height: 915 },
    isMobile: true,
    hasTouch: true,
    userAgent:
      'Mozilla/5.0 (Linux; Android 13; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0 Mobile Safari/537.36',
  };
  const contextA = await browser.newContext(mobileContext);
  const contextB = await browser.newContext(mobileContext);
  const pageA = await contextA.newPage();
  const pageB = await contextB.newPage();

  await mockBookingBackend(pageA, ticketA, state);
  await mockBookingBackend(pageB, ticketB, state);
  await Promise.all([uploadTicket(pageA), uploadTicket(pageB)]);
  await Promise.all([
    expect(pageA.getByTestId('ticket-session-ticket-a').last()).toBeVisible(),
    expect(pageB.getByTestId('ticket-session-ticket-b').last()).toBeVisible(),
  ]);

  await Promise.all([
    pageA.getByTestId(`seat-${seatId}`).click(),
    pageB.getByTestId(`seat-${seatId}`).click(),
  ]);

  const winnerPage = state.lockedSeats.get(seatId)?.admin_id === ticketA.ticket_id ? pageA : pageB;
  const loserPage = winnerPage === pageA ? pageB : pageA;

  await expect(winnerPage.getByTestId(`seat-${seatId}`)).toHaveAttribute('data-seat-status', 'mine');
  await expect(loserPage.getByText('Kursi sudah dikunci peserta lain')).toBeVisible();
  expect(state.lockedSeats.size).toBe(1);
  expect(state.bookedSeats).toHaveLength(0);

  await contextA.close();
  await contextB.close();
});
