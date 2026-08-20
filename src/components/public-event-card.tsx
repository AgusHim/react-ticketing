import { Link } from "react-router-dom";
import type { EventModel } from "@/api/event-api";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { IconArrowRight, IconCalendarEvent, IconMapPin, IconTicket } from "@tabler/icons-react";

export function PublicEventCard({ event }: { event: EventModel }) {
  const detailPath = `/events/${event.slug || event.id}`;
  return (
    <Card className="group flex h-full flex-col overflow-hidden bg-neo-mint">
      <div className="h-40 overflow-hidden border-b-2 border-neo-border bg-white">
        {event.image_url ? (
          <img
            src={event.image_url}
            alt=""
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            <IconTicket className="size-12 text-foreground/30" />
          </div>
        )}
      </div>
      <CardContent className="flex flex-1 flex-col p-5">
        {event.community && (
          <Link
            to={`/communities/${event.community.slug}`}
            className="mb-2 text-xs font-black uppercase hover:underline"
          >
            {event.community.name}
          </Link>
        )}
        <h2 className="line-clamp-2 text-xl font-black">{event.name}</h2>
        <div className="mt-4 grid gap-2 text-xs font-bold">
          <span className="flex items-center gap-2">
            <IconCalendarEvent className="size-4" />
            {new Date(event.date).toLocaleDateString("id-ID", {
              weekday: "short",
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </span>
          <span className="flex items-center gap-2">
            <IconMapPin className="size-4" />
            {event.location}
          </span>
        </div>
        <Button asChild className="mt-5 w-full">
          <Link to={detailPath}>
            Lihat Event <IconArrowRight className="size-4" />
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}
