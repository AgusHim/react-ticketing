import type { Seat } from "./seat";
import type { Ticket } from "./ticket";

export type BookedSeat = {
    id?: string;
    seat_id?: string;
    seat?: Seat | null;
    event_id?: string;
    admin_id?: string;
    name?: string;
    ticket_id?: string;
    ticket?: Ticket | null;
    created_at?: string;
};

export type ResDeleteBookedSeat = {
    success: boolean;
    message: string;
}