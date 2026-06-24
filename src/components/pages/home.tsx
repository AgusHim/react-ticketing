import { useEffect, useState } from "react";
import { getAllEvents, type EventModel } from "@/api/event-api";
import { useNavigate } from "react-router-dom";
import { IconMapPin, IconCalendarEvent, IconTicket, IconLoader2, IconArrowRight, IconSparkles } from "@tabler/icons-react";
import { toast } from "sonner";

export default function HomePage() {
    const [events, setEvents] = useState<EventModel[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        getAllEvents()
            .then(data => setEvents(data))
            .catch(_ => toast.error("Gagal memuat event"))
            .finally(() => setIsLoading(false));
    }, []);

    const handleEventClick = (eventId: string) => {
        navigate(`/booking?event_id=${eventId}`);
    };

    return (
        <div className="min-h-[100dvh]" style={{ background: '#0a0a0a' }}>
            {/* Hero Header */}
            <div className="relative overflow-hidden">
                {/* Subtle gradient background */}
                <div className="absolute inset-0 opacity-40" style={{ background: 'radial-gradient(ellipse at 50% 0%, rgba(229,9,20,0.15) 0%, transparent 60%)' }} />

                <div className="relative max-w-6xl mx-auto px-4 pt-12 pb-8 md:pt-20 md:pb-12">
                    <div className="flex items-center gap-2 justify-center mb-4">
                        <div className="w-8 h-8 rounded-lg bg-white/[0.06] flex items-center justify-center">
                            <IconSparkles className="h-4 w-4 text-neutral-400" />
                        </div>
                        <span className="text-[11px] font-semibold text-neutral-500 uppercase tracking-[0.2em]">Live Seat Booking</span>
                    </div>
                    <h1 className="text-3xl md:text-5xl font-bold text-white text-center mb-3 leading-tight">
                        Pilih Event
                    </h1>
                    <p className="text-neutral-500 text-sm md:text-base text-center max-w-md mx-auto">
                        Silakan pilih event untuk memesan kursi Anda
                    </p>
                </div>
            </div>

            {/* Content */}
            <div className="max-w-6xl mx-auto px-4 pb-12 md:pb-20">
                {isLoading ? (
                    <div className="flex flex-col items-center justify-center py-24 gap-3">
                        <IconLoader2 className="h-8 w-8 animate-spin text-neutral-600" />
                        <p className="text-sm text-neutral-600 font-medium">Memuat event...</p>
                    </div>
                ) : events.length === 0 ? (
                    <div className="text-center py-24">
                        <div className="w-16 h-16 rounded-2xl bg-white/[0.04] flex items-center justify-center mx-auto mb-4">
                            <IconTicket className="h-8 w-8 text-neutral-700" />
                        </div>
                        <p className="text-neutral-600 text-sm">Tidak ada event yang tersedia saat ini.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5">
                        {events.map((event) => (
                            <div
                                key={event.id}
                                className="group cursor-pointer rounded-2xl overflow-hidden flex flex-col transition-all duration-300 hover:translate-y-[-2px] active:scale-[0.98]"
                                style={{
                                    background: '#141414',
                                    border: '1px solid rgba(255,255,255,0.06)',
                                }}
                                onClick={() => handleEventClick(event.id)}
                                onMouseEnter={(e) => {
                                    (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.12)';
                                    (e.currentTarget as HTMLElement).style.boxShadow = '0 8px 32px rgba(0,0,0,0.4)';
                                }}
                                onMouseLeave={(e) => {
                                    (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.06)';
                                    (e.currentTarget as HTMLElement).style.boxShadow = 'none';
                                }}
                            >
                                {/* Event Image / Banner */}
                                <div className="relative h-44 md:h-48 w-full overflow-hidden">
                                    {event.image_url ? (
                                        <img
                                            src={event.image_url}
                                            alt={event.name}
                                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                                        />
                                    ) : (
                                        <div
                                            className="w-full h-full flex items-center justify-center group-hover:scale-105 transition-transform duration-700 ease-out"
                                            style={{ background: `linear-gradient(135deg, ${event.color || '#e50914'}33, #0a0a0a)` }}
                                        >
                                            <IconTicket className="h-12 w-12 text-white/15" />
                                        </div>
                                    )}
                                    {/* Gradient overlay */}
                                    <div className="absolute inset-0 bg-gradient-to-t from-[#141414] via-transparent to-transparent" />

                                    {/* Status badge */}
                                    <div className="absolute top-3 right-3">
                                        {event.status === 'published' ? (
                                            <div className="flex items-center gap-1.5 bg-black/50 backdrop-blur-md px-2.5 py-1 rounded-full">
                                                <div className="relative flex h-1.5 w-1.5">
                                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                                    <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-400"></span>
                                                </div>
                                                <span className="text-[10px] font-semibold text-emerald-400 uppercase tracking-wide">Live</span>
                                            </div>
                                        ) : (
                                            <span className="text-[10px] font-semibold text-neutral-400 uppercase tracking-wide bg-black/50 backdrop-blur-md px-2.5 py-1 rounded-full">
                                                {event.status}
                                            </span>
                                        )}
                                    </div>
                                </div>

                                {/* Event Details */}
                                <div className="px-4 pb-4 pt-2 flex-1 flex flex-col">
                                    <h2 className="text-base md:text-lg font-bold text-white mb-3 line-clamp-2 leading-snug group-hover:text-neutral-100 transition-colors">
                                        {event.name}
                                    </h2>

                                    <div className="space-y-2 mb-4">
                                        <div className="flex items-center gap-2.5">
                                            <div className="w-7 h-7 rounded-lg bg-white/[0.04] flex items-center justify-center shrink-0">
                                                <IconCalendarEvent className="h-3.5 w-3.5 text-neutral-500" />
                                            </div>
                                            <span className="text-[12px] text-neutral-400 font-medium">
                                                {new Date(event.date).toLocaleDateString('id-ID', {
                                                    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
                                                })}
                                            </span>
                                        </div>

                                        <div className="flex items-center gap-2.5">
                                            <div className="w-7 h-7 rounded-lg bg-white/[0.04] flex items-center justify-center shrink-0">
                                                <IconMapPin className="h-3.5 w-3.5 text-neutral-500" />
                                            </div>
                                            <span className="text-[12px] text-neutral-400 font-medium line-clamp-1">{event.location}</span>
                                        </div>
                                    </div>

                                    {/* Action Button */}
                                    <div className="mt-auto pt-3 border-t border-white/[0.04]">
                                        <button
                                            className="w-full py-2.5 px-4 rounded-xl font-semibold text-sm text-white transition-all duration-200 flex items-center justify-center gap-2 group-hover:gap-3 active:scale-[0.97]"
                                            style={{
                                                background: `linear-gradient(135deg, ${event.color || '#e50914'}, ${event.color || '#e50914'}cc)`,
                                            }}
                                        >
                                            Pesan Kursi
                                            <IconArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
