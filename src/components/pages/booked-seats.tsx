import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { BookedSeatsProvider } from "@/context/BookedSeatsProvider"
import BookedSeats from "../booked-seats"
import { useState, useMemo } from "react"
import { IconMap, IconTable, IconCheck, IconLoader2, IconArmchair, IconInfoCircle, IconTicket, IconSearch, IconX, IconPlus } from "@tabler/icons-react"
import CartSeats from "../cart-seats"
import { SelectShowBookedSeat } from "../select-show-booked-seat"
import BookedSeatsSocket from "../booked-seat-socket"
import { SelecCategory } from "../select-category"
import { CELL_SIZE, COLS, ROWS } from "@/config/config"
import { TableBookedSeats } from "../table-booked-seats"
import { useBookedSeats } from "@/context/BookedSeatsContext"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerTrigger, DrawerDescription } from "@/components/ui/drawer"
import type { Ticket } from "@/types/ticket"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"

function BookedSeatsPageInner() {
    const [activeTab, setActiveTab] = useState<'layout' | 'table'>('layout');
    const [showConfirmDialog, setShowConfirmDialog] = useState(false);
    const [isConfirming, setIsConfirming] = useState(false);
    const [showLegend, setShowLegend] = useState(false);

    // New Ticket First Flow States
    const [selectedTickets, setSelectedTickets] = useState<Ticket[]>([]);
    const [activeTicketId, setActiveTicketId] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [isSearching, setIsSearching] = useState(false);

    const {
        seats,
        authSelectedSeats,
        bookedSeats,
        claimBookingSeats,
        tickets,
        searchTicketsByID,
        setTickets,
        toggleSeat // We may need this to unlock seats if a ticket is removed
    } = useBookedSeats();

    const activeTicket = useMemo(() => selectedTickets.find(t => t.id === activeTicketId) || null, [selectedTickets, activeTicketId]);

    const lockedPairsForConfirm = useMemo(() => {
        return authSelectedSeats.map(locked => {
            const seat = seats.find(s => s.id === locked.seat_id);
            const ticket = selectedTickets.find(t => t.id === (locked as any).ticket_id);
            return { locked, seat, ticket };
        });
    }, [authSelectedSeats, seats, selectedTickets]);

    // Check if all selected tickets have been assigned a seat
    const allTicketsAssigned = useMemo(() => {
        if (selectedTickets.length === 0) return false;
        return selectedTickets.every(ticket => {
            return authSelectedSeats.some(locked => (locked as any).ticket_id === ticket.id);
        });
    }, [selectedTickets, authSelectedSeats]);

    const handleConfirmBooking = async () => {
        if (lockedPairsForConfirm.length === 0) return;
        setIsConfirming(true);
        try {
            await claimBookingSeats();
            setShowConfirmDialog(false);
            // Clear selected tickets after successful booking
            setSelectedTickets([]);
            setActiveTicketId(null);
        } catch {
            // error handled in context
        } finally {
            setIsConfirming(false);
        }
    };

    const handleSearchTicket = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const query = e.target.value;
        setSearchQuery(query);
        if (query.length > 3) {
            setIsSearching(true);
            await searchTicketsByID(query);
            setIsSearching(false);
        } else {
            setTickets([]);
        }
    };

    const handleAddTicket = (ticket: Ticket) => {
        if (selectedTickets.find(t => t.id === ticket.id)) {
            toast.error("Ticket sudah ditambahkan ke sesi ini.");
            return;
        }
        if (ticket.booked_seat != null) {
            toast.error(`Tiket sudah digunakan untuk kursi ${ticket.booked_seat.seat?.name}`);
            return;
        }

        const newTickets = [...selectedTickets, ticket];
        setSelectedTickets(newTickets);
        if (!activeTicketId) {
            setActiveTicketId(ticket.id!);
        }
    };

    const handleRemoveTicket = (ticketId: string) => {
        // Find if this ticket has a locked seat
        const lockedSeat = authSelectedSeats.find(s => (s as any).ticket_id === ticketId);
        if (lockedSeat) {
            // Unlock the seat via API / Context
            toggleSeat(lockedSeat.seat_id!, undefined);
        }

        const newTickets = selectedTickets.filter(t => t.id !== ticketId);
        setSelectedTickets(newTickets);
        if (activeTicketId === ticketId) {
            setActiveTicketId(newTickets.length > 0 ? newTickets[0].id! : null);
        }
    };

    // Stats
    const totalSeats = seats.filter(s => s.category !== 'STAGE').length;
    const bookedCount = bookedSeats.length;
    const availableCount = totalSeats - bookedCount - authSelectedSeats.length;

    return (
        <>
            <SiteHeader title="Booked Seats" />
            <div className="flex flex-1 flex-col overflow-hidden relative" style={{ background: '#0a0a0a' }}>

                {/* ── Top Controls Bar ── */}
                <div className="flex items-center justify-between px-4 py-2.5 shrink-0 z-20 border-b border-white/[0.06]" style={{ background: '#0d0d0d' }}>
                    <div className="flex items-center gap-2 flex-wrap">
                        {/* Tab Switcher */}
                        <div className="flex items-center bg-white/[0.06] rounded-xl p-1 gap-0.5">
                            <button
                                onClick={() => setActiveTab('layout')}
                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 ${activeTab === 'layout' ? 'bg-white/10 text-white' : 'text-neutral-500 hover:text-neutral-300'}`}
                            >
                                <IconMap className="h-3.5 w-3.5" /> Layout
                            </button>
                            <button
                                onClick={() => setActiveTab('table')}
                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 ${activeTab === 'table' ? 'bg-white/10 text-white' : 'text-neutral-500 hover:text-neutral-300'}`}
                            >
                                <IconTable className="h-3.5 w-3.5" /> Table
                            </button>
                        </div>

                        {/* Event Selector */}
                        <div className="[&_button]:bg-white/[0.06] [&_button]:border-white/[0.08] [&_button]:text-neutral-300 [&_button]:rounded-xl [&_button]:text-xs [&_button]:font-medium">
                            <SelectShowBookedSeat />
                        </div>

                        {/* Category Filter */}
                        <div className="[&_button]:bg-white/[0.06] [&_button]:border-white/[0.08] [&_button]:text-neutral-300 [&_button]:rounded-xl [&_button]:text-xs [&_button]:font-medium">
                            <SelecCategory />
                        </div>

                        {/* Legend toggle (mobile) */}
                        <button
                            onClick={() => setShowLegend(!showLegend)}
                            className="md:hidden w-8 h-8 rounded-xl bg-white/[0.06] hover:bg-white/10 flex items-center justify-center text-neutral-400 transition-colors active:scale-95"
                        >
                            <IconInfoCircle className="h-4 w-4" />
                        </button>
                    </div>

                    <div className="hidden md:flex items-center gap-2">
                        <CartSeats />
                    </div>
                </div>

                {/* ── Mobile Legend Dropdown ── */}
                {showLegend && (
                    <div className="flex md:hidden flex-wrap gap-x-4 gap-y-1.5 px-4 py-2.5 border-b border-white/[0.06] z-20"
                        style={{ background: '#0f0f0f' }}>
                        {[
                            { color: 'bg-blue-500', label: 'Tersedia', count: availableCount },
                            { color: 'bg-emerald-500', label: 'Dipilih', count: authSelectedSeats.length },
                            { color: 'bg-amber-500', label: 'Dikunci', count: 0 },
                            { color: 'bg-neutral-500', label: 'Terisi', count: bookedCount },
                        ].map((item) => (
                            <div key={item.label} className="flex items-center gap-1.5">
                                <div className={`w-2 h-2 rounded-full ${item.color}`} />
                                <span className="text-[10px] text-neutral-400">{item.label}</span>
                                <span className="text-[10px] text-neutral-600 font-mono">{item.count}</span>
                            </div>
                        ))}
                    </div>
                )}

                {/* ── Desktop Legend ── */}
                <div className="hidden md:block absolute bottom-24 right-6 z-40">
                    <div className="bg-black/60 backdrop-blur-xl p-4 rounded-2xl border border-white/[0.08] w-44">
                        <h3 className="text-[10px] font-semibold text-neutral-500 uppercase tracking-wider mb-3">Keterangan</h3>
                        <div className="space-y-2.5 text-[11px]">
                            {[
                                { color: 'bg-blue-500', glow: 'shadow-[0_0_6px_rgba(59,130,246,0.4)]', label: 'Tersedia', count: availableCount, countColor: 'text-neutral-400' },
                                { color: 'bg-emerald-500', glow: 'shadow-[0_0_6px_rgba(16,185,129,0.4)]', label: 'Dipilih Admin', count: authSelectedSeats.length, countColor: 'text-emerald-400' },
                                { color: 'bg-amber-500', glow: 'shadow-[0_0_6px_rgba(245,158,11,0.4)]', label: 'Dikunci User', count: 0, countColor: 'text-amber-400' },
                                { color: 'bg-neutral-500', glow: 'shadow-[0_0_6px_rgba(115,115,115,0.4)]', label: 'Terisi', count: bookedCount, countColor: 'text-neutral-400' },
                            ].map((item) => (
                                <div key={item.label} className="flex items-center justify-between text-neutral-300">
                                    <div className="flex items-center gap-2">
                                        <div className={`w-2.5 h-2.5 rounded-full ${item.color} ${item.glow}`} />
                                        <span>{item.label}</span>
                                    </div>
                                    <span className={`font-mono text-[10px] ${item.countColor}`}>{item.count}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* ── Content Area (Seat Map / Table) — FULL HEIGHT ── */}
                <div className="flex-1 overflow-hidden">
                    {activeTab === 'layout' ? (
                        <BookedSeatsSocket>
                            <BookedSeats cols={COLS} rows={ROWS} seatSize={CELL_SIZE} activeTicket={activeTicket} />
                        </BookedSeatsSocket>
                    ) : (
                        <div className="h-full overflow-y-auto p-4" style={{ scrollbarWidth: 'thin', scrollbarColor: '#333 transparent' }}>
                            <div className="rounded-2xl overflow-hidden border border-white/[0.06]" style={{ background: '#141414' }}>
                                <TableBookedSeats />
                            </div>
                        </div>
                    )}
                </div>

                {/* ═══════════════ BOTTOM TICKET BAR (FLOATING) ═══════════════ */}
                <div
                    className="absolute bottom-6 left-1/2 -translate-x-1/2 z-30 flex flex-col w-[calc(100%-2rem)] md:min-w-100 md:w-max max-w-4xl border border-white/10 shadow-2xl rounded-2xl overflow-hidden backdrop-blur-xl transition-all duration-300"
                    style={{
                        background: 'rgba(13, 13, 13, 0.85)',
                    }}
                >
                    {/* Active Tickets Horizontal List */}
                    <div className="px-4 py-3 flex gap-3 overflow-x-auto items-center" style={{ scrollbarWidth: 'none' }}>
                        <Drawer>
                            <DrawerTrigger asChild>
                                <button className="shrink-0 flex items-center justify-center gap-2 h-12 px-4 rounded-xl border border-dashed border-white/20 hover:border-white/40 bg-white/[0.02] hover:bg-white/[0.04] transition-all text-neutral-400 hover:text-white group shadow-inner">
                                    <IconPlus className="h-4 w-4" />
                                    <span className="text-xs font-medium text-white">Pilih Tiket</span>
                                </button>
                            </DrawerTrigger>
                            <DrawerContent className="bg-[#141414] border-t-white/[0.08] text-white">
                                <div className="mx-auto w-full max-w-3xl">
                                    <DrawerHeader className="pb-2">
                                        <DrawerTitle className="text-white font-bold text-xl">Pilih Tiket</DrawerTitle>
                                        <DrawerDescription className="text-neutral-400">
                                            Cari tiket berdasarkan ID, Nama, atau Email untuk ditambahkan ke sesi.
                                        </DrawerDescription>
                                    </DrawerHeader>
                                    <div className="p-4 flex flex-col gap-4">
                                        <div className="relative">
                                            <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-500" />
                                            <Input
                                                placeholder="Cari ID, Nama, Email..."
                                                value={searchQuery}
                                                onChange={handleSearchTicket}
                                                className="pl-9 bg-[#0a0a0a] border-white/[0.08] h-11 rounded-xl text-sm"
                                            />
                                        </div>
                                        <div className="h-[40vh] overflow-y-auto space-y-2 pr-2" style={{ scrollbarWidth: 'thin', scrollbarColor: '#333 transparent' }}>
                                            {isSearching ? (
                                                <div className="flex items-center justify-center h-full text-neutral-500">
                                                    <IconLoader2 className="h-5 w-5 animate-spin mr-2" /> Mencari...
                                                </div>
                                            ) : tickets.length === 0 && searchQuery.length > 3 ? (
                                                <div className="flex items-center justify-center h-full text-neutral-500">
                                                    Tidak ada tiket ditemukan.
                                                </div>
                                            ) : (
                                                tickets.map(item => {
                                                    const isBooked = item.booked_seat != null;
                                                    const isAlreadySelected = !!selectedTickets.find(t => t.id === item.id);
                                                    return (
                                                        <div key={item.id} className="flex items-center justify-between p-3 rounded-xl bg-white/[0.03] border border-white/[0.05]">
                                                            <div>
                                                                <p className="text-sm font-semibold">{item.ticket_id} <span className="ml-2 text-neutral-300 font-normal">{item.name}</span></p>
                                                                <p className="text-xs text-neutral-500">{item.ticket_name} - {item.email}</p>
                                                                {isBooked && (
                                                                    <p className="text-[10px] text-red-400 mt-1 font-medium">Sudah dipesan: {item.booked_seat?.seat?.name}</p>
                                                                )}
                                                            </div>
                                                            <button
                                                                disabled={isBooked || isAlreadySelected}
                                                                onClick={() => handleAddTicket(item)}
                                                                className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-white/10 hover:bg-white/20 disabled:opacity-30 transition-colors"
                                                            >
                                                                {isAlreadySelected ? "Ditambahkan" : "Tambah"}
                                                            </button>
                                                        </div>
                                                    )
                                                })
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </DrawerContent>
                        </Drawer>

                        {/* Selected Tickets Chips */}
                        {selectedTickets.map((ticket) => {
                            const isAssigned = authSelectedSeats.some(s => (s as any).ticket_id === ticket.id);
                            const assignedSeat = authSelectedSeats.find(s => (s as any).ticket_id === ticket.id);
                            const seatName = assignedSeat ? seats.find(s => s.id === assignedSeat.seat_id)?.name : null;
                            const isActive = activeTicketId === ticket.id;

                            return (
                                <div
                                    key={ticket.id}
                                    onClick={() => setActiveTicketId(ticket.id!)}
                                    className={`shrink-0 flex items-center h-12 rounded-xl border pl-3 pr-2 gap-3 cursor-pointer transition-all ${isActive
                                        ? 'bg-emerald-500/10 border-emerald-500/30 shadow-[0_0_15px_rgba(16,185,129,0.1)]'
                                        : 'bg-white/[0.05] border-white/[0.1] hover:bg-white/[0.08]'
                                        }`}
                                >
                                    <div className="flex flex-col justify-center min-w-[100px] max-w-[140px]">
                                        <p className={`text-xs font-semibold truncate ${isActive ? 'text-emerald-400' : 'text-neutral-200'}`}>{ticket.ticket_code || ticket.ticket_id}</p>
                                        <span className="text-[9px] text-white truncate max-w-[80px] gap-1.5 mt-0.5">{ticket.name}</span>
                                        <div className="flex items-center gap-1.5 mt-0.5">
                                            {ticket.gender && <span className={`text-[8px] px-1 rounded uppercase font-bold ${ticket.gender.toLowerCase() === 'male' ? 'bg-blue-500/20 text-blue-400' : 'bg-pink-500/20 text-pink-400'}`}>{ticket.gender}</span>}
                                            {ticket.category && <span className={`text-[8px] px-1 rounded uppercase font-bold ${ticket.category.toLowerCase() === 'platinum' ? 'bg-yellow-500/20 text-yellow-400' : 'bg-pink-500/20 text-pink-400'}`}>{ticket.category}</span>}
                                        </div>
                                    </div>

                                    {/* Seat Indicator */}
                                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold ${isAssigned ? 'bg-emerald-500 shadow-md shadow-emerald-500/20 text-white' : 'bg-white/10 text-neutral-400 border border-dashed border-white/20'}`}>
                                        {isAssigned && seatName ? seatName : <IconArmchair className="h-4 w-4" />}
                                    </div>

                                    <button
                                        onClick={(e) => { e.stopPropagation(); handleRemoveTicket(ticket.id!); }}
                                        className="w-6 h-6 flex items-center justify-center rounded-md hover:bg-red-500/20 text-neutral-500 hover:text-red-400 transition-colors ml-1"
                                    >
                                        <IconX className="h-3.5 w-3.5" />
                                    </button>
                                </div>
                            )
                        })}
                    </div>

                    {/* Final Action Bar */}
                    <div className="px-4 py-2.5 border-t border-white/[0.08] flex items-center justify-between bg-white/[0.02]">
                        <div className="text-xs font-medium text-neutral-400">
                            {selectedTickets.length === 0 ? "Belum ada tiket di sesi" : `${selectedTickets.length} Tiket dipilih`}
                        </div>
                        <button
                            onClick={() => setShowConfirmDialog(true)}
                            disabled={!allTicketsAssigned || selectedTickets.length === 0}
                            className="flex items-center gap-2 rounded-xl bg-emerald-500 px-5 py-2 text-sm font-semibold text-white hover:bg-emerald-600 transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed shadow-lg shadow-emerald-500/20"
                        >
                            <IconCheck className="h-4 w-4" />
                            Konfirmasi Booking
                        </button>
                    </div>
                </div>

                {/* ═══════════════ CONFIRM BOOKING DIALOG ═══════════════ */}
                <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
                    <DialogContent className="sm:max-w-md bg-[#141414] border-neutral-800 text-neutral-200 mx-4 rounded-2xl p-0 overflow-hidden">
                        <div className="px-5 pt-5 pb-3">
                            <DialogHeader>
                                <DialogTitle className="text-white text-base">Konfirmasi Pemesanan</DialogTitle>
                                <DialogDescription className="text-neutral-500 text-sm">
                                    Pastikan detail {lockedPairsForConfirm.length} tiket berikut sudah benar.
                                </DialogDescription>
                            </DialogHeader>
                        </div>

                        <div className="px-5 pb-5 space-y-3 max-h-[60vh] overflow-y-auto" style={{ scrollbarWidth: 'thin', scrollbarColor: '#333 transparent' }}>
                            {lockedPairsForConfirm.map((pair, _) => {
                                return (
                                    <div key={pair.locked.seat_id} className="rounded-xl p-4" style={{ background: '#1a1a1a', border: '1px solid rgba(255,255,255,0.06)' }}>
                                        <div className="flex items-center gap-3">
                                            <div className="w-12 h-12 rounded-xl bg-emerald-500/15 flex items-center justify-center text-emerald-400 text-base font-bold shrink-0 border border-emerald-500/20">
                                                {pair.seat?.name || '-'}
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <div className="flex items-center gap-2 mb-0.5">
                                                    <IconArmchair className="h-3.5 w-3.5 text-emerald-400" />
                                                    <p className="text-[11px] font-semibold text-neutral-500 uppercase tracking-wider">Kursi</p>
                                                </div>
                                                <p className="text-[14px] font-semibold text-white">{pair.seat?.name || 'Tidak diketahui'}</p>
                                            </div>
                                        </div>
                                        {pair.ticket && (
                                            <div className="mt-3 pt-3 border-t border-white/[0.04]">
                                                <div className="flex items-center gap-2 mb-1.5">
                                                    <IconTicket className="h-3.5 w-3.5 text-blue-400" />
                                                    <p className="text-[11px] font-semibold text-neutral-500 uppercase tracking-wider">Tiket</p>
                                                </div>
                                                <div className="flex items-center justify-between mb-1">
                                                    <span className="text-[13px] font-mono font-semibold text-white">{pair.ticket.ticket_code || pair.ticket.id}</span>
                                                    {pair.ticket.category && (
                                                        <span className="text-[10px] px-1.5 py-0.5 rounded font-bold uppercase bg-amber-500/15 text-amber-400">
                                                            {pair.ticket.category}
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="flex items-center justify-between mt-1">
                                                    <span className="text-[12px] text-neutral-400">{pair.ticket.name || '-'}</span>
                                                    <span className="text-[12px] text-neutral-400">{pair.ticket.ticket_name || '-'}</span>
                                                    {pair.ticket.gender && (
                                                        <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold uppercase ${pair.ticket.gender.toLowerCase() === 'male' ? 'bg-blue-500/15 text-blue-400' : 'bg-pink-500/15 text-pink-400'}`}>
                                                            {pair.ticket.gender.toLowerCase() === 'male' ? 'Pria' : 'Wanita'}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}

                            <div className="flex gap-2 pt-2 sticky bottom-0" style={{ background: '#141414' }}>
                                <button
                                    onClick={() => setShowConfirmDialog(false)}
                                    className="flex items-center justify-center gap-1.5 flex-1 py-2.5 rounded-xl text-sm font-medium text-neutral-400 hover:text-white bg-white/[0.04] hover:bg-white/[0.08] transition-all active:scale-[0.97] border border-white/[0.06]"
                                >
                                    <IconX className="h-4 w-4" /> Batal
                                </button>
                                <button
                                    onClick={handleConfirmBooking}
                                    disabled={isConfirming || lockedPairsForConfirm.length === 0}
                                    className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-500 transition-all active:scale-[0.97] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                >
                                    {isConfirming ? (
                                        <><IconLoader2 className="h-4 w-4 animate-spin" /> Memproses...</>
                                    ) : (
                                        <><IconCheck className="h-4 w-4" /> Proses Booking</>
                                    )}
                                </button>
                            </div>
                        </div>
                    </DialogContent>
                </Dialog>

            </div>
        </>
    );
}

export default function BookedSeatsPage() {
    return (
        <SidebarProvider
            style={{
                "--sidebar-width": "calc(var(--spacing) * 72)",
                "--header-height": "calc(var(--spacing) * 12)",
            } as React.CSSProperties}
        >
            <BookedSeatsProvider>
                <AppSidebar variant="inset" />
                <SidebarInset>
                    <BookedSeatsPageInner />
                </SidebarInset>
            </BookedSeatsProvider>
        </SidebarProvider>
    );
}