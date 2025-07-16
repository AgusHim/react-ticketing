
import type { Ticket } from '@/types/ticket';
import { admin_api } from './axios';
import type { BookedSeat } from '@/types/booked-seat';

export const findTicket = async (): Promise<BookedSeat[]> => {
    const res = await admin_api.get("/admin_api/tickets");
    return res.data.data as BookedSeat[];
};

export const findTicketsByID = async (search?: string, page?:number, per_page?:number, show_id?: string): Promise<Ticket[]> => {
    const res = await admin_api.get("/admin_api/tickets", {
        params: {
            search,
            "page":page??1,
            "per_page":per_page??3,
            show_id
        }
    },
    );
    return res.data.data as Ticket[];
};