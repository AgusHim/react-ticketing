
import type { Ticket } from '@/types/ticket';
import { admin_api } from './axios';
import type { BookedSeat } from '@/types/booked-seat';

export const findTicket = async (): Promise<BookedSeat[]> => {
    const res = await admin_api.get("/admin_api/tickets");
    return res.data.data as BookedSeat[];
};

export const findTicketsByID = async (search?: string, page?: number, per_page?: number, event_id?: string): Promise<Ticket[]> => {
    const res = await admin_api.get("/admin_api/tickets", {
        params: {
            search,
            "page": page ?? 1,
            "limit": per_page ?? 5,
            event_id
        }
    },
    );
    return res.data.data as Ticket[];
};

export const toggleGoodieBag = async (id: string): Promise<Ticket> => {
    const res = await admin_api.post(`/admin_api/tickets/${id}/goodie-bag`);
    return res.data.data as Ticket;
};