import type { BookedSeat } from "./booked-seat";

export type Ticket = {
    id?: string;
    name?: string;
    gender?: string;
    email?: string;
    phone?: string;
    ticket_id?: string;
    ticket_code?: string;
    ticket_name?: string;
    show_id?: string;
    event_id?: string;
    booked_seat?: BookedSeat | null;
    goodie_bag_claimed?: boolean;
    category?: string;
};