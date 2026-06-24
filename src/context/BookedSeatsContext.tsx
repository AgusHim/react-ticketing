import React, { createContext, useContext } from 'react';
import type { Seat, SeatLocked } from '@/types/seat';
import type { BookedSeat } from '@/types/booked-seat';
import type { Ticket } from '@/types/ticket';
import type { EventModel } from '@/api/event-api';

export type BookedSeatsContextType = {
    events: EventModel[];
    seats: Seat[];
    selectedSeats: SeatLocked[];
    authSelectedSeats: SeatLocked[];
    anotherAuthSelectedSeats: SeatLocked[];
    setSelectedSeats: React.Dispatch<React.SetStateAction<BookedSeat[]>>;
    bookedSeats: BookedSeat[];
    setBookedSeats: React.Dispatch<React.SetStateAction<BookedSeat[]>>;
    tickets: Ticket[];
    setTickets: React.Dispatch<React.SetStateAction<Ticket[]>>;
    selectedShow: string;
    claimBookingSeats: () => void;
    toggleSeat: (id: string, seat: Seat) => void;
    toggleSelectShow: (show: string) => void;
    upsertSeatFromBookedSeat: (seat: BookedSeat) => void;
    upsertSelectedSeats: (type: string, seat: SeatLocked) => void;
    searchTicketsByID: (id: string) => Promise<void>;
    handleSelectedTicket: (ticket: Ticket, seat: Seat) => void;
    selectedCategory: string;
    toggleSelectCategory: (category: string) => void;
    seatCategories: string[];
    bookedSeat: BookedSeat | null;
    setBookedSeat: React.Dispatch<React.SetStateAction<BookedSeat | null>>;
    removeBookedSeat: (bookedID: string, isFromWS?: boolean) => void;
};

export const BookedSeatsContext = createContext<BookedSeatsContextType | undefined>(undefined);

export const useBookedSeats = (): BookedSeatsContextType => {
    const context = useContext(BookedSeatsContext);
    if (!context) {
        throw new Error('useBookedSeats must be used within a BookedSeatsProvider');
    }
    return context;
};
