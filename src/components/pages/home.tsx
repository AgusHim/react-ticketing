import { useCallback, useEffect, useState } from "react";
import {
  getFollowingEvents,
  searchPublicEvents,
  type EventModel,
} from "@/api/event-api";
import { PublicEventCard } from "@/components/public-event-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/context/AuthContext";
import { IconLoader2, IconSearch, IconTicket } from "@tabler/icons-react";
import { toast } from "sonner";

export default function HomePage() {
  const [events, setEvents] = useState<EventModel[]>([]);
  const [followingEvents, setFollowingEvents] = useState<EventModel[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [filters, setFilters] = useState({ q: "", location: "" });
  const { user } = useAuth();

  const loadEvents = useCallback(async (q: string, location: string) => {
    setIsLoading(true);
    try {
      const result = await searchPublicEvents({ q, location, limit: 12 });
      setEvents(result.events);
      setTotal(result.total);
    } catch {
      toast.error("Gagal memuat event");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadEvents("", "");
  }, [loadEvents]);

  useEffect(() => {
    if (!user) {
      setFollowingEvents([]);
      return;
    }
    getFollowingEvents()
      .then(setFollowingEvents)
      .catch(() => toast.error("Gagal memuat event komunitas yang diikuti"));
  }, [user]);

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void loadEvents(filters.q, filters.location);
  }

  function reset() {
    setFilters({ q: "", location: "" });
    void loadEvents("", "");
  }

  return (
    <main className="min-h-[100dvh] bg-bg-app text-foreground">
      <section className="neo-dots border-b-2 border-neo-border">
        <div className="mx-auto max-w-6xl px-4 py-12 md:py-20">
          <h1 className="text-center text-4xl font-black md:text-6xl">
            Pilih Event Favoritmu
          </h1>
          <p className="mx-auto mt-3 max-w-xl text-center text-sm font-medium text-muted-foreground md:text-base">
            Temukan kajian dan aktivitas komunitas yang sudah terverifikasi tenant-nya.
          </p>
          <form
            onSubmit={submit}
            className="mx-auto mt-7 grid max-w-3xl gap-3 rounded-2xl border-2 border-neo-border bg-white p-3 shadow-[4px_4px_0_#1a1a1a] sm:grid-cols-[1fr_220px_auto]"
          >
            <Input
              aria-label="Cari event"
              placeholder="Cari nama atau topik event"
              value={filters.q}
              onChange={(event) => setFilters({ ...filters, q: event.target.value })}
            />
            <Input
              aria-label="Filter lokasi"
              placeholder="Lokasi"
              value={filters.location}
              onChange={(event) => setFilters({ ...filters, location: event.target.value })}
            />
            <Button type="submit">
              <IconSearch className="size-4" /> Cari
            </Button>
          </form>
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-4 py-10">
        {followingEvents.length > 0 && (
          <section className="mb-12">
            <h2 className="text-2xl font-black">Dari Komunitas yang Kamu Ikuti</h2>
            <div className="mt-5 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              {followingEvents.map((event) => (
                <PublicEventCard key={event.id} event={event} />
              ))}
            </div>
          </section>
        )}

        <section>
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 className="text-2xl font-black">Semua Event</h2>
              <p className="mt-1 text-sm text-muted-foreground">{total} event ditemukan</p>
            </div>
            {(filters.q || filters.location) && (
              <Button type="button" variant="outline" size="sm" onClick={reset}>
                Reset filter
              </Button>
            )}
          </div>
          {isLoading ? (
            <div className="flex items-center justify-center gap-3 py-24 font-bold">
              <IconLoader2 className="size-6 animate-spin" /> Memuat event...
            </div>
          ) : events.length === 0 ? (
            <div className="py-20 text-center">
              <IconTicket className="mx-auto size-14 text-foreground/30" />
              <h3 className="mt-4 text-xl font-black">Event tidak ditemukan</h3>
            </div>
          ) : (
            <div className="mt-5 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              {events.map((event) => (
                <PublicEventCard key={event.id} event={event} />
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
