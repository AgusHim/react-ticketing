import { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { TransformComponent, TransformWrapper } from 'react-zoom-pan-pinch';
import { CELL_SIZE } from '@/config/config';
import { findSeats } from '@/api/seatApi';
import { lockSeatWarKursi, getLockedSeats, confirmSeatBooking } from '@/api/war-kursi-api';
import { findBookedSeats } from '@/api/booked-seat-api';
import type { Seat } from '@/types/seat';
import type { BookedSeat } from '@/types/booked-seat';
import type { SocketMessage } from '@/types/socket-message';
import { toast } from 'sonner';
import { IconArrowLeft, IconCheck, IconLoader2, IconTicket, IconCalendarEvent, IconMapPin, IconX, IconBrandWhatsapp, IconBrandYoutube, IconInfoCircle, IconPlus, IconArmchair, IconListDetails, IconReceipt } from '@tabler/icons-react';
import { VerifyTicketDialog } from '@/components/verify-ticket-dialog';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription } from '@/components/ui/drawer';

interface LockedSeat {
    id: string;
    seat_id: string;
    admin_id: string;
    event_id: string;
}

import { useSearchParams, useParams, useNavigate } from 'react-router-dom';
import type { EventModel } from '@/api/event-api';

interface TicketSession {
    ticket_id: string;
    ticket_code: string;
    ticket_name: string;
    name: string;
    gender?: string;
    category?: string;
    token: string;
}

export default function BookingPage() {
    const [searchParams] = useSearchParams();
    const { slug } = useParams<{ slug: string }>();
    const navigate = useNavigate();

    const eventIdOrSlug = slug || searchParams.get('event_id');

    useEffect(() => {
        if (!eventIdOrSlug) {
            navigate('/');
        }
    }, [eventIdOrSlug, navigate]);

    const eventId = eventIdOrSlug || 'default';
    const [eventData, setEventData] = useState<EventModel | null>(null);
    const [seats, setSeats] = useState<Seat[]>([]);
    const [lockedSeats, setLockedSeats] = useState<LockedSeat[]>([]);
    const [bookedSeatIds, setBookedSeatIds] = useState<string[]>([]);
    const [bookedSeatsData, setBookedSeatsData] = useState<BookedSeat[]>([]);
    const [isLocking, setIsLocking] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [warStartMs, setWarStartMs] = useState<number | null>(null);
    const [msUntilWar, setMsUntilWar] = useState<number>(0);
    const ws = useRef<WebSocket | null>(null);
    const [isConnected, setIsConnected] = useState(false);

    // Multi-ticket session state
    const [ticketSessions, setTicketSessions] = useState<TicketSession[]>([]);
    const [activeTicketId, setActiveTicketId] = useState<string | null>(null);
    const [ticketCountdowns, setTicketCountdowns] = useState<Record<string, number>>({});


    // Confirm booking dialog
    const [showConfirmDialog, setShowConfirmDialog] = useState(false);
    const [showLegend, setShowLegend] = useState(false);
    const [showInvoice, setShowInvoice] = useState(false);
    const [showTutorial, setShowTutorial] = useState(false);

    useEffect(() => {
        if (!eventId) return;
        const key = `tutorial_seen_${eventId}`;
        if (!localStorage.getItem(key)) {
            setShowTutorial(true);
            localStorage.setItem(key, 'true');
        }
    }, [eventId]);

    const bookedTicketsInSession = useMemo(() => {
        return ticketSessions.filter(t => bookedSeatsData.some(b => b.ticket_id === t.ticket_id));
    }, [ticketSessions, bookedSeatsData]);
    const hasBookedSeats = bookedTicketsInSession.length > 0;

    // Read tokens from localStorage
    useEffect(() => {
        const key = `war_kursi_tokens_${eventId}`;
        const raw = localStorage.getItem(key);
        if (raw) {
            try {
                const tokens: string[] = JSON.parse(raw);
                const sessions: TicketSession[] = tokens.map(t => {
                    const payload = JSON.parse(atob(t.split('.')[1]));
                    return {
                        ticket_id: payload.ticket_id,
                        ticket_name: payload.ticket_name,
                        ticket_code: payload.ticket_code || '',
                        name: payload.name || 'Peserta', // Might not exist in old payload
                        gender: payload.gender ? payload.gender.toLowerCase() : '',
                        category: payload.category ? payload.category.toLowerCase() : '',
                        token: t
                    };
                });
                setTicketSessions(sessions);
                if (sessions.length > 0 && !activeTicketId) {
                    setActiveTicketId(sessions[0].ticket_id);
                }
            } catch (e) {
                console.error('Failed to parse tokens', e);
            }
        }
    }, [eventId, activeTicketId]);

    // Fetch event and seats
    useEffect(() => {
        import('@/api/event-api').then(({ getEvent }) => {
            getEvent(eventId).then(data => {
                setEventData(data);
                if (data.war_start_date) {
                    setWarStartMs(new Date(data.war_start_date).getTime());
                }
            }).catch(() => { });
        });

        setIsLoading(true);
        findSeats(eventId).then(data => {
            setSeats(data);
        }).catch(() => toast.error('Gagal memuat kursi')).finally(() => setIsLoading(false));
        getLockedSeats(eventId).then((data: LockedSeat[]) => {
            if (data) setLockedSeats(data);
        }).catch(() => { });
        findBookedSeats(eventId).then(data => {
            if (data) {
                setBookedSeatsData(data);
                setBookedSeatIds(data.map(d => d.seat_id).filter((id): id is string => id !== undefined));
            }
        }).catch(() => { });
    }, [eventId]);

    // Calculate bounding box of all seats to auto-fit viewport
    const layoutBounds = useMemo(() => {
        if (seats.length === 0) return { minX: 0, minY: 0, maxX: 1000, maxY: 1000, width: 1000, height: 1000 };

        let minX = Infinity;
        let minY = Infinity;
        let maxX = -Infinity;
        let maxY = -Infinity;

        seats.forEach(seat => {
            let x = seat.x ?? 0;
            let y = seat.y ?? 0;

            if (seat.x === undefined || seat.y === undefined) {
                if (seat.position && seat.position.includes('-')) {
                    const [r, c] = seat.position.split('-');
                    x = parseInt(c) * CELL_SIZE;
                    y = parseInt(r) * CELL_SIZE;
                }
            }

            const w = seat.width || CELL_SIZE - 2;
            const h = seat.height || CELL_SIZE - 2;

            minX = Math.min(minX, x);
            minY = Math.min(minY, y);
            maxX = Math.max(maxX, x + w);
            maxY = Math.max(maxY, y + h);
        });

        // Add 100px padding around the entire layout
        minX -= 100;
        minY -= 100;
        maxX += 100;
        maxY += 100;

        return { minX, minY, maxX, maxY, width: maxX - minX, height: maxY - minY };
    }, [seats]);

    const initialScale = useMemo(() => {
        if (typeof window === 'undefined' || layoutBounds.width === 0) return 0.5;
        // Calculate scale to fit within viewport
        const scaleX = window.innerWidth / layoutBounds.width;
        const scaleY = (window.innerHeight - 100) / layoutBounds.height;
        let scale = Math.min(scaleX, scaleY) * 0.95; // 95% to leave some margin
        return Math.max(0.1, Math.min(scale, 1.5)); // clamp between 0.1 and 1.5
    }, [layoutBounds]);

    // War start countdown timer
    useEffect(() => {
        if (!warStartMs) return;
        const calcMs = () => Math.max(0, warStartMs - Date.now());
        setMsUntilWar(calcMs());

        const timer = setInterval(() => {
            const left = calcMs();
            setMsUntilWar(left);
            if (left <= 0) clearInterval(timer);
        }, 1000);

        return () => clearInterval(timer);
    }, [warStartMs]);

    const ticketId = activeTicketId;
    const myLockedSeatId = useMemo(() => {
        if (!activeTicketId) return null;
        const locked = lockedSeats.find(s => s.admin_id === activeTicketId);
        return locked ? locked.seat_id : null;
    }, [activeTicketId, lockedSeats]);

    const handleMessage = useCallback((event: MessageEvent) => {
        try {
            const data: SocketMessage = JSON.parse(event.data);
            if (data.type === 'seat_locked') {
                const msg = data.message as { seat_id: string; show_id: string; admin_id: string };
                setLockedSeats(prev => {
                    const filtered = prev.filter(s => s.seat_id !== msg.seat_id && s.admin_id !== msg.admin_id);
                    return [...filtered, { id: `${msg.show_id}:${msg.seat_id}`, seat_id: msg.seat_id, admin_id: msg.admin_id, event_id: msg.show_id }];
                });
            } else if (data.type === 'seat_unlocked') {
                const msg = data.message as { seat_id: string };
                setLockedSeats(prev => prev.filter(s => s.seat_id !== msg.seat_id));
            } else if (data.type === 'booked_seat') {
                const msg = data.message as BookedSeat;
                setBookedSeatIds(prev => msg.seat_id ? [...prev, msg.seat_id] : prev);
                setBookedSeatsData(prev => [...prev, msg]);
                setLockedSeats(prev => prev.filter(s => s.seat_id !== msg.seat_id));
            } else if (data.type === 'booked_seat_deleted') {
                const msg = data.message as { seat_id: string };
                setBookedSeatIds(prev => prev.filter(id => id !== msg.seat_id));
                setBookedSeatsData(prev => prev.filter(b => b.seat_id !== msg.seat_id));
            }
        } catch (err) {
            console.error('Error parsing WebSocket:', err);
        }
    }, []);

    useEffect(() => {
        if (ws.current) return;
        const baseUrl = import.meta.env.VITE_WS_BASE_URL || 'ws://127.0.0.1:3000';
        const socket = new WebSocket(`${baseUrl}/ws?user_id=${activeTicketId || 'guest'}`);
        ws.current = socket;

        socket.onopen = () => setIsConnected(true);
        socket.onmessage = handleMessage;
        socket.onclose = () => setIsConnected(false);
        socket.onerror = () => setIsConnected(false);

        return () => { socket?.close(); ws.current = null; };
    }, [activeTicketId, handleMessage]);

    const lockedSeatsRef = useRef(lockedSeats);
    useEffect(() => {
        lockedSeatsRef.current = lockedSeats;
    }, [lockedSeats]);

    useEffect(() => {
        const timer = setInterval(() => {
            setTicketCountdowns(prev => {
                let changed = false;
                const next = { ...prev };
                for (const [id, count] of Object.entries(next)) {
                    if (count > 0) {
                        next[id] = count - 1;
                        changed = true;
                        if (next[id] === 0) {
                            const locked = lockedSeatsRef.current.find(s => s.admin_id === id);
                            if (locked && locked.seat_id) {
                                lockSeatWarKursi(eventId, locked.seat_id, id, 'unlock').catch(() => { });
                            }
                        }
                    }
                }
                return changed ? next : prev;
            });
        }, 1000);
        return () => clearInterval(timer);
    }, [eventId]);

    const handleAddTickets = (newTickets: any[]) => {
        const key = `war_kursi_tokens_${eventId}`;
        const newTokens = newTickets.map(t => t.token);
        const existingTokens = ticketSessions.map(t => t.token);
        const combinedTokens = Array.from(new Set([...existingTokens, ...newTokens]));
        localStorage.setItem(key, JSON.stringify(combinedTokens));
        const newSessions = [...ticketSessions];
        for (const nt of newTickets) {
            if (!newSessions.some(ts => ts.ticket_id === nt.ticket_id)) {
                newSessions.push(nt);
            }
        }
        setTicketSessions(newSessions);
        if (!activeTicketId && newSessions.length > 0) {
            setActiveTicketId(newSessions[0].ticket_id);
        }
    };

    const handleSeatClick = async (seat: Seat) => {
        if (!ticketId) {
            toast.error('Pilih tiket terlebih dahulu di sidebar, atau verifikasi tiket jika belum.');
            return;
        }

        const hasPermanentlyBooked = bookedSeatsData.some(b => b.ticket_id === ticketId);
        if (hasPermanentlyBooked) {
            toast.error('Tiket ini sudah memiliki kursi yang dipesan secara permanen.');
            return;
        }

        const activeSession = ticketSessions.find(t => t.ticket_id === ticketId);
        if (activeSession && seat.gender && seat.gender !== 'both') {
            if (!activeSession.gender) {
                toast.error(`Maaf, kursi ini khusus ${seat.gender.toLowerCase() === 'male' ? 'pria' : 'wanita'}, tiket Anda tidak memiliki informasi gender.`);
                return;
            }
            if (activeSession.gender.toLowerCase() !== seat.gender.toLowerCase()) {
                toast.error(`Maaf, kursi ini khusus ${seat.gender.toLowerCase() === 'male' ? 'pria' : 'wanita'}.`);
                return;
            }
        }

        if (activeSession && activeSession.category && seat.category) {
            if (activeSession.category.toLowerCase() !== seat.category.toLowerCase() && seat.category !== 'STAGE') {
                toast.error(`Maaf, kursi ini khusus kategori ${seat.category.toUpperCase()}, sedangkan tiket Anda kategori ${activeSession.category.toUpperCase()}.`);
                return;
            }
        }

        if (isLocking) return;
        if (bookedSeatIds.includes(seat.id!)) {
            toast.error('Kursi ini sudah dipesan');
            return;
        }
        if (myLockedSeatId && myLockedSeatId !== seat.id) {
            toast.error('Tiket ini sudah mengunci kursi lain! Selesaikan pesanan atau batalkan terlebih dahulu.');
            return;
        }

        setIsLocking(true);
        try {
            const res = await lockSeatWarKursi(eventId, seat.id!, ticketId);
            if (res.status === 'locked') {
                // Optimistic UI update
                setLockedSeats(prev => {
                    const filtered = prev.filter(s => s.seat_id !== seat.id! && s.admin_id !== ticketId);
                    return [...filtered, { id: `${eventId}:${seat.id}`, seat_id: seat.id!, admin_id: ticketId, event_id: eventId }];
                });
                setTicketCountdowns(prev => ({ ...prev, [ticketId]: 300 }));
                toast.success(`Kursi ${seat.name || seat.position} terkunci! Kamu punya 5 menit.`);
            } else if (res.status === 'unlocked') {
                setLockedSeats(prev => prev.filter(s => s.seat_id !== seat.id!));
                setTicketCountdowns(prev => ({ ...prev, [ticketId]: 0 }));
                toast.info('Kursi dibatalkan.');
            } else if (res.status === 'taken') {
                toast.error(res?.data?.message || 'Gagal, Anda mungkin sudah mengunci kursi lain atau kursi ini sudah diambil!');
            }
        } catch {
            toast.error('Gagal memilih kursi');
        } finally {
            setIsLocking(false);
        }
    };

    const formatTime = (seconds: number) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m}:${s.toString().padStart(2, '0')}`;
    };

    const getSeatStatus = (seatId: string) => {
        if (myLockedSeatId === seatId) return 'mine';

        const lockedBySession = lockedSeats.some(ls => ls.seat_id === seatId && ticketSessions.some(t => t.ticket_id === ls.admin_id));
        if (lockedBySession) return 'session_locked';

        const bookedBySession = bookedSeatsData.some(b => b.seat_id === seatId && ticketSessions.some(t => t.ticket_id === b.ticket_id));
        if (bookedBySession) return 'session_booked';

        if (bookedSeatIds.includes(seatId)) return 'booked';
        if (lockedSeats.find(s => s.seat_id === seatId)) return 'locked';
        return 'available';
    };

    const getSeatColor = (status: string, originalColor: string) => {
        switch (status) {
            case 'booked': return '#6b7280'; // gray
            case 'session_booked': return '#F54927'; // red-orange
            case 'mine': return '#16a34a'; // green
            case 'session_locked': return '#16a34a'; // green
            case 'locked': return '#eab308'; // yellow
            default: return originalColor;
        }
    };

    // Gather ALL locked ticket-seat pairs for bulk confirm
    const allLockedPairs = useMemo(() => {
        return ticketSessions
            .map(session => {
                const locked = lockedSeats.find(ls => ls.admin_id === session.ticket_id);
                if (!locked) return null;
                // skip if already booked
                const alreadyBooked = bookedSeatsData.some(b => b.ticket_id === session.ticket_id);
                if (alreadyBooked) return null;
                const seat = seats.find(s => s.id === locked.seat_id);
                return { session, seatId: locked.seat_id, seat };
            })
            .filter((p): p is { session: TicketSession; seatId: string; seat: Seat | undefined } => p !== null);
    }, [ticketSessions, lockedSeats, bookedSeatsData, seats]);

    const handleConfirmBooking = async () => {
        if (allLockedPairs.length === 0) return;
        setIsLocking(true);
        let successCount = 0;
        let failCount = 0;
        for (const pair of allLockedPairs) {
            try {
                await confirmSeatBooking(eventId, pair.seatId, pair.session.ticket_id, pair.session.name);
                successCount++;
                // Optimistic UI update per pair
                setBookedSeatIds(prev => [...prev, pair.seatId]);
                setBookedSeatsData(prev => [...prev, { seat_id: pair.seatId, ticket_id: pair.session.ticket_id, event_id: eventId, name: pair.session.name } as BookedSeat]);
                setLockedSeats(prev => prev.filter(s => s.seat_id !== pair.seatId));
                setTicketCountdowns(prev => ({ ...prev, [pair.session.ticket_id]: 0 }));
            } catch (err: any) {
                failCount++;
                toast.error(`Gagal konfirmasi ${pair.session.ticket_code}: ${err?.response?.data?.message || 'Error'}`);
            }
        }
        if (successCount > 0) {
            toast.success(`${successCount} kursi berhasil dikonfirmasi!`);
        }
        setShowConfirmDialog(false);
        setIsLocking(false);
    };

    // Highest countdown across all locked tickets
    const maxLockedCountdown = useMemo(() => {
        let max = 0;
        for (const pair of allLockedPairs) {
            const cd = ticketCountdowns[pair.session.ticket_id] || 0;
            if (cd > max) max = cd;
        }
        return max;
    }, [allLockedPairs, ticketCountdowns]);

    const showCountdownBar = allLockedPairs.length > 0 && maxLockedCountdown > 0;

    const tutorialDialogContent = (
        <>
            <DialogHeader>
                <DialogTitle className="text-white text-base">Tutorial Booking Seat</DialogTitle>
                <DialogDescription className="text-neutral-500 text-sm">
                    Tonton video panduan atau ikuti langkah-langkah di bawah ini.
                </DialogDescription>
            </DialogHeader>
            <div className="aspect-video mt-3 rounded-xl overflow-hidden bg-black shrink-0">
                <iframe
                    width="100%"
                    height="100%"
                    src="https://www.youtube.com/embed/7otiEz7wSkg"
                    title="YouTube video player"
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    allowFullScreen
                ></iframe>
            </div>
            <div className="mt-4 space-y-3 pb-2">
                <h3 className="text-sm font-semibold text-white">Langkah-langkah:</h3>
                <ol className="list-decimal list-inside text-xs text-neutral-400 space-y-2">
                    <li>Siapkan file e-ticket (PDF) yang sudah Anda download dari <a href="https://www.darisini.com/orders" target="_blank" rel="noopener noreferrer" className="text-blue-500 underline">darisini.com</a></li>
                    <li>Klik tombol <strong className="text-neutral-200">Tambah Tiket</strong> di bagian bawah layar.</li>
                    <li>Upload file PDF tiket Anda ke dalam sesi.</li>
                    <li>Pilih tiket Anda, lalu klik kursi kosong (bewarna terang) di peta.</li>
                    <li>Jika sudah selesai memilih kursi, klik <strong className="text-emerald-400">Konfirmasi</strong>.</li>
                </ol>
            </div>
        </>
    );

    // ─── Sidebar Content (shared between desktop sidebar and mobile bottom sheet) ───
    const sidebarContent = (
        <>
            {/* Event Header with Image */}
            <div className="relative h-36 md:h-52 shrink-0 overflow-hidden">
                {eventData?.image_url ? (
                    <img src={eventData.image_url} alt={eventData?.name} className="w-full h-full object-cover" />
                ) : (
                    <div className="w-full h-full flex items-center justify-center" style={{ background: `linear-gradient(135deg, ${eventData?.color || '#e50914'}33, #0a0a0a)` }}>
                        <IconTicket className="h-12 w-12 text-white/20" />
                    </div>
                )}
                {/* Gradient overlay for text readability */}
                <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-[#0a0a0a]/60 to-transparent" />

                {/* Back button - desktop only (mobile has its own) */}
                <a href="/" className="hidden md:flex absolute top-4 left-4 items-center justify-center w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-md text-white transition-all duration-200 active:scale-95">
                    <IconArrowLeft className="h-4 w-4" />
                </a>

                {/* Live badge */}
                <div className="absolute top-4 right-4 flex items-center gap-1.5 bg-white/10 backdrop-blur-md px-3 py-1.5 rounded-full">
                    <div className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                    </div>
                    <span className="text-[10px] font-semibold text-white tracking-wide uppercase">Live</span>
                </div>

                {/* Event title overlaid on image */}
                <div className="absolute bottom-4 left-4 right-4">
                    <h2 className="text-lg md:text-xl font-bold text-white leading-snug line-clamp-2">{eventData?.name || 'Memuat Event...'}</h2>
                </div>
            </div>

            {/* Event Details */}
            <div className="px-4 md:px-5 pt-3 pb-4 flex-1 flex flex-col overflow-y-auto" style={{ scrollbarWidth: 'thin', scrollbarColor: '#333 transparent' }}>
                {/* Date & Location - compact row on mobile */}
                <div className="flex flex-col gap-2.5 mb-4">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center shrink-0">
                            <IconCalendarEvent className="h-4 w-4 text-neutral-400" />
                        </div>
                        <div className="min-w-0">
                            <p className="text-[11px] text-neutral-500 font-medium uppercase tracking-wider">Tanggal</p>
                            <p className="text-[13px] font-medium text-neutral-200 truncate">
                                {eventData ? new Date(eventData.date).toLocaleDateString('id-ID', {
                                    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
                                }) : '-'}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center shrink-0">
                            <IconMapPin className="h-4 w-4 text-neutral-400" />
                        </div>
                        <div className="min-w-0">
                            <p className="text-[11px] text-neutral-500 font-medium uppercase tracking-wider">Lokasi</p>
                            <p className="text-[13px] font-medium text-neutral-200 truncate">{eventData?.location || '-'}</p>
                        </div>
                    </div>
                </div>

                {/* Quick Actions - horizontal on mobile */}
                <div className="grid grid-cols-2 gap-2 mb-4">
                    <a href="https://wa.me/6288227301613" target="_blank" rel="noopener noreferrer"
                        className="flex items-center justify-center gap-2 bg-[#25D366]/10 hover:bg-[#25D366]/20 text-[#25D366] py-2.5 rounded-xl transition-all duration-200 font-medium text-xs active:scale-[0.97]">
                        <IconBrandWhatsapp className="h-4 w-4" />
                        <span>Support</span>
                    </a>

                    <button onClick={() => setShowTutorial(true)} className="flex items-center justify-center gap-2 bg-[#FF0000]/10 hover:bg-[#FF0000]/20 text-[#FF4444] py-2.5 rounded-xl transition-all duration-200 font-medium text-xs w-full active:scale-[0.97]">
                        <IconBrandYoutube className="h-4 w-4" />
                        <span>Tutorial</span>
                    </button>
                </div>

                {hasBookedSeats && (
                    <button data-testid="desktop-invoice-button" onClick={() => setShowInvoice(true)} className="mb-4 flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white py-2.5 rounded-xl transition-all font-semibold text-xs w-full shadow-lg shadow-emerald-500/20 active:scale-[0.97]">
                        <IconReceipt className="h-4 w-4" />
                        <span>Lihat Invoice</span>
                    </button>
                )}

                {/* Ticket Sessions */}
                <div className="border-t border-white/5 pt-4">
                    <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                            <p className="text-xs text-neutral-400 font-semibold tracking-wider uppercase">Tiket</p>
                            <span className="text-[10px] bg-white/10 text-neutral-300 px-1.5 py-0.5 rounded-md font-mono">{ticketSessions.length}</span>
                        </div>
                        <VerifyTicketDialog eventId={eventId} onVerified={handleAddTickets} />
                    </div>
                    <div className="space-y-1.5 max-h-[35vh] md:max-h-[40vh] overflow-y-auto pr-0.5" style={{ scrollbarWidth: 'thin', scrollbarColor: '#333 transparent' }}>
                        {ticketSessions.map((t) => {
                            const bookedSeatItem = bookedSeatsData.find(b => b.ticket_id === t.ticket_id);
                            const lockedSeatItem = lockedSeats.find(ls => ls.admin_id === t.ticket_id);
                            const isBooked = !!bookedSeatItem;
                            const isLocked = !!lockedSeatItem && !isBooked;
                            const isSelected = activeTicketId === t.ticket_id;

                            const seatName = bookedSeatItem?.seat?.name ||
                                (bookedSeatItem ? seats.find(s => s.id === bookedSeatItem.seat_id)?.name : null) ||
                                (lockedSeatItem ? seats.find(s => s.id === lockedSeatItem.seat_id)?.name : null);

                            return (
                                <div key={t.ticket_id}
                                    data-testid={`ticket-session-${t.ticket_id}`}
                                    onClick={() => setActiveTicketId(t.ticket_id)}
                                    className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all duration-200 active:scale-[0.98] ${isSelected
                                        ? 'bg-emerald-500/10 border-emerald-500/30 shadow-[0_0_15px_rgba(16,185,129,0.1)]'
                                        : 'bg-white/[0.05] border-white/[0.1] hover:bg-white/[0.08]'
                                        }`}
                                >
                                    <div className="flex-1 min-w-0 flex flex-col justify-center">
                                        <p className={`text-sm font-semibold truncate ${isSelected ? 'text-emerald-400' : 'text-neutral-200'}`}>{t.ticket_code || t.ticket_id}</p>
                                        <div className="flex items-center gap-1.5 mt-0.5">
                                            <span className="text-[10px] text-neutral-500 truncate max-w-[100px]">{t.name}</span>
                                            {t.gender && (
                                                <span className={`text-[9px] px-1.5 py-0.5 rounded uppercase font-bold ${t.gender.toLowerCase() === 'male' ? 'bg-blue-500/20 text-blue-400' : 'bg-pink-500/20 text-pink-400'}`}>
                                                    {t.gender === 'male' ? 'L' : 'P'}
                                                </span>
                                            )}
                                            {t.category && (
                                                <span className="text-[9px] px-1.5 py-0.5 rounded uppercase font-bold bg-amber-500/20 text-amber-400">
                                                    {t.category}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-sm font-bold shrink-0 ${isBooked || isLocked ? 'bg-emerald-500 shadow-md shadow-emerald-500/20 text-white' : 'bg-white/10 text-neutral-400 border border-dashed border-white/20'}`}>
                                        {isBooked || isLocked ? seatName : <IconArmchair className="h-5 w-5" />}
                                    </div>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            const key = `war_kursi_tokens_${eventId}`;

                                            // Unlock seat if it was locked
                                            const lockedSeat = lockedSeats.find(s => s.admin_id === t.ticket_id);
                                            if (lockedSeat) {
                                                lockSeatWarKursi(eventId, lockedSeat.seat_id!, t.ticket_id).catch(() => { });
                                                setLockedSeats(prev => prev.filter(s => s.seat_id !== lockedSeat.seat_id));
                                                setTicketCountdowns(prev => ({ ...prev, [t.ticket_id]: 0 }));
                                            }

                                            const newSessions = ticketSessions.filter(ts => ts.ticket_id !== t.ticket_id);
                                            setTicketSessions(newSessions);
                                            localStorage.setItem(key, JSON.stringify(newSessions.map(ts => ts.token)));
                                            if (isSelected) {
                                                setActiveTicketId(newSessions.length > 0 ? newSessions[0].ticket_id : null);
                                            }
                                        }}
                                        className="w-8 h-8 flex items-center justify-center hover:bg-red-500/20 rounded-lg text-neutral-500 hover:text-red-400 transition-colors active:scale-90 ml-1"
                                        title="Hapus Tiket dari Sesi"
                                    >
                                        <IconX className="h-4 w-4" />
                                    </button>
                                </div>
                            );
                        })}
                        {ticketSessions.length === 0 && (
                            <div className="text-center py-8 rounded-xl border border-dashed border-white/[0.07] bg-white/[0.02]">
                                <IconTicket className="h-8 w-8 text-neutral-700 mx-auto mb-2" />
                                <p className="text-xs text-neutral-600">Belum ada tiket di sesi ini</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </>
    );

    return (
        <div className="h-[100dvh] flex flex-col md:flex-row overflow-hidden" style={{ background: '#0a0a0a' }}>

            {/* ═══════════════ DESKTOP SIDEBAR ═══════════════ */}
            <div className="hidden md:flex w-80 lg:w-[22rem] flex-col shrink-0 z-10 h-screen border-r border-white/[0.06]"
                style={{ background: 'linear-gradient(180deg, #0f0f0f 0%, #0a0a0a 100%)' }}>
                {sidebarContent}
            </div>

            {/* ═══════════════ MAIN SEAT MAP AREA ═══════════════ */}
            <div className="flex-1 flex flex-col overflow-hidden relative" style={{ background: '#0a0a0a' }}>

                {/* ── Mobile Top Bar ── */}
                <div className="flex md:hidden items-center justify-between px-4 py-3 shrink-0 z-20 border-b border-white/[0.06]"
                    style={{ background: '#0f0f0f' }}>
                    <div className="flex items-center gap-3">
                        <a href="/" className="w-9 h-9 rounded-xl bg-white/[0.06] hover:bg-white/10 flex items-center justify-center text-white transition-colors active:scale-95">
                            <IconArrowLeft className="h-4 w-4" />
                        </a>
                        <div className="min-w-0">
                            <h1 className="text-sm font-semibold text-white truncate max-w-[200px]">{eventData?.name || 'Memuat...'}</h1>
                            <div className="flex items-center gap-1.5">
                                <div className="relative flex h-1.5 w-1.5">
                                    {isConnected && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>}
                                    <span className={`relative inline-flex rounded-full h-1.5 w-1.5 ${isConnected ? 'bg-emerald-400' : 'bg-red-500'}`}></span>
                                </div>
                                <span className={`text-[10px] font-medium ${isConnected ? 'text-emerald-400' : 'text-red-400'}`}>
                                    {isConnected ? 'Live' : 'Offline'}
                                </span>
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-1.5">
                        {/* Support WhatsApp */}
                        <a href="https://wa.me/6288227301613" target="_blank" rel="noopener noreferrer" className="w-9 h-9 rounded-xl bg-[#25D366]/10 hover:bg-[#25D366]/20 flex items-center justify-center text-[#25D366] transition-colors active:scale-95">
                            <IconBrandWhatsapp className="h-4 w-4" />
                        </a>

                        {/* Tutorial / Info */}
                        <button onClick={() => setShowTutorial(true)} className="w-9 h-9 rounded-xl bg-[#FF0000]/10 hover:bg-[#FF0000]/20 flex items-center justify-center text-[#FF4444] transition-colors active:scale-95">
                            <IconInfoCircle className="h-4 w-4" />
                        </button>

                        {/* Legend */}
                        <button
                            onClick={() => setShowLegend(!showLegend)}
                            className="w-9 h-9 rounded-xl bg-white/[0.06] hover:bg-white/10 flex items-center justify-center text-neutral-400 transition-colors active:scale-95"
                        >
                            <IconListDetails className="h-4 w-4" />
                        </button>
                    </div>
                </div>

                {/* ── Mobile Legend Dropdown ── */}
                {showLegend && (
                    <div className="flex md:hidden flex-wrap gap-x-4 gap-y-1.5 px-4 py-2.5 border-b border-white/[0.06] z-20 animate-in slide-in-from-top-2 duration-200"
                        style={{ background: '#0f0f0f' }}>
                        {[
                            { color: 'bg-blue-500', label: 'Tersedia', count: seats.filter(s => getSeatStatus(s.id!) === 'available' && s.category !== 'STAGE').length },
                            { color: 'bg-emerald-500', label: 'Pilihan', count: myLockedSeatId ? 1 : 0 },
                            { color: 'bg-amber-500', label: 'Dikunci', count: lockedSeats.length },
                            { color: 'bg-neutral-500', label: 'Terpilih', count: bookedSeatIds.length },
                        ].map((item) => (
                            <div key={item.label} className="flex items-center gap-1.5">
                                <div className={`w-2 h-2 rounded-full ${item.color}`} />
                                <span className="text-[10px] text-neutral-400">{item.label}</span>
                                <span className="text-[10px] text-neutral-600 font-mono">{item.count}</span>
                            </div>
                        ))}
                    </div>
                )}



                {/* ── Desktop Connection Status ── */}
                <div className="hidden md:flex items-center justify-end px-4 py-2 shrink-0 z-20 border-b border-white/[0.04]" style={{ background: '#0d0d0d' }}>
                    <div className="flex items-center gap-2 bg-white/[0.04] px-3 py-1.5 rounded-full">
                        <div className="relative flex h-2 w-2">
                            {isConnected && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>}
                            <span className={`relative inline-flex rounded-full h-2 w-2 ${isConnected ? 'bg-emerald-400' : 'bg-red-500'}`}></span>
                        </div>
                        <span className={`font-medium text-[11px] ${isConnected ? 'text-emerald-400' : 'text-red-400'}`}>
                            {isConnected ? 'Terhubung' : 'Terputus'}
                        </span>
                    </div>
                </div>

                {/* ── Desktop Legend ── */}
                <div className="hidden md:block absolute bottom-6 right-6 z-40">
                    <div className="bg-black/60 backdrop-blur-xl p-4 rounded-2xl border border-white/[0.08] w-44">
                        <h3 className="text-[10px] font-semibold text-neutral-500 uppercase tracking-wider mb-3">Keterangan</h3>
                        <div className="space-y-2.5 text-[11px]">
                            {[
                                { color: 'bg-blue-500', glow: 'shadow-[0_0_6px_rgba(59,130,246,0.4)]', label: 'Tersedia', count: seats.filter(s => getSeatStatus(s.id!) === 'available' && s.category !== 'STAGE').length, countColor: 'text-neutral-400' },
                                { color: 'bg-emerald-500', glow: 'shadow-[0_0_6px_rgba(16,185,129,0.4)]', label: 'Pilihan Anda', count: myLockedSeatId ? 1 : 0, countColor: 'text-emerald-400' },
                                { color: 'bg-amber-500', glow: 'shadow-[0_0_6px_rgba(245,158,11,0.4)]', label: 'Dikunci', count: lockedSeats.length, countColor: 'text-amber-400' },
                                { color: 'bg-neutral-500', glow: 'shadow-[0_0_6px_rgba(115,115,115,0.4)]', label: 'Terpilih', count: bookedSeatIds.length, countColor: 'text-neutral-400' },
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

                {/* ── Countdown Bar (desktop) ── */}
                {showCountdownBar && (
                    <div className="hidden md:flex px-4 py-2.5 items-center justify-between z-20 shrink-0 border-b border-emerald-500/20"
                        style={{ background: 'linear-gradient(90deg, rgba(16,185,129,0.08), rgba(16,185,129,0.03))' }}>
                        <div className="flex items-center gap-3">
                            <span className="text-emerald-400 text-sm font-medium">
                                ⏱ <strong className="font-mono">{formatTime(maxLockedCountdown)}</strong>
                            </span>
                            <span className="text-[11px] text-neutral-400">
                                <strong className="text-white">{allLockedPairs.length}</strong> kursi terkunci
                            </span>
                        </div>
                        <button
                            className="flex items-center gap-1.5 rounded-lg bg-emerald-500 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-600 transition-all active:scale-95 disabled:opacity-50"
                            onClick={() => setShowConfirmDialog(true)}
                            disabled={isLocking}
                        >
                            <IconCheck className="h-3.5 w-3.5" />
                            Konfirmasi {allLockedPairs.length > 1 ? `(${allLockedPairs.length})` : ''}
                        </button>
                    </div>
                )}

                {/* ═══════════════ CONFIRM BOOKING — Desktop Dialog ═══════════════ */}
                <Dialog open={showConfirmDialog && typeof window !== 'undefined' && window.innerWidth >= 768} onOpenChange={setShowConfirmDialog}>
                    <DialogContent className="sm:max-w-md bg-[#141414] border-neutral-800 text-neutral-200 mx-4 rounded-2xl p-0 overflow-hidden">
                        <div className="px-5 pt-5 pb-3">
                            <DialogHeader>
                                <DialogTitle className="text-white text-base">Konfirmasi Pemesanan</DialogTitle>
                                <DialogDescription className="text-neutral-500 text-sm">
                                    {allLockedPairs.length > 1
                                        ? `${allLockedPairs.length} kursi akan dikonfirmasi sekaligus.`
                                        : 'Pastikan detail berikut sudah benar sebelum mengkonfirmasi.'
                                    }
                                </DialogDescription>
                            </DialogHeader>
                        </div>
                        <div className="px-5 pb-5 space-y-3 max-h-[60vh] overflow-y-auto" style={{ scrollbarWidth: 'thin', scrollbarColor: '#333 transparent' }}>
                            {allLockedPairs.map((pair, idx) => {
                                const cd = ticketCountdowns[pair.session.ticket_id] || 0;
                                return (
                                    <div key={pair.session.ticket_id} className="rounded-xl p-4" style={{ background: '#1a1a1a', border: '1px solid rgba(255,255,255,0.06)' }}>
                                        {allLockedPairs.length > 1 && (
                                            <div className="flex items-center gap-2 mb-3">
                                                <span className="text-[10px] font-bold text-neutral-500 bg-white/[0.06] px-2 py-0.5 rounded-md">#{idx + 1}</span>
                                                {cd > 0 && <span className="text-[10px] font-mono text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded">⏱ {formatTime(cd)}</span>}
                                            </div>
                                        )}
                                        <div className="flex items-center gap-3 mb-3">
                                            <div className="w-12 h-12 rounded-xl bg-emerald-500/15 flex items-center justify-center text-emerald-400 text-base font-bold shrink-0 border border-emerald-500/20">{pair.seat?.name || '-'}</div>
                                            <div className="min-w-0 flex-1">
                                                <p className="text-[14px] font-semibold text-white">{pair.seat?.name || 'Tidak diketahui'}</p>
                                                <p className="text-[11px] text-neutral-500 mt-0.5">{pair.session.ticket_code} · {pair.session.name}</p>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                            <div className="flex gap-2 pt-2 sticky bottom-0" style={{ background: '#141414' }}>
                                <button onClick={() => setShowConfirmDialog(false)} className="flex-1 py-2.5 rounded-xl text-sm font-medium text-neutral-400 hover:text-white bg-white/[0.04] hover:bg-white/[0.08] transition-all active:scale-[0.97] border border-white/[0.06]">Batal</button>
                                <button data-testid="confirm-booking-submit" onClick={handleConfirmBooking} disabled={isLocking || allLockedPairs.length === 0} className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-500 transition-all active:scale-[0.97] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
                                    {isLocking ? (<><IconLoader2 className="h-4 w-4 animate-spin" /> Memproses...</>) : (<><IconCheck className="h-4 w-4" /> Konfirmasi {allLockedPairs.length > 1 ? `(${allLockedPairs.length})` : 'Kursi'}</>)}
                                </button>
                            </div>
                        </div>
                    </DialogContent>
                </Dialog>

                {/* ═══════════════ TUTORIAL DIALOG ═══════════════ */}
                <Dialog open={showTutorial} onOpenChange={setShowTutorial}>
                    <DialogContent className="w-[calc(100%-2rem)] sm:w-full sm:max-w-3xl bg-[#141414] border-neutral-800 text-neutral-200 rounded-2xl max-h-[85vh] overflow-y-auto">
                        {tutorialDialogContent}
                    </DialogContent>
                </Dialog>

                {/* ═══════════════ E-INVOICE DIALOG ═══════════════ */}
                <Dialog open={showInvoice} onOpenChange={setShowInvoice}>
                    <DialogContent className="w-[calc(100%-2rem)] sm:w-full sm:max-w-md bg-[#141414] border-neutral-800 text-neutral-200 rounded-2xl max-h-[85vh] overflow-y-auto">
                        <DialogHeader>
                            <DialogTitle className="text-white text-base">Invoice Booking</DialogTitle>
                            <DialogDescription className="text-neutral-500 text-sm">
                                Tunjukkan halaman ini kepada panitia saat penukaran goodiebag dan gelang kursi.
                            </DialogDescription>
                        </DialogHeader>

                        <div className="mt-2 p-4 rounded-xl bg-white/[0.03] border border-white/[0.06] space-y-4">
                            {/* Event Info */}
                            <div className="text-center pb-4 border-b border-white/[0.08]">
                                <h3 className="text-lg font-bold text-emerald-400">{eventData?.name}</h3>
                                <p className="text-xs text-neutral-400 mt-1">
                                    {eventData ? new Date(eventData.date).toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) : '-'}
                                </p>
                                <p className="text-xs text-neutral-400 mt-1">{eventData?.location || '-'}</p>
                            </div>

                            {/* Tickets List */}
                            <div className="space-y-3">
                                {bookedTicketsInSession.map((t) => {
                                    const bookedSeatItem = bookedSeatsData.find(b => b.ticket_id === t.ticket_id);
                                    const seatName = bookedSeatItem?.seat?.name || seats.find(s => s.id === bookedSeatItem?.seat_id)?.name;
                                    return (
                                        <div key={t.ticket_id} className="flex flex-col gap-1.5 p-3 rounded-lg bg-white/[0.02] border border-white/[0.05]">
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <p className="text-sm font-semibold text-white">{t.name}</p>
                                                    <p className="text-[10px] text-neutral-500 font-mono mt-0.5">{t.ticket_code || t.ticket_id}</p>
                                                </div>
                                                <div className="bg-emerald-500/20 text-emerald-400 px-2 py-1 rounded-md text-xs font-bold border border-emerald-500/30">
                                                    Kursi: {seatName || '-'}
                                                </div>
                                            </div>
                                            <div className="flex gap-2 mt-1">
                                                {t.gender && <span className="text-[9px] bg-white/10 px-1.5 py-0.5 rounded text-neutral-300 uppercase">{t.gender === 'male' ? 'Laki-laki' : 'Perempuan'}</span>}
                                                {t.category && <span className="text-[9px] bg-white/10 px-1.5 py-0.5 rounded text-neutral-300 uppercase">{t.category}</span>}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            <div className="pt-2 text-center">
                                <p className="text-[10px] text-neutral-500 italic">Terima kasih telah melakukan pemesanan kursi.</p>
                            </div>
                        </div>
                    </DialogContent>
                </Dialog>

                {/* ═══════════════ CONFIRM BOOKING — Mobile Bottom Drawer ═══════════════ */}
                <Drawer open={showConfirmDialog && typeof window !== 'undefined' && window.innerWidth < 768} onOpenChange={setShowConfirmDialog}>
                    <DrawerContent className="bg-[#141414] border-t-white/[0.08] text-white max-h-[85vh]">
                        <div className="mx-auto w-full max-w-lg">
                            <DrawerHeader className="pb-2">
                                <DrawerTitle className="text-white font-bold text-lg">Konfirmasi Pemesanan</DrawerTitle>
                                <DrawerDescription className="text-neutral-400 text-sm">
                                    {allLockedPairs.length > 1
                                        ? `${allLockedPairs.length} kursi akan dikonfirmasi.`
                                        : 'Pastikan detail berikut sudah benar.'
                                    }
                                </DrawerDescription>
                            </DrawerHeader>

                            <div className="px-4 pb-4 space-y-2.5 overflow-y-auto max-h-[50vh]" style={{ scrollbarWidth: 'thin', scrollbarColor: '#333 transparent' }}>
                                {allLockedPairs.map((pair, idx) => {
                                    const cd = ticketCountdowns[pair.session.ticket_id] || 0;
                                    return (
                                        <div key={pair.session.ticket_id} className="flex items-center gap-3 p-3 rounded-xl" style={{ background: '#1a1a1a', border: '1px solid rgba(255,255,255,0.06)' }}>
                                            {allLockedPairs.length > 1 && (
                                                <span className="text-[10px] font-bold text-neutral-500 bg-white/[0.06] w-6 h-6 rounded-lg flex items-center justify-center shrink-0">#{idx + 1}</span>
                                            )}
                                            <div className="w-10 h-10 rounded-xl bg-emerald-500/15 flex items-center justify-center text-emerald-400 text-sm font-bold shrink-0 border border-emerald-500/20">
                                                {pair.seat?.name || '-'}
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <p className="text-[13px] font-semibold text-white">{pair.session.name}</p>
                                                <div className="flex items-center gap-1.5 mt-0.5">
                                                    <span className="text-[10px] font-mono text-neutral-400">{pair.session.ticket_code}</span>
                                                    {pair.session.gender && (
                                                        <span className={`text-[8px] px-1 rounded font-bold uppercase ${pair.session.gender === 'male' ? 'bg-blue-500/15 text-blue-400' : 'bg-pink-500/15 text-pink-400'}`}>
                                                            {pair.session.gender === 'male' ? 'L' : 'P'}
                                                        </span>
                                                    )}
                                                    {pair.session.category && (
                                                        <span className="text-[8px] px-1 rounded font-bold uppercase bg-amber-500/15 text-amber-400">{pair.session.category}</span>
                                                    )}
                                                </div>
                                            </div>
                                            {cd > 0 && <span className="text-[10px] font-mono text-amber-400 shrink-0">{formatTime(cd)}</span>}
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Bottom action */}
                            <div className="px-4 pb-6 pt-2 flex gap-2">
                                <button onClick={() => setShowConfirmDialog(false)} className="flex-1 py-3 rounded-xl text-sm font-medium text-neutral-400 bg-white/[0.04] active:scale-[0.97] border border-white/[0.06] transition-all">Batal</button>
                                <button data-testid="confirm-booking-submit" onClick={handleConfirmBooking} disabled={isLocking || allLockedPairs.length === 0} className="flex-1 py-3 rounded-xl text-sm font-semibold text-white bg-emerald-600 active:scale-[0.97] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-all">
                                    {isLocking ? (<><IconLoader2 className="h-4 w-4 animate-spin" /> Memproses...</>) : (<><IconCheck className="h-4 w-4" /> Konfirmasi {allLockedPairs.length > 1 ? `(${allLockedPairs.length})` : ''}</>)}
                                </button>
                            </div>
                        </div>
                    </DrawerContent>
                </Drawer>

                {/* ── War Countdown Overlay ── */}
                {msUntilWar > 0 && (
                    <div className="absolute inset-0 z-50 flex items-center justify-center px-6" style={{ background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(12px)' }}>
                        <div className="text-center p-6 md:p-10 rounded-3xl max-w-md w-full" style={{ background: '#141414', border: '1px solid rgba(255,255,255,0.06)' }}>
                            <div className="w-14 h-14 rounded-2xl bg-red-500/10 flex items-center justify-center mx-auto mb-5">
                                <IconArmchair className="h-7 w-7 text-red-500" />
                            </div>
                            <h2 className="text-xl md:text-2xl font-bold text-white mb-2">War Kursi Belum Dimulai</h2>
                            <p className="text-sm text-neutral-500 mb-6 md:mb-8">Persiapkan e-tiketmu. Silahkan download <a href="https://darisini.com/orders" target="_blank" rel="noopener noreferrer" className="text-emerald-400 underline hover:text-emerald-500">darisini</a>.</p>
                            <div className="flex gap-3 justify-center">
                                {[
                                    { label: 'Hari', value: Math.floor(msUntilWar / (1000 * 60 * 60 * 24)) },
                                    { label: 'Jam', value: Math.floor((msUntilWar / (1000 * 60 * 60)) % 24) },
                                    { label: 'Menit', value: Math.floor((msUntilWar / 1000 / 60) % 60) },
                                    { label: 'Detik', value: Math.floor((msUntilWar / 1000) % 60) },
                                ].map((unit, i) => (
                                    <div key={i} className="flex flex-col items-center">
                                        <div className="text-white font-mono text-2xl md:text-3xl font-bold rounded-xl w-14 h-14 md:w-16 md:h-16 flex items-center justify-center"
                                            style={{ background: '#1a1a1a', border: '1px solid rgba(255,255,255,0.06)' }}>
                                            {unit.value.toString().padStart(2, '0')}
                                        </div>
                                        <span className="text-[10px] text-neutral-600 mt-2 font-medium uppercase tracking-wider">{unit.label}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* ── Interactive Seat Map ── */}
                <div className={`flex-1 overflow-hidden ${msUntilWar > 0 ? 'pointer-events-none opacity-20' : ''}`}>
                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center h-full gap-3">
                            <IconLoader2 className="h-8 w-8 animate-spin text-neutral-500" />
                            <p className="text-sm text-neutral-600 font-medium">Memuat denah kursi...</p>
                        </div>
                    ) : (
                        <TransformWrapper
                            key={`transform-${layoutBounds.width}-${initialScale}`}
                            minScale={0.1}
                            initialScale={initialScale}
                            centerOnInit={true}
                            wheel={{ step: 0.05 }}
                            doubleClick={{ disabled: true }}
                        >
                            <TransformComponent wrapperStyle={{ width: '100%', height: '100%' }}>
                                <div
                                    style={{
                                        width: layoutBounds.width,
                                        height: layoutBounds.height,
                                        position: 'relative',
                                    }}
                                >
                                    {seats.map((seatData) => {
                                        const isStage = seatData.category === 'STAGE';
                                        let isAllowedByGender = true;
                                        let isAllowedByCategory = true;
                                        const activeSession = ticketSessions.find(t => t.ticket_id === activeTicketId);

                                        if (activeSession && !isStage) {
                                            if (seatData.gender && seatData.gender !== 'both') {
                                                if (!activeSession.gender || activeSession.gender !== seatData.gender) {
                                                    isAllowedByGender = false;
                                                }
                                            }
                                            if (activeSession.category && seatData.category && activeSession.category.toLowerCase() !== seatData.category.toLowerCase()) {
                                                isAllowedByCategory = false;
                                            }
                                        }

                                        const isAllowed = isAllowedByGender && isAllowedByCategory;
                                        const status = isStage ? 'stage' : getSeatStatus(seatData.id!);
                                        const isClickable = !isStage && isAllowed && (status === 'available' || status === 'mine');
                                        const color = isStage ? (seatData.color || '#1e293b') : getSeatColor(status, seatData.color || '#3b82f6');

                                        // Use coordinate data or fallback to grid position if x/y are missing
                                        let x = seatData.x ?? 0;
                                        let y = seatData.y ?? 0;

                                        if (seatData.x === undefined || seatData.y === undefined) {
                                            if (seatData.position && seatData.position.includes('-')) {
                                                const [r, c] = seatData.position.split('-');
                                                x = parseInt(c) * CELL_SIZE;
                                                y = parseInt(r) * CELL_SIZE;
                                            }
                                        }

                                        // Shift coordinates so layout fits tightly in the div
                                        x -= layoutBounds.minX;
                                        y -= layoutBounds.minY;

                                        const seatWidth = seatData.width || CELL_SIZE - 2;
                                        const seatHeight = seatData.height || CELL_SIZE - 2;
                                        const rotation = seatData.rotation ?? 0;

                                        return (
                                            <div
                                                key={seatData.id}
                                                data-testid={`seat-${seatData.id}`}
                                                data-seat-status={status}
                                                style={{
                                                    position: 'absolute',
                                                    top: y,
                                                    left: x,
                                                    width: seatWidth,
                                                    height: seatHeight,
                                                    backgroundColor: color,
                                                    border: status === 'mine' ? '2px solid #4ade80' : status === 'session_booked' ? '2px solid #60a5fa' : status === 'session_locked' ? '2px solid #4ade80' : '1px solid rgba(255,255,255,0.08)',
                                                    borderRadius: isStage ? '8px' : '4px',
                                                    boxSizing: 'border-box',
                                                    cursor: isClickable ? 'pointer' : (isStage ? 'default' : 'not-allowed'),
                                                    opacity: status === 'booked' ? 0.5 : status === 'session_booked' ? 0.9 : (!isAllowed ? 0.2 : 1),
                                                    transition: 'all 0.2s ease',
                                                    transform: `rotate(${rotation}deg)`,
                                                    transformOrigin: 'top left',
                                                }}
                                                onClick={() => isClickable && handleSeatClick(seatData)}
                                            >
                                                <div className="flex flex-col items-center justify-center h-full text-center">
                                                    {isStage ? (
                                                        <p className="text-2xl font-bold text-white tracking-widest">{seatData.name || 'STAGE'}</p>
                                                    ) : (
                                                        <>
                                                            <p className="text-[15px] font-bold text-white">
                                                                {status === 'booked' ? '✕' : status === 'session_booked' ? '✓' : status === 'locked' ? '🔒' : status === 'session_locked' ? '🔒' : seatData.name}
                                                            </p>
                                                            {status == 'session_booked' ? <p className="text-[15px] text-white/80 font-bold">{seatData.name}</p> : <p className="text-[10px] text-white/80">{seatData.category}</p>}
                                                            {seatData.gender && seatData.gender !== 'both' && (
                                                                <div className={`absolute top-0 right-0 w-3 h-3 rounded-bl-sm flex items-center justify-center text-[7px] font-bold ${seatData.gender === 'male' ? 'bg-blue-500 text-white' : 'bg-pink-500 text-white'
                                                                    }`}>
                                                                    {seatData.gender === 'male' ? 'L' : 'P'}
                                                                </div>
                                                            )}
                                                        </>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </TransformComponent>
                        </TransformWrapper>
                    )}
                </div>

                {/* ═══════════════ MOBILE BOTTOM TICKET BAR ═══════════════ */}
                <div className="md:hidden shrink-0 z-30 flex flex-col bg-[#0f0f0f] border-t border-white/[0.06]">
                    <div className="px-4 py-3 flex gap-3 overflow-x-auto items-center" style={{ scrollbarWidth: 'none' }}>
                        {ticketSessions.length === 0 && (
                            <span className="text-[11px] text-neutral-500 whitespace-nowrap italic">Belum ada tiket di sesi ini.</span>
                        )}
                        {ticketSessions.map((t) => {
                            const isActive = activeTicketId === t.ticket_id;
                            const bookedSeatItem = bookedSeatsData.find(b => b.ticket_id === t.ticket_id);
                            const lockedSeatItem = lockedSeats.find(ls => ls.admin_id === t.ticket_id);
                            const isBooked = !!bookedSeatItem;
                            const isLocked = !!lockedSeatItem && !isBooked;
                            const seatName = bookedSeatItem?.seat?.name ||
                                (bookedSeatItem ? seats.find(s => s.id === bookedSeatItem.seat_id)?.name : null) ||
                                (lockedSeatItem ? seats.find(s => s.id === lockedSeatItem.seat_id)?.name : null);

                            return (
                                <div key={t.ticket_id} data-testid={`ticket-session-${t.ticket_id}`} onClick={() => setActiveTicketId(t.ticket_id)} className={`shrink-0 flex items-center h-14 rounded-xl border pl-3 pr-2 gap-3 cursor-pointer transition-all ${isActive ? 'bg-emerald-500/10 border-emerald-500/30 shadow-[0_0_15px_rgba(16,185,129,0.1)]' : 'bg-white/[0.05] border-white/[0.1] hover:bg-white/[0.08]'}`}>
                                    <div className="flex flex-col justify-center min-w-[100px] max-w-[140px]">
                                        <p className={`text-[13px] font-semibold truncate ${isActive ? 'text-emerald-400' : 'text-neutral-200'}`}>{t.ticket_code || t.ticket_id}</p>
                                        <div className="flex items-center gap-1.5 mt-0.5">
                                            <span className="text-[10px] text-neutral-500 truncate max-w-[80px]">{t.name}</span>
                                            {t.gender && <span className={`text-[9px] px-1 rounded uppercase font-bold ${t.gender.toLowerCase() === 'male' ? 'bg-blue-500/20 text-blue-400' : 'bg-pink-500/20 text-pink-400'}`}>{t.gender === 'male' ? 'L' : 'P'}</span>}
                                            {t.category && <span className={`text-[9px] px-1 rounded uppercase font-bold ${t.category.toLowerCase() === 'platinum' ? 'bg-yellow-500/20 text-yellow-400' : 'bg-pink-500/20 text-pink-400'}`}>{t.category}</span>}
                                        </div>
                                    </div>
                                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center text-xs font-bold ${isBooked || isLocked ? 'bg-emerald-500 shadow-md shadow-emerald-500/20 text-white' : 'bg-white/10 text-neutral-400 border border-dashed border-white/20'}`}>
                                        {isBooked || isLocked ? seatName : <IconArmchair className="h-4 w-4" />}
                                    </div>
                                    <button onClick={(e) => {
                                        e.stopPropagation();
                                        const key = `war_kursi_tokens_${eventId}`;
                                        const lockedSeat = lockedSeats.find(s => s.admin_id === t.ticket_id);
                                        if (lockedSeat) {
                                            lockSeatWarKursi(eventId, lockedSeat.seat_id!, t.ticket_id).catch(() => { });
                                            setLockedSeats(prev => prev.filter(s => s.seat_id !== lockedSeat.seat_id));
                                            setTicketCountdowns(prev => ({ ...prev, [t.ticket_id]: 0 }));
                                        }
                                        const newSessions = ticketSessions.filter(ts => ts.ticket_id !== t.ticket_id);
                                        setTicketSessions(newSessions);
                                        localStorage.setItem(key, JSON.stringify(newSessions.map(ts => ts.token)));
                                        if (isActive) setActiveTicketId(newSessions.length > 0 ? newSessions[0].ticket_id : null);
                                    }} className="w-6 h-6 flex items-center justify-center rounded-md hover:bg-red-500/20 text-neutral-500 hover:text-red-400 transition-colors ml-1">
                                        <IconX className="h-4 w-4" />
                                    </button>
                                </div>
                            );
                        })}
                    </div>

                    <div className="px-4 py-2.5 border-t border-white/[0.06] flex flex-col gap-2.5 bg-white/[0.02]">
                        <VerifyTicketDialog eventId={eventId} onVerified={handleAddTickets}>
                            <button data-testid="mobile-add-ticket-button" className="flex w-full items-center justify-center gap-2 h-11 rounded-xl border border-dashed border-white/20 hover:border-white/40 bg-white/[0.03] hover:bg-white/[0.06] transition-all text-neutral-400 hover:text-white">
                                <IconPlus className="h-4 w-4" />
                                <span className="text-sm font-semibold">Tambah Tiket</span>
                            </button>
                        </VerifyTicketDialog>

                        {allLockedPairs.length > 0 ? (
                            <div className="flex items-center justify-between pt-0.5">
                                <div className="flex items-center gap-2">
                                    <span className="text-emerald-400 text-sm font-medium">⏱ <strong className="font-mono">{formatTime(maxLockedCountdown)}</strong></span>
                                    <span className="text-[12px] text-neutral-400"><strong className="text-white">{allLockedPairs.length}</strong> kursi</span>
                                </div>
                                <button data-testid="mobile-confirm-button" className="flex items-center gap-1.5 rounded-xl bg-emerald-500 px-5 py-2.5 text-sm font-semibold text-white active:scale-95 transition-all shadow-lg shadow-emerald-500/20" onClick={() => setShowConfirmDialog(true)}>
                                    <IconCheck className="h-4 w-4" /> Konfirmasi
                                </button>
                            </div>
                        ) : hasBookedSeats ? (
                            <button data-testid="mobile-invoice-button" onClick={() => setShowInvoice(true)} className="mt-0.5 flex items-center justify-center gap-2 rounded-xl bg-emerald-500 w-full py-2.5 text-sm font-semibold text-white active:scale-95 transition-all shadow-lg shadow-emerald-500/20">
                                <IconReceipt className="h-4 w-4" /> Lihat E-Invoice
                            </button>
                        ) : null}
                    </div>
                </div>
            </div>
        </div>
    );
}
