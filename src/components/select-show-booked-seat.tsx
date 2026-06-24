import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useBookedSeats } from "@/context/BookedSeatsContext"

export function SelectShowBookedSeat() {
  const { toggleSelectShow, selectedShow, events } = useBookedSeats();

  return (
    <Select value={selectedShow} onValueChange={(value) => toggleSelectShow(value)}>
      <SelectTrigger className="w-[200px] border-2 border-black font-bold text-lg">
        <SelectValue placeholder="Pilih Event" />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          <SelectLabel>Events</SelectLabel>
          {events.map((event) => (
            <SelectItem key={event.id} value={event.id}>
              {event.name}
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  )
}
