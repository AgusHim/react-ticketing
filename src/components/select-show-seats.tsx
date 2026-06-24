import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useSeats } from "@/context/SeatsContext";
import { getAllEvents, type EventModel } from "@/api/event-api";

export function SelectShowSeat() {
  const { toggleSelectShow, selectedShow } = useSeats();
  const [events, setEvents] = useState<EventModel[]>([]);
  const [searchParams] = useSearchParams();

  useEffect(() => {
    getAllEvents()
      .then((data) => {
        setEvents(data);

        const eventIdParam = searchParams.get("event_id");

        // If URL has event_id and it exists, select it
        if (eventIdParam && data.find(e => e.id === eventIdParam)) {
          // Only toggle if it's not already selected
          if (selectedShow !== eventIdParam) {
            toggleSelectShow(eventIdParam);
          }
        }
        // Otherwise, auto select first event if none is selected
        else if (!selectedShow || (selectedShow === 'reconnect' && !data.find(e => e.id === 'reconnect'))) {
          if (data.length > 0) {
            toggleSelectShow(data[0].id);
          }
        }
      })
      .catch(console.error);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  return (
    <Select value={selectedShow} onValueChange={(value) => toggleSelectShow(value)}>
      <SelectTrigger className="w-full bg-slate-800 border-slate-700 text-white">
        <SelectValue placeholder="Pilih Event" />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          <SelectLabel>Daftar Event</SelectLabel>
          {events.map((evt) => (
            <SelectItem key={evt.id} value={evt.id}>
              {evt.name}
            </SelectItem>
          ))}
          {events.length === 0 && (
            <SelectItem value="default" disabled>Tidak ada event</SelectItem>
          )}
        </SelectGroup>
      </SelectContent>
    </Select>
  )
}
