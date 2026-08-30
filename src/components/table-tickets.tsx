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
import type { Ticket, DarisiniCheck } from "@/types/ticket";
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
import { IconChecks, IconSearch, IconCircleCheck } from "@tabler/icons-react";
import { markGoodieBagsClaimed, checkTicketDarisini } from "@/api/ticket-api";
import { toast } from "sonner";

export function TableTickets() {
    const { tickets, search, handleSearch, category, handleCategoryChange, refreshTickets } = useTickets();
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [selectedTicketsById, setSelectedTicketsById] = useState<Record<string, Ticket>>({});
    const [isConfirmOpen, setIsConfirmOpen] = useState(false);
    const [isBulkLoading, setIsBulkLoading] = useState(false);
    const [processingIds, setProcessingIds] = useState<string[]>([]);
    const [checkDialog, setCheckDialog] = useState<{ ticket: Ticket; result: DarisiniCheck } | null>(null);

    const getGoodieBagStatus = (ticket: { goodie_bag_claimed?: boolean }) => ticket.goodie_bag_claimed === true;

    // Normalize the gender value (which can come from Darisini, CSV, or Excel
    // import as "Laki-laki", "Perempuan", "L", "P", "Pria", "Male", etc.) into
    // a badge color class. Case-insensitive and tolerant of Indonesian terms.
    const getGenderBadgeClass = (gender?: string) => {
        if (!gender) return "bg-neutral-200 text-neutral-600";
        const g = gender.toLowerCase().trim();
        if (g === "male" || g.includes("laki") || g === "l" || g === "pria" || g === "m") {
            return "bg-blue-500 text-white";
        }
        if (g === "female" || g.includes("perempuan") || g === "p" || g === "wanita" || g === "f") {
            return "bg-pink-500 text-white";
        }
        return "bg-neutral-200 text-neutral-600";
    };

    const normalizeGender = (gender?: string) => {
        if (!gender) return "-";
        const g = gender.toLowerCase().trim();
        if (g === "male" || g.includes("laki") || g === "l" || g === "pria" || g === "m") return "L";
        if (g === "female" || g.includes("perempuan") || g === "p" || g === "wanita" || g === "f") return "P";
        return gender;
    };

    const formatDateTime = (iso?: string) => {
        if (!iso) return "-";
        const d = new Date(iso);
        if (isNaN(d.getTime())) return iso;
        return d.toLocaleString("id-ID", { dateStyle: "medium", timeStyle: "short" });
    };

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

        const toastId = `claim-${id}`;
        toast.loading("Menandai goodie bag & memindai ke Darisini...", { id: toastId });
        setProcessingIds((prev) => Array.from(new Set([...prev, id])));
        try {
            await markGoodieBagsClaimed([id]);
            await refreshTickets();
            setSelectedIds((prev) => prev.filter((selectedId) => selectedId !== id));
            setSelectedTicketsById((prev) => {
                const { [id]: _, ...next } = prev;
                return next;
            });
            toast.success("Goodie bag ditandai sudah diambil", { id: toastId });
        } catch (error: any) {
            toast.error(error?.response?.data?.message || "Gagal mengonfirmasi goodie bag", { id: toastId });
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

    const applySelect = (ticket: typeof tickets[number], checked: boolean) => {
        if (!ticket.id) return;

        setSelectedIds((prev) => {
            if (!checked) {
                return prev.filter((selectedId) => selectedId !== ticket.id);
            }
            // Append to the existing selection without filtering by goodie bag
            // status. Mixing statuses is allowed; bulk-confirm already filters
            // to only the unclaimed tickets at submit time.
            return Array.from(new Set([...prev, ticket.id!]));
        });
        setSelectedTicketsById((prev) => {
            if (!checked) {
                const { [ticket.id!]: _, ...next } = prev;
                return next;
            }
            return { ...prev, [ticket.id!]: ticket };
        });
    };

    const handleSelectTicket = async (ticket: typeof tickets[number], checked: boolean) => {
        if (!ticket.id || isProcessingTicket(ticket.id)) return;

        if (!checked) {
            applySelect(ticket, false);
            return;
        }

        // Do NOT select yet. Validate against Darisini first so a scanned
        // ticket can be reviewed before being added to the selection. This is
        // non-blocking for other tickets: clicking another row starts its own
        // independent scan. The loading alert shows while this scan runs.
        const ticketId = ticket.id;
        const toastId = `darisini-scan-${ticketId}`;
        toast.loading("Memeriksa tiket ke Darisini...", { id: toastId });
        setProcessingIds((prev) => Array.from(new Set([...prev, ticketId])));
        try {
            const result = await checkTicketDarisini(ticketId);
            const attendance = result?.data?.attendance ?? [];
            if (attendance.length > 0) {
                // Scanned: show review popup. The ticket is only added to the
                // selection when the user confirms via "Lanjut Checklist".
                setCheckDialog({ ticket, result });
                toast.info("Tiket sudah pernah discan. Tinjau detail sebelum melanjutkan.", { id: toastId });
            } else {
                applySelect(ticket, true);
                toast.success("Tiket belum discan, aman.", { id: toastId });
            }
        } catch (error: any) {
            toast.error(error?.response?.data?.message || "Gagal mengecek tiket ke Darisini", { id: toastId });
        } finally {
            setProcessingIds((prev) => prev.filter((id) => id !== ticketId));
        }
    };

    const handleConfirmCheckTicket = () => {
        if (!checkDialog) return;
        applySelect(checkDialog.ticket, true);
        setCheckDialog(null);
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

        const toastId = "bulk-claim";
        toast.loading(`Memproses ${ids.length} tiket & memindai ke Darisini...`, { id: toastId });
        setIsBulkLoading(true);
        setProcessingIds((prev) => Array.from(new Set([...prev, ...ids])));
        try {
            await markGoodieBagsClaimed(ids);
            await refreshTickets();
            setSelectedIds([]);
            setSelectedTicketsById({});
            setIsConfirmOpen(false);
            toast.success(`${ids.length} tiket ditandai sudah mengambil goodie bag`, { id: toastId });
        } catch (error: any) {
            toast.error(error?.response?.data?.message || "Gagal mengonfirmasi goodie bag terpilih", { id: toastId });
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
                        <TableHead className="w-64">Peserta</TableHead>
                        <TableHead className="w-40">Ticket Name</TableHead>
                        <TableHead className="w-40">Kategori</TableHead>
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
                                <TableCell>
                                    <div className="flex items-center gap-3 min-w-0">
                                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-neo-purple text-sm font-bold text-white">
                                            {(ticket.name || "?").charAt(0).toUpperCase()}
                                        </div>
                                        <div className="flex min-w-0 flex-col">
                                            <div className="flex items-center gap-2">
                                                <span className="truncate font-medium" title={ticket.name || "-"}>
                                                    {ticket.name || "-"}
                                                </span>
                                                {ticket.gender && (
                                                    <span className={`shrink-0 rounded-full border border-neo-border px-1.5 py-0.5 text-[10px] font-bold uppercase ${getGenderBadgeClass(ticket.gender)}`}>
                                                        {normalizeGender(ticket.gender)}
                                                    </span>
                                                )}
                                            </div>
                                            <span className="truncate text-xs text-muted-foreground" title={ticket.email || ""}>
                                                {ticket.email || "-"}
                                            </span>
                                        </div>
                                    </div>
                                </TableCell>
                                <TableCell>{ticket.ticket_name}</TableCell>
                                <TableCell>{ticket.category}</TableCell>
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
                                    <TableHead>Peserta</TableHead>
                                    <TableHead>Ticket</TableHead>
                                    <TableHead>Event</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {selectedTickets.map((ticket) => (
                                    <TableRow key={ticket.id}>
                                        <TableCell className="font-medium">{ticket.ticket_code}</TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-3 min-w-0">
                                                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-neo-purple text-sm font-bold text-white">
                                                    {(ticket.name || "?").charAt(0).toUpperCase()}
                                                </div>
                                                <div className="flex min-w-0 flex-col">
                                                    <div className="flex items-center gap-2">
                                                        <span className="truncate font-medium" title={ticket.name || "-"}>
                                                            {ticket.name || "-"}
                                                        </span>
                                                        {ticket.gender && (
                                                            <span className={`shrink-0 rounded-full border border-neo-border px-1.5 py-0.5 text-[10px] font-bold uppercase ${getGenderBadgeClass(ticket.gender)}`}>
                                                                {normalizeGender(ticket.gender)}
                                                            </span>
                                                        )}
                                                    </div>
                                                    <span className="truncate text-xs text-muted-foreground" title={ticket.email || ""}>
                                                        {ticket.email || "-"}
                                                    </span>
                                                </div>
                                            </div>
                                        </TableCell>
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

            <Dialog open={!!checkDialog} onOpenChange={(open) => { if (!open) setCheckDialog(null); }}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <IconCircleCheck className="size-5 text-neo-mint-solid" />
                            Tiket Sudah Discan
                        </DialogTitle>
                        <DialogDescription>
                            Tiket berikut sudah tercatat kehadirannya di Darisini. Tinjau detail, lalu konfirmasi untuk melanjutkan checklist.
                        </DialogDescription>
                    </DialogHeader>
                    {checkDialog && (() => {
                        const { ticket, result } = checkDialog;
                        const data = result?.data ?? null;
                        const attendance = data?.attendance ?? [];
                        const latest = attendance.length > 0 ? attendance[attendance.length - 1] : undefined;
                        return (
                            <div className="space-y-3">
                                <div className="rounded-xl border-2 border-neo-border bg-neo-yellow p-3 text-sm">
                                    <div className="font-extrabold">{data?.ticket?.name || ticket.ticket_name || '-'}</div>
                                    <div className="text-muted-foreground">{data?.ticket?.eventTitle || ticket.event?.name || '-'}</div>
                                </div>
                                <div className="rounded-xl border-2 border-neo-border p-3 text-sm space-y-1">
                                    <div className="mb-1 font-bold">Sudah discan:</div>
                                    <div className="flex justify-between gap-2">
                                        <span className="text-muted-foreground">Kapan</span>
                                        <span className="font-medium text-right">{formatDateTime(latest?.attendedAt)}</span>
                                    </div>
                                    <div className="flex justify-between gap-2">
                                        <span className="text-muted-foreground">Oleh</span>
                                        <span className="font-medium text-right">{latest?.scannerUserFullName || '-'}</span>
                                    </div>
                                    <div className="flex justify-between gap-2">
                                        <span className="text-muted-foreground">Jumlah Scan</span>
                                        <span className="font-medium text-right">{data?.currentScanCount ?? 0}/{data?.maximumScan ?? 0}</span>
                                    </div>
                                </div>
                                <div className="rounded-xl border-2 border-neo-border p-3 text-sm space-y-1">
                                    <div className="mb-1 font-bold">Pemilik Tiket:</div>
                                    <div className="flex justify-between gap-2">
                                        <span className="text-muted-foreground">Nama</span>
                                        <span className="font-medium text-right">{data?.ownerUserFullName || ticket.name || '-'}</span>
                                    </div>
                                    <div className="flex justify-between gap-2">
                                        <span className="text-muted-foreground">Email</span>
                                        <span className="font-medium text-right">{data?.ownerUserEmail || ticket.email || '-'}</span>
                                    </div>
                                    <div className="flex justify-between gap-2">
                                        <span className="text-muted-foreground">Kode</span>
                                        <span className="font-medium text-right">{data?.publicId || ticket.ticket_code || '-'}</span>
                                    </div>
                                </div>
                                {result?.error?.message && (
                                    <p className="text-xs text-amber-600">Catatan: {result.error.message}</p>
                                )}
                            </div>
                        );
                    })()}
                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => setCheckDialog(null)}>
                            Batal
                        </Button>
                        <Button type="button" onClick={handleConfirmCheckTicket}>
                            Lanjut Checklist
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
