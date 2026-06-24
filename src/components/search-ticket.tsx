import { useState } from "react"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "@/components/ui/command"
import { Button } from "@/components/ui/button"
import { ChevronsUpDown } from "lucide-react"
import { cn } from "@/lib/utils"
import { useBookedSeats } from "@/context/BookedSeatsContext"
import type { Ticket } from "@/types/ticket"
import type { Seat } from "@/types/seat"
import { toast } from "sonner"

interface SearchTicketProps {
    seat: Seat;
}

export function SearchTicket({ seat }: SearchTicketProps) {
    const [open, setOpen] = useState(false)
    const [selected, setSelected] = useState<Ticket | null>(null)
    const [search, setSearch] = useState("")
    const [loading, setLoading] = useState(false)
    const { tickets, searchTicketsByID, handleSelectedTicket,setTickets } = useBookedSeats();

    const handleSearch = async (id: string) => {
        setSearch(id);
        if (id.length > 3) {
            setLoading(true);
            await searchTicketsByID(id);
            setLoading(false);
        }
    }

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button variant="outline" role="combobox" className="w-full justify-between">
                    {selected ? <div className="flex flex-row text-sm gap-2">
                        <div>{selected.ticket_id}</div>
                        <div>{selected.name}</div>
                    </div> : "Find ticket id ,name email ..."}
                    <ChevronsUpDown className="ml-2 h-4 w-4 opacity-50" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[300px] p-0">
                <Command shouldFilter={false}>
                    <CommandInput
                        placeholder="Ticket ID Darisini"
                        value={search}
                        onValueChange={handleSearch}
                    />
                    <CommandEmpty>
                        {loading ? "Loading..." : "No results found."}
                    </CommandEmpty>
                    <CommandGroup>
                        {tickets.map((item) => {
                            const isBooked = item.booked_seat != null;
                            const bookedSeat = item.booked_seat?.seat;

                            return (
                                <CommandItem
                                    key={item.id}
                                    value={item.id}
                                    onSelect={() => {
                                        if (isBooked) {
                                            toast.error(
                                                `Tiket sudah digunakan untuk kursi ${bookedSeat?.name} (${bookedSeat?.category})`
                                            );
                                            return;
                                        }
                                        handleSelectedTicket(item, seat);
                                        setSelected(item);
                                        setTickets([]);
                                        setOpen(false);
                                    }}
                                    className={cn(
                                        "cursor-pointer",
                                        isBooked && "bg-destructive/10 text-destructive hover:text-destructive hover:bg-destructive/20 cursor-not-allowed"
                                    )}
                                >
                                    <div className="flex flex-col">
                                        <div className="text-sm font-medium">
                                            {item.ticket_id} <span className="ml-2">{item.name}</span>
                                        </div>
                                        <div className="text-xs text-muted-foreground">{`${item.ticket_name} - ${item.event_id || item.show_id || ''}`}</div>
                                        <div className="text-xs text-muted-foreground">{item.email}</div>
                                        {isBooked && bookedSeat && (
                                            <div className="text-xs font-semibold">
                                                Booked: {bookedSeat.category} - {bookedSeat.name}
                                            </div>
                                        )}
                                    </div>
                                </CommandItem>
                            );
                        })}
                    </CommandGroup>
                </Command>
            </PopoverContent>
        </Popover>
    )
}
