import {
    Table,
    TableBody,
    TableCaption,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { useMemo, useState } from "react";
import { useTickets } from "@/context/TicketsContext";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { Checkbox } from "./ui/checkbox";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "./ui/dialog";
import { IconChecks, IconSearch } from "@tabler/icons-react";
import { markGoodieBagsClaimed, toggleGoodieBag } from "@/api/ticket-api";
import { toast } from "sonner";

export function TableTickets() {
    const { tickets, setTickets, search, handleSearch } = useTickets();
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [isConfirmOpen, setIsConfirmOpen] = useState(false);
    const [isBulkLoading, setIsBulkLoading] = useState(false);

    const claimableTicketIds = useMemo(
        () => tickets.filter((ticket) => ticket.id && !ticket.goodie_bag_claimed).map((ticket) => ticket.id!),
        [tickets]
    );

    const selectedTickets = useMemo(
        () => tickets.filter((ticket) => ticket.id && selectedIds.includes(ticket.id)),
        [tickets, selectedIds]
    );

    const allClaimableSelected = claimableTicketIds.length > 0 && claimableTicketIds.every((id) => selectedIds.includes(id));
    const partiallySelected = !allClaimableSelected && selectedIds.some((id) => claimableTicketIds.includes(id));

    const handleToggleGoodieBag = async (id: string) => {
        try {
            const updatedTicket = await toggleGoodieBag(id);
            setTickets((prev) =>
                prev.map((t) => (t.id === id ? { ...t, ...updatedTicket } : t))
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

    const handleSelectAll = () => {
        if (allClaimableSelected) {
            setSelectedIds((prev) => prev.filter((id) => !claimableTicketIds.includes(id)));
            return;
        }

        setSelectedIds((prev) => Array.from(new Set([...prev, ...claimableTicketIds])));
    };

    const handleSelectTicket = (id: string, checked: boolean) => {
        setSelectedIds((prev) => checked ? Array.from(new Set([...prev, id])) : prev.filter((selectedId) => selectedId !== id));
    };

    const handleConfirmSelected = async () => {
        const ids = selectedTickets.map((ticket) => ticket.id).filter(Boolean) as string[];
        if (ids.length === 0) {
            toast.error("Pilih tiket terlebih dahulu");
            return;
        }

        setIsBulkLoading(true);
        try {
            const updatedTickets = await markGoodieBagsClaimed(ids);
            const updatedById = new Map(updatedTickets.map((ticket) => [ticket.id, ticket]));
            setTickets((prev) =>
                prev.map((ticket) => {
                    if (!ticket.id || !ids.includes(ticket.id)) {
                        return ticket;
                    }
                    return {
                        ...ticket,
                        ...updatedById.get(ticket.id),
                        goodie_bag_claimed: true,
                        darisini_scan_status: updatedById.get(ticket.id)?.darisini_scan_status || "pending",
                    };
                })
            );
            setSelectedIds([]);
            setIsConfirmOpen(false);
            toast.success(`${ids.length} tiket ditandai sudah mengambil goodie bag`);
        } catch (error: any) {
            toast.error(error?.response?.data?.message || "Gagal mengonfirmasi goodie bag terpilih");
        } finally {
            setIsBulkLoading(false);
        }
    };

    const renderScanStatus = (status?: string, response?: string) => {
        if (!status) {
            return <span className="text-xs text-slate-400">-</span>;
        }

        const className = status === "success"
            ? "bg-green-100 text-green-700 border-green-300"
            : status === "failed"
                ? "bg-red-100 text-red-700 border-red-300"
                : status === "pending"
                    ? "bg-blue-100 text-blue-700 border-blue-300"
                    : "bg-slate-100 text-slate-700 border-slate-300";

        return (
            <span title={response || status} className={`inline-flex max-w-32 truncate rounded-full border px-2 py-1 text-xs font-semibold ${className}`}>
                {status}
            </span>
        );
    };

    return (
        <>
            <div className="flex flex-row justify-between items-center gap-5 mx-5">
                <div className="w-full flex flex-row items-center gap-2"><IconSearch /><Input className="w-1/2" placeholder="Cari berdasarkan id , nama, email ..." value={search} onChange={handleChange} /></div>
                <Button
                    type="button"
                    disabled={selectedTickets.length === 0}
                    onClick={() => setIsConfirmOpen(true)}
                    className="min-w-48"
                >
                    <IconChecks />
                    Konfirmasi Terpilih ({selectedTickets.length})
                </Button>
            </div>
            <Table className="m-5">
                <TableCaption>A list of tickets</TableCaption>
                <TableHeader>
                    <TableRow>
                        <TableHead className="w-10">
                            <Checkbox
                                checked={allClaimableSelected ? true : partiallySelected ? "indeterminate" : false}
                                onCheckedChange={handleSelectAll}
                                aria-label="Pilih semua tiket yang belum mengambil goodie bag"
                            />
                        </TableHead>
                        <TableHead className="w-[100px]">ID</TableHead>
                        <TableHead className="w-40">Ticket Name</TableHead>
                        <TableHead className="w-40">Kategori</TableHead>
                        <TableHead className="w-40">Name</TableHead>
                        <TableHead className="w-10">Gender</TableHead>
                        <TableHead className="w-20">Email</TableHead>
                        <TableHead className="w-20">Event</TableHead>
                        <TableHead className="w-32">Scan Darisini</TableHead>
                        <TableHead className="w-32">Goodie Bag</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {tickets?.map((ticket) => (
                        <TableRow key={ticket.id}>
                            <TableCell>
                                <Checkbox
                                    checked={!!ticket.id && selectedIds.includes(ticket.id)}
                                    disabled={!ticket.id || ticket.goodie_bag_claimed}
                                    onCheckedChange={(checked) => ticket.id && handleSelectTicket(ticket.id, checked === true)}
                                    aria-label={`Pilih tiket ${ticket.ticket_code || ticket.id}`}
                                />
                            </TableCell>
                            <TableCell className="font-medium">{ticket.ticket_code}</TableCell>
                            <TableCell>{ticket.ticket_name}</TableCell>
                            <TableCell>{ticket.category}</TableCell>
                            <TableCell>{ticket.name}</TableCell>
                            <TableCell>{ticket.gender}</TableCell>
                            <TableCell>{ticket.email}</TableCell>
                            <TableCell>{ticket.event?.name ?? ''}</TableCell>
                            <TableCell>{renderScanStatus(ticket.darisini_scan_status, ticket.darisini_scan_response)}</TableCell>
                            <TableCell>
                                <button
                                    className={`px-3 py-1 text-xs font-semibold rounded-full border transition-colors ${ticket.goodie_bag_claimed ? 'bg-green-100 text-green-700 border-green-300' : 'bg-slate-100 text-slate-600 border-slate-300 hover:bg-slate-200'}`}
                                    disabled={!ticket.id}
                                    onClick={() => handleToggleGoodieBag(ticket.id!)}
                                >
                                    {ticket.goodie_bag_claimed ? 'Sudah Diambil' : 'Tandai Diambil'}
                                </button>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>

            <Dialog open={isConfirmOpen} onOpenChange={setIsConfirmOpen}>
                <DialogContent className="sm:max-w-3xl">
                    <DialogHeader>
                        <DialogTitle>Konfirmasi Pengambilan Goodie Bag</DialogTitle>
                        <DialogDescription>
                            Tiket berikut akan ditandai sudah mengambil goodie bag dan diproses scan ke Darisini.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="max-h-96 overflow-auto rounded-md border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>ID</TableHead>
                                    <TableHead>Nama</TableHead>
                                    <TableHead>Email</TableHead>
                                    <TableHead>Ticket</TableHead>
                                    <TableHead>Event</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {selectedTickets.map((ticket) => (
                                    <TableRow key={ticket.id}>
                                        <TableCell className="font-medium">{ticket.ticket_code}</TableCell>
                                        <TableCell>{ticket.name}</TableCell>
                                        <TableCell>{ticket.email}</TableCell>
                                        <TableCell>{ticket.ticket_name}</TableCell>
                                        <TableCell>{ticket.event?.name ?? ''}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => setIsConfirmOpen(false)} disabled={isBulkLoading}>
                            Batal
                        </Button>
                        <Button type="button" onClick={handleConfirmSelected} disabled={isBulkLoading || selectedTickets.length === 0}>
                            {isBulkLoading ? 'Memproses...' : 'Konfirmasi'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    )
}
