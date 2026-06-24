import React, { useEffect, useRef, useState } from 'react';
import type { Seat, SeatLocked } from '@/types/seat';
import { toast } from 'sonner';
import { BookedSeatsContext } from './BookedSeatsContext';
import type { BookedSeat } from '@/types/booked-seat';
import { deleteBookedSeat, findBookedSeats, getSeatsLocked, lockSeat, upsertSeats } from '@/api/booked-seat-api';
import { findSeats } from '@/api/seatApi';
import { useAuth } from './AuthContext';
import type { Ticket } from '@/types/ticket';
import { findTicketsByID } from '@/api/ticket-api';
import { getAllEvents, type EventModel } from '@/api/event-api';

export const BookedSeatsProvider = ({ children }: { children: React.ReactNode }) => {
    const { user } = useAuth();
    const [events, setEvents] = useState<EventModel[]>([]);
    const [seats, setSeats] = useState<Seat[]>([]);
    const [selectedShow, setSelectedShow] = useState<string>("");
    const [selectedCategory, setSelectedCategory] = useState<string>("all");
    const [selectedSeats, setSelectedSeats] = useState<BookedSeat[]>([]);
    const authSelectedSeats = selectedSeats.filter((s) => s.admin_id === user?.id);
    const anotherAuthSelectedSeats = selectedSeats.filter((s) => s.admin_id !== user?.id);
    const [bookedSeats, setBookedSeats] = useState<BookedSeat[]>([]);
    const [bookedSeat, setBookedSeat] = useState<BookedSeat | null>(null);
    const [tickets, setTickets] = useState<Ticket[]>([]);
    const seatCategories = Array.from(new Set(seats.map(seat => seat.category)));

    // Fetch initial events
    useEffect(() => {
        const fetchEvents = async () => {
            try {
                const eventsData = await getAllEvents();
                setEvents(eventsData);
                
                let show = localStorage.getItem("selectedShow");
                if (!show || show === 'reconnect' || show === 'disconnect') {
                    show = eventsData.length > 0 ? eventsData[0].id : '';
                    if (show) {
                        localStorage.setItem("selectedShow", show);
                        setSelectedShow(show);
                    }
                } else if (show && !selectedShow) {
                    setSelectedShow(show);
                }
            } catch (err) {
                toast.error(`Failed to fetch events: ${err}`);
            }
        };
        fetchEvents();
    }, []);

    // Fetch selected seats when selectedShow changes
    useEffect(() => {
        if (!selectedShow) return;
        
        const fetchData = async () => {
            try {
                const fetchedSeats = await findSeats(selectedShow);
                setSeats(fetchedSeats);
                const fetchedBookedSeats = await findBookedSeats(selectedShow);
                setBookedSeats(fetchedBookedSeats);
                const res = await getSeatsLocked(selectedShow);
                setSelectedSeats(res);
            } catch (err) {
                toast.error(`Failed to fetch seats: ${err}`);
            }
        };

        fetchData();
    }, [selectedShow]);

    const toggleSelectShow = async (show: string) => {
        setSelectedShow(show);
        localStorage.setItem("selectedShow", show);
    };

    const toggleSelectCategory = async (category: string) => {
        setSelectedCategory(category);
    };

    const lockingSeatIdsRef = useRef<Set<string>>(new Set());

    const toggleSeat = async (id: string) => {
        // Jika sedang diproses, abaikan klik
        if (lockingSeatIdsRef.current.has(id)) {
            console.warn(`Seat ${id} is still processing, click ignored`);
            return;
        }

        lockingSeatIdsRef.current.add(id); // Tandai sebagai in-process

        const newSeat: SeatLocked = {
            seat_id: id,
            admin_id: user?.id,
            show_id: selectedShow,
        };

        try {
            await toast.promise(lockSeat(newSeat), {
                loading: "Lock Seat Loading...",
                success: (data) => {
                    if (data.status === "locked") {
                        setSelectedSeats((prev) => {
                            const exists = prev.some((s) => s.seat_id === id);
                            if (!exists) {
                                return [...prev, data.data];
                            }
                            return prev; // Tidak ubah apa-apa jika sudah ada
                        });
                    } else if (data.status === "unlocked") {
                        setSelectedSeats((prev) =>
                            prev.filter((s) => s.seat_id !== id)
                        );
                    }

                    return `Seat has been ${data.status}`;
                },
                error: (err) => {
                    return err?.message || "Error locking seat";
                },
            });
        } finally {
            // Hapus dari set setelah selesai
            lockingSeatIdsRef.current.delete(id);
        }
    };

    const claimBookingSeats = async () => {
        try {
            const res = await upsertSeats(authSelectedSeats);
            toast.success('Successfully booking seats');
            res.forEach((seat) => {
                upsertSeatFromBookedSeat(seat);
                setSelectedSeats((prev) => {
                    const exists = prev.find((s) => s.seat_id === seat.seat_id);
                    let newSeats: SeatLocked[] = prev;
                    if (exists) {
                        newSeats = prev.filter((s) => s.seat_id !== seat.seat_id);
                    }
                    return newSeats;
                });
            });
        } catch (err) {
            toast.error(`Failed to booking seats: ${err}`);
        }
    };

    const removeBookedSeat = async (bookedID: string, isFromWS?: boolean) => {
        if (isFromWS) {
            setBookedSeats((prev) => {
                const exists = prev.find((s) => s.id === bookedID);
                let newSeats: BookedSeat[] = prev;
                if (exists) {
                    newSeats = prev.filter((s) => s.id !== bookedID);
                }
                return newSeats;
            });
        } else {
            try {
                await toast.promise(deleteBookedSeat(bookedID), {
                    loading: "Delete booked seat loading...",
                    success: (res) => {
                        if (res.success === true) {
                            setBookedSeats((prev) => {
                                const exists = prev.find((s) => s.id === bookedID);
                                let newSeats: BookedSeat[] = prev;
                                if (exists) {
                                    newSeats = prev.filter((s) => s.id !== bookedID);
                                }
                                return newSeats;
                            });
                        }
                        return res.message;
                    },
                    error: (err) => {
                        return err?.message || "Error delete booked seat";
                    },
                });

            } catch (err) {
                toast.error(`Failed to booking seats: ${err}`);
            }
        }

    };

    const upsertSeatFromBookedSeat = (seat: BookedSeat) => {
        setBookedSeats((prev) => {
            const existingIndex = bookedSeats.findIndex((s) => s.id === seat.id);
            let newSeats = [...prev];
            if (existingIndex !== -1) {
                newSeats[existingIndex] = seat;
            } else {
                newSeats = [...prev, seat];
            }

            return newSeats;
        });
    }

    const upsertSelectedSeats = (type: string, seat: BookedSeat) => {
        if (seat.show_id === selectedShow) {
            if (type === "seat_locked") {
                setSelectedSeats((prev) => {
                    const exists = prev.some((s) => s.seat_id === seat.seat_id);
                    if (!exists) {
                        return [...prev, seat];
                    }
                    return prev;
                });
            } if (type === "seat_unlocked") {
                setSelectedSeats((prev) => {
                    const exists = prev.find((s) => s.seat_id === seat.seat_id);
                    let newSeats: SeatLocked[] = prev;
                    if (exists) {
                        newSeats = prev.filter((s) => s.seat_id !== seat.seat_id);
                    }
                    return newSeats;
                });
            }
        }
    }

    const searchTicketsByID = async (id: string) => {
        const tickets = await findTicketsByID(id, 1, 5, selectedShow);
        setTickets(tickets);
    }

    const handleSelectedTicket = (ticket: Ticket, seat: Seat) => {
        setSelectedSeats((prev) => {
            const index = prev.findIndex((s) => s.seat_id === seat.id)
            const exists = prev.find((s) => s.seat_id === seat.id);

            if (index !== -1 && exists) {
                const updated = [...prev]
                updated[index] = {
                    id: `${selectedShow}-${seat.id}`,
                    show_id: selectedShow,
                    seat_id: seat.id,
                    admin_id: user?.id,
                    name: ticket.name,
                    ticket_id: ticket.id,
                };

                return updated
            }
            return prev;
        });
    }

    return (
        <BookedSeatsContext.Provider
            value={{
                events,
                seats,
                selectedSeats,
                authSelectedSeats,
                anotherAuthSelectedSeats,
                setSelectedSeats,
                selectedShow,
                toggleSelectShow,
                toggleSeat,
                bookedSeats,
                setBookedSeats,
                claimBookingSeats,
                upsertSeatFromBookedSeat,
                upsertSelectedSeats,
                tickets,
                setTickets,
                searchTicketsByID,
                handleSelectedTicket,
                selectedCategory,
                toggleSelectCategory,
                seatCategories,
                bookedSeat,
                setBookedSeat,
                removeBookedSeat,
            }}
        >
            {children}
        </BookedSeatsContext.Provider>
    );
};
