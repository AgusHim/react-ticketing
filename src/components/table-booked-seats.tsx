import {
    Table,
    TableBody,
    TableCaption,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Input } from "./ui/input";
import { IconSearch } from "@tabler/icons-react";
import { useBookedSeats } from "@/context/BookedSeatsContext";
import { useState, useMemo } from "react";
import { SelectShowBookedSeat } from "./select-show-booked-seat";

export function TableBookedSeats() {
    const { bookedSeats } = useBookedSeats();
    const [search, setSearch] = useState("");

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearch(e.target.value);
    };

    const filteredSeats = useMemo(() => {
        if (!search) return bookedSeats;

        return bookedSeats?.filter((data) => {
            const seatName = data.seat?.name?.toLowerCase() || "";
            const seatCategory = data.seat?.category?.toLowerCase() || "";
            const ticketId = data.ticket?.ticket_id?.toLowerCase() || "";
            const name = data.ticket?.name?.toLowerCase() || "";
            const gender = data.ticket?.gender?.toLowerCase() || "";
            const email = data.ticket?.email?.toLowerCase() || "";
            const phone = data.ticket?.phone?.toLowerCase() || "";

            const keyword = search.toLowerCase();
            return (
                seatName.includes(keyword) ||
                seatCategory.includes(keyword) ||
                ticketId.includes(keyword) ||
                name.includes(keyword) ||
                gender.includes(keyword) ||
                email.includes(keyword) ||
                phone.includes(keyword)
            );
        });
    }, [search, bookedSeats]);

    return (
        <div className="space-y-5 px-5">
            <div className="neo-surface-sm flex flex-col items-stretch justify-between gap-4 bg-neo-purple p-4 md:flex-row md:items-center">
                <SelectShowBookedSeat/>
                <div className="w-full flex flex-row items-center gap-2">
                    <IconSearch />
                    <Input
                        className="w-full md:w-1/2"
                        placeholder="Cari berdasarkan no kursi, nama atau id tiket"
                        value={search}
                        onChange={handleChange}
                    />
                </div>
            </div>
            <Table>
                <TableCaption>Daftar kursi yang telah dipesan</TableCaption>
                <TableHeader>
                    <TableRow>
                        <TableHead className="w-[100px]">Seat Number</TableHead>
                        <TableHead className="w-[100px]">Category</TableHead>
                        <TableHead className="w-20">Ticket Darisini</TableHead>
                        <TableHead className="w-20">Ticket Name</TableHead>
                        <TableHead className="w-40">Name</TableHead>
                        <TableHead className="w-10">Gender</TableHead>
                        <TableHead className="w-20">Email</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {filteredSeats?.map((data) => (
                        <TableRow key={data.id}>
                            <TableCell className="font-medium">{data.seat?.name}</TableCell>
                            <TableCell className="font-medium">{data.seat?.category}</TableCell>
                            <TableCell>{data.ticket?.ticket_id}</TableCell>
                            <TableCell>{data.ticket?.ticket_name}</TableCell>
                            <TableCell>{data.ticket?.name}</TableCell>
                            <TableCell>{data.ticket?.gender}</TableCell>
                            <TableCell>{data.ticket?.email}</TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    );
}
