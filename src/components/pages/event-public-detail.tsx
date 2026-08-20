import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { getPublicEvent, type EventModel } from "@/api/event-api";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { IconCalendarEvent, IconMapPin, IconTicket } from "@tabler/icons-react";
import { usePublicMetadata } from "@/hooks/use-public-metadata";
import { SharePageButton } from "@/components/share-page-button";

export default function EventPublicDetailPage() {
  const { idOrSlug = "" } = useParams();
  const [event, setEvent] = useState<EventModel | null>(null);
  const [error, setError] = useState("");
  usePublicMetadata(
    event
      ? {
          title: event.name,
          description:
            event.description || `${event.name} di ${event.location}`,
          image: event.image_url,
          type: "article",
        }
      : null,
  );

  useEffect(() => {
    getPublicEvent(idOrSlug)
      .then(setEvent)
      .catch(() => setError("Event tidak ditemukan"));
  }, [idOrSlug]);

  if (error) {
    return <main className="mx-auto max-w-5xl p-10 text-center font-black">{error}</main>;
  }
  if (!event) {
    return <main className="mx-auto max-w-5xl p-10 text-center font-black">Memuat event...</main>;
  }

  return (
    <main>
      <section className="border-b-2 border-neo-border bg-neo-mint">
        <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 md:grid-cols-[1fr_380px] md:py-16">
          <div>
            {event.community && (
              <Link
                to={`/communities/${event.community.slug}`}
                className="text-sm font-black uppercase hover:underline"
              >
                {event.community.name}
              </Link>
            )}
            <h1 className="mt-4 text-4xl font-black md:text-6xl">{event.name}</h1>
            <div className="mt-6 flex flex-wrap gap-4 text-sm font-bold">
              <span className="flex items-center gap-2">
                <IconCalendarEvent className="size-5" />
                {new Date(event.date).toLocaleString("id-ID", {
                  weekday: "long",
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
              <span className="flex items-center gap-2">
                <IconMapPin className="size-5" /> {event.location}
              </span>
            </div>
          </div>
          <Card className="bg-neo-yellow">
            <CardContent className="flex h-full flex-col justify-center p-6">
              <IconTicket className="size-10" />
              <h2 className="mt-4 text-xl font-black">Pendaftaran Event</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Lanjutkan untuk verifikasi tiket atau memilih kursi jika tersedia.
              </p>
              <Button asChild className="mt-5">
                <Link to={`/booking?event_id=${event.id}`}>Lanjutkan Booking</Link>
              </Button>
              <div className="mt-3">
                <SharePageButton title={event.name} />
              </div>
            </CardContent>
          </Card>
        </div>
      </section>
      <section className="mx-auto max-w-4xl px-4 py-10">
        <h2 className="text-2xl font-black">Tentang Event</h2>
        <p className="mt-4 whitespace-pre-line leading-7 text-muted-foreground">
          {event.description || "Informasi event akan segera tersedia."}
        </p>
      </section>
    </main>
  );
}
