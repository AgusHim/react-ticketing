import {
    Table,
    TableBody,
    TableCaption,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { useTickets } from "@/context/TicketsContext";
import { Input } from "./ui/input";
import { IconSearch } from "@tabler/icons-react";
import { toggleGoodieBag } from "@/api/ticket-api";
import { toast } from "sonner";

export function TableTickets() {
    const { tickets, setTickets, search, handleSearch } = useTickets();

    const handleToggleGoodieBag = async (id: string) => {
        try {
            const updatedTicket = await toggleGoodieBag(id);
            setTickets((prev) =>
                prev.map((t) => (t.id === id ? { ...t, goodie_bag_claimed: updatedTicket.goodie_bag_claimed } : t))
            );
            toast.success(updatedTicket.goodie_bag_claimed ? "Goodie bag ditandai sudah diambil" : "Goodie bag dibatalkan");
        } catch (error: any) {
            toast.error(error?.response?.data?.message || "Gagal mengubah status goodie bag");
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { value } = e.target;
        handleSearch(value);
    };

    return (
        <>
            <div className="flex flex-row justify-between items-center gap-5 mx-5">
                <div className="w-full flex flex-row items-center gap-2"><IconSearch /><Input className="w-1/2" placeholder="Cari berdasarkan id , nama, email ..." value={search} onChange={handleChange} /></div>
                {/* <Button><span><IconPlus /></span>Tambah</Button> */}
            </div>
            <Table className="m-5">
                <TableCaption>A list of tickets</TableCaption>
                <TableHeader>
                    <TableRow>
                        <TableHead className="w-[100px]">ID</TableHead>
                        <TableHead className="w-40">Ticket Name</TableHead>
                        <TableHead className="w-40">Kategori</TableHead>
                        <TableHead className="w-40">Name</TableHead>
                        <TableHead className="w-10">Gender</TableHead>
                        <TableHead className="w-20">Email</TableHead>
                        <TableHead className="w-20">Event</TableHead>
                        <TableHead className="w-32">Goodie Bag</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {tickets?.map((ticket) => (
                        <TableRow key={ticket.id}>
                            <TableCell className="font-medium">{ticket.ticket_code}</TableCell>
                            <TableCell>{ticket.ticket_name}</TableCell>
                            <TableCell>{ticket.category}</TableCell>
                            <TableCell>{ticket.name}</TableCell>
                            <TableCell>{ticket.gender}</TableCell>
                            <TableCell>{ticket.email}</TableCell>
                            <TableCell>{ticket.event?.name ?? ''}</TableCell>
                            <TableCell>
                                <button
                                    className={`px-3 py-1 text-xs font-semibold rounded-full border transition-colors ${ticket.goodie_bag_claimed ? 'bg-green-100 text-green-700 border-green-300' : 'bg-slate-100 text-slate-600 border-slate-300 hover:bg-slate-200'}`}
                                    onClick={() => handleToggleGoodieBag(ticket.id!)}
                                >
                                    {ticket.goodie_bag_claimed ? 'Sudah Diambil' : 'Tandai Diambil'}
                                </button>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </>
    )
}
