import type { ResSeatLocked, SeatLocked } from '@/types/seat';
import axios, { admin_api } from './axios';
import type { BookedSeat } from '@/types/booked-seat';

export const findBookedSeats = async (show_id?: string): Promise<BookedSeat[]> => {
    const res = await axios.get("/api/booked-seats", {
        params: {
            show_id
        }
    },
    );
    return res.data.data as BookedSeat[];
};

export const upsertSeats = async (seats: BookedSeat[]): Promise<BookedSeat[]> => {
    const res = await admin_api.post("/admin_api/booked-seats/upsert", seats);
    return res.data.data as BookedSeat[];
};

export const lockSeat = async (seat: SeatLocked): Promise<ResSeatLocked> => {
    try {
        const res = await admin_api.post("/admin_api/seats/locked", seat);
        return res.data as ResSeatLocked;
    } catch (err) {
        console.error('Lock seat failed:', err); // gunakan err
        throw new Error('Lock seat failed:');
    }
};

export const getSeatsLocked = async (show_id: string): Promise<SeatLocked[]> => {
    const res = await admin_api.get("/admin_api/seats/locked", {
        params: {
            show_id
        }
    });
    if (res.data.data !== null) {
        return res.data.data as SeatLocked[];
    } else {
        return [];
    }
};
