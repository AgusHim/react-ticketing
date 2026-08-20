import { useEffect, useState } from "react";
import { getAllEvents, type EventModel } from "@/api/event-api";
import { useNavigate } from "react-router-dom";
import { IconMapPin, IconCalendarEvent, IconTicket, IconLoader2, IconArrowRight } from "@tabler/icons-react";
import { toast } from "sonner";

export default function HomePage() {
    const [events, setEvents] = useState<EventModel[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        getAllEvents()
            .then(data => setEvents(data))
            .catch(() => toast.error("Gagal memuat event"))
            .finally(() => setIsLoading(false));
    }, []);

    const handleEventClick = (eventId: string) => {
        navigate(`/booking?event_id=${eventId}`);
    };

    return (
        <div className="min-h-[100dvh] bg-bg-app text-foreground">
            {/* Hero Header */}
            <div className="neo-dots relative overflow-hidden border-b-2 border-neo-border">

                <div className="relative max-w-6xl mx-auto px-4 pt-12 pb-8 md:pt-20 md:pb-12">
                    <h1 className="mb-3 text-center text-4xl font-black leading-tight text-foreground md:text-6xl">
                        Pilih Event
                    </h1>
                    <p className="mx-auto max-w-md text-center text-sm font-medium text-muted-foreground md:text-base">
                        Silakan pilih event untuk memesan kursi Anda
                    </p>
                </div>
            </div>

            {/* Content */}
            <div className="max-w-6xl mx-auto px-4 py-4 pb-12 md:pb-20">
                {isLoading ? (
                    <div className="flex flex-col items-center justify-center py-24 gap-3">
                        <div className="neo-surface-sm flex items-center gap-3 bg-neo-purple px-5 py-4">
                            <IconLoader2 className="h-6 w-6 animate-spin text-neo-purple-solid" />
                            <p className="text-sm font-bold">Memuat event...</p>
                        </div>
                    </div>
                ) : events.length === 0 ? (
                    <div className="neo-dots py-20 text-center">
                        <div className="neo-surface mx-auto max-w-md bg-white p-8">
                            <div className="neo-icon-tile mx-auto mb-4 h-16 w-16 bg-neo-pink">
                                <IconTicket className="h-8 w-8 text-foreground" />
                            </div>
                            <h2 className="text-xl font-extrabold">Belum ada event</h2>
                            <p className="mt-2 text-sm text-muted-foreground">Tidak ada event yang tersedia saat ini.</p>
                        </div>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5">
                        {events.map((event) => (
                            <div
                                key={event.id}
                                className={`group neo-surface neo-lift cursor-pointer overflow-hidden flex flex-col active:translate-x-1 active:translate-y-1 active:shadow-none ${["bg-neo-yellow", "bg-neo-mint", "bg-neo-pink", "bg-neo-purple"][events.indexOf(event) % 4]}`}
                                style={{
                                    borderTopColor: event.color || '#1a1a1a',
                                }}
                                onClick={() => handleEventClick(event.id)}
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
                                        <div className="flex h-full w-full items-center justify-center bg-white/70">
                                            <IconTicket className="h-12 w-12 text-foreground/30" />
                                        </div>
                                    )}

                                    {/* Status badge */}
                                    <div className="absolute top-3 right-3">
                                        {event.status === 'published' ? (
                                            <div className="flex items-center gap-1.5 rounded-lg border-2 border-neo-border bg-neo-mint px-2.5 py-1">
                                                <div className="relative flex h-1.5 w-1.5">
                                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                                    <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-400"></span>
                                                </div>
                                                <span className="text-[10px] font-extrabold uppercase tracking-wide text-foreground">Live</span>
                                            </div>
                                        ) : (
                                            <span className="rounded-lg border-2 border-neo-border bg-white px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wide">
                                                {event.status}
                                            </span>
                                        )}
                                    </div>
                                </div>

                                {/* Event Details */}
                                <div className="px-4 pb-4 pt-2 flex-1 flex flex-col">
                                    <h2 className="mb-3 line-clamp-2 text-lg font-extrabold leading-snug text-foreground">
                                        {event.name}
                                    </h2>

                                    <div className="space-y-2 mb-4">
                                        <div className="flex items-center gap-2.5">
                                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border-2 border-neo-border bg-white">
                                                <IconCalendarEvent className="h-4 w-4 text-foreground" />
                                            </div>
                                            <span className="text-[12px] font-semibold text-foreground">
                                                {new Date(event.date).toLocaleDateString('id-ID', {
                                                    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
                                                })}
                                            </span>
                                        </div>

                                        <div className="flex items-center gap-2.5">
                                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border-2 border-neo-border bg-white">
                                                <IconMapPin className="h-4 w-4 text-foreground" />
                                            </div>
                                            <span className="line-clamp-1 text-[12px] font-semibold text-foreground">{event.location}</span>
                                        </div>
                                    </div>

                                    {/* Action Button */}
                                    <div className="mt-auto border-t-2 border-neo-border/20 pt-3">
                                        <button
                                            className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-neo-border bg-neo-yellow-solid px-4 py-2.5 text-sm font-extrabold text-foreground shadow-[3px_3px_0_#1a1a1a] transition-all group-hover:gap-3 active:translate-x-[3px] active:translate-y-[3px] active:shadow-none"
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
