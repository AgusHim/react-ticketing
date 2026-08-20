import {
    Table,
    TableBody,
    TableCaption,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { useEffect, useMemo, useState } from "react";
import { useTickets } from "@/context/TicketsContext";
import type { Ticket } from "@/types/ticket";
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
import { markGoodieBagsClaimed } from "@/api/ticket-api";
import { toast } from "sonner";

export function TableTickets() {
    const { tickets, search, handleSearch, category, handleCategoryChange, refreshTickets } = useTickets();
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [selectedTicketsById, setSelectedTicketsById] = useState<Record<string, Ticket>>({});
    const [isConfirmOpen, setIsConfirmOpen] = useState(false);
    const [isBulkLoading, setIsBulkLoading] = useState(false);
    const [processingIds, setProcessingIds] = useState<string[]>([]);

    const getGoodieBagStatus = (ticket: { goodie_bag_claimed?: boolean }) => ticket.goodie_bag_claimed === true;

    // Search replaces `tickets` with a new result set. Keep a local snapshot of
    // selected tickets so selections remain available even when they do not match
    // the latest search query.
    useEffect(() => {
        setSelectedTicketsById((previous) => {
            let changed = false;
            const next = { ...previous };

            tickets.forEach((ticket) => {
                if (ticket.id && previous[ticket.id]) {
                    next[ticket.id] = ticket;
                    changed = true;
                }
            });

            return changed ? next : previous;
        });
    }, [tickets]);

    const selectedTickets = useMemo(
        () => selectedIds.map((id) => selectedTicketsById[id]).filter((ticket): ticket is Ticket => Boolean(ticket)),
        [selectedIds, selectedTicketsById]
    );

    const displayedTickets = useMemo(() => {
        const selected = selectedTickets;
        const unselected = tickets.filter((ticket) => !ticket.id || !selectedIds.includes(ticket.id));
        return [...selected, ...unselected];
    }, [tickets, selectedIds, selectedTickets]);

    const selectedGoodieBagStatus = selectedTickets.length > 0 ? getGoodieBagStatus(selectedTickets[0]) : null;
    const selectableGoodieBagStatus = selectedGoodieBagStatus ?? false;

    const claimableTicketIds = useMemo(
        () => tickets
            .filter((ticket) => ticket.id && getGoodieBagStatus(ticket) === selectableGoodieBagStatus && !processingIds.includes(ticket.id))
            .map((ticket) => ticket.id!),
        [tickets, selectableGoodieBagStatus, processingIds]
    );

    const allClaimableSelected = claimableTicketIds.length > 0 && claimableTicketIds.every((id) => selectedIds.includes(id));
    const partiallySelected = !allClaimableSelected && selectedIds.some((id) => claimableTicketIds.includes(id));
    const canConfirmSelected = selectedTickets.length > 0 && selectedGoodieBagStatus === false;
    const isProcessingTicket = (id?: string) => !!id && processingIds.includes(id);

    const handleClaimGoodieBag = async (id: string) => {
        if (isProcessingTicket(id)) return;

        setProcessingIds((prev) => Array.from(new Set([...prev, id])));
        try {
            await markGoodieBagsClaimed([id]);
            await refreshTickets();
            setSelectedIds((prev) => prev.filter((selectedId) => selectedId !== id));
            setSelectedTicketsById((prev) => {
                const { [id]: _, ...next } = prev;
                return next;
            });
            toast.success("Goodie bag ditandai sudah diambil");
        } catch (error: any) {
            toast.error(error?.response?.data?.message || "Gagal mengonfirmasi goodie bag");
        } finally {
            setProcessingIds((prev) => prev.filter((processingId) => processingId !== id));
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

    const handleSelectTicket = (ticket: typeof tickets[number], checked: boolean) => {
        if (!ticket.id || isProcessingTicket(ticket.id)) return;

        setSelectedIds((prev) => {
            if (!checked) {
                return prev.filter((selectedId) => selectedId !== ticket.id);
            }

            const ticketGoodieBagStatus = getGoodieBagStatus(ticket);
            const sameStatusSelectedIds = prev.filter((selectedId) => {
                const selectedTicket = selectedTicketsById[selectedId];
                return selectedTicket && getGoodieBagStatus(selectedTicket) === ticketGoodieBagStatus;
            });

            return Array.from(new Set([...sameStatusSelectedIds, ticket.id!]));
        });
        setSelectedTicketsById((prev) => {
            if (!checked) {
                const { [ticket.id!]: _, ...next } = prev;
                return next;
            }
            return { ...prev, [ticket.id!]: ticket };
        });
    };

    const handleConfirmSelected = async () => {
        const ids = selectedTickets
            .filter((ticket) => !ticket.goodie_bag_claimed)
            .map((ticket) => ticket.id)
            .filter(Boolean) as string[];
        if (ids.length === 0) {
            toast.error("Pilih tiket yang belum mengambil goodie bag");
            return;
        }

        setIsBulkLoading(true);
        setProcessingIds((prev) => Array.from(new Set([...prev, ...ids])));
        try {
            await markGoodieBagsClaimed(ids);
            await refreshTickets();
            setSelectedIds([]);
            setSelectedTicketsById({});
            setIsConfirmOpen(false);
            toast.success(`${ids.length} tiket ditandai sudah mengambil goodie bag`);
        } catch (error: any) {
            toast.error(error?.response?.data?.message || "Gagal mengonfirmasi goodie bag terpilih");
        } finally {
            setProcessingIds((prev) => prev.filter((processingId) => !ids.includes(processingId)));
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
        <div className="space-y-5 px-5">
            <div className="neo-surface-sm flex flex-col items-stretch justify-between gap-4 bg-neo-purple p-4 md:flex-row md:items-center">
                <div className="flex w-full flex-row items-center gap-2">
                    <IconSearch />
                    <Input className="w-full md:w-1/3" placeholder="Cari berdasarkan id, nama, email..." value={search} onChange={handleChange} />
                    <Select value={category || "all"} onValueChange={(v) => handleCategoryChange(v === "all" ? "" : v)}>
                        <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="Semua Kategori" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Semua Kategori</SelectItem>
                            <SelectItem value="platinum">Platinum</SelectItem>
                            <SelectItem value="gold">Gold</SelectItem>
                            <SelectItem value="silver">Silver</SelectItem>
                            <SelectItem value="VIP">VIP</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <Button
                    type="button"
                    disabled={!canConfirmSelected || isBulkLoading}
                    onClick={() => setIsConfirmOpen(true)}
                    className="min-w-48"
                    title={selectedGoodieBagStatus === true ? "Tiket yang sudah mengambil goodie bag tidak perlu dikonfirmasi lagi" : undefined}
                >
                    <IconChecks />
                    Konfirmasi Terpilih ({selectedTickets.length})
                </Button>
            </div>
            <Table>
                <TableCaption>Daftar tiket</TableCaption>
                <TableHeader>
                    <TableRow>
                        <TableHead className="w-10">
                            <Checkbox
                                checked={allClaimableSelected ? true : partiallySelected ? "indeterminate" : false}
                                disabled={isBulkLoading}
                                onCheckedChange={handleSelectAll}
                                aria-label={selectableGoodieBagStatus ? "Pilih semua tiket yang sudah mengambil goodie bag" : "Pilih semua tiket yang belum mengambil goodie bag"}
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
                    {displayedTickets.map((ticket) => {
                        const isSelected = !!ticket.id && selectedIds.includes(ticket.id);
                        const isProcessing = isProcessingTicket(ticket.id);
                        const canSelectRow = !!ticket.id && !isProcessing;

                        return (
                            <TableRow
                                key={ticket.id}
                                data-state={isSelected ? "selected" : undefined}
                                className={canSelectRow ? "cursor-pointer" : "opacity-70"}
                                onClick={() => canSelectRow && handleSelectTicket(ticket, !isSelected)}
                            >
                                <TableCell onClick={(event) => event.stopPropagation()}>
                                    <Checkbox
                                        checked={isSelected}
                                        disabled={!ticket.id || isProcessing}
                                        onCheckedChange={(checked) => handleSelectTicket(ticket, checked === true)}
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
                                <TableCell onClick={(event) => event.stopPropagation()}>
                                    <button
                                        className={`rounded-lg border-2 border-neo-border px-3 py-1 text-xs font-extrabold transition-colors disabled:cursor-not-allowed disabled:opacity-70 ${ticket.goodie_bag_claimed ? 'bg-neo-mint text-neo-mint-solid' : 'bg-neo-yellow hover:bg-neo-yellow-solid'}`}
                                        disabled={!ticket.id || ticket.goodie_bag_claimed || isProcessing}
                                        onClick={(event) => {
                                            event.stopPropagation();
                                            handleClaimGoodieBag(ticket.id!);
                                        }}
                                    >
                                        {isProcessing ? 'Memproses...' : ticket.goodie_bag_claimed ? 'Sudah Diambil' : 'Tandai Diambil'}
                                    </button>
                                </TableCell>
                            </TableRow>
                        );
                    })}
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
                    <div className="max-h-96 overflow-auto rounded-xl">
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
                        <Button type="button" onClick={handleConfirmSelected} disabled={isBulkLoading || !canConfirmSelected}>
                            {isBulkLoading ? 'Memproses...' : 'Konfirmasi'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
