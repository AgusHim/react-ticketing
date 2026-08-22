import type { Event } from "./event";
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
    event?: Event | null;
    booked_seat?: BookedSeat | null;
    goodie_bag_claimed?: boolean;
    darisini_scan_status?: string;
    darisini_scan_response?: string;
    darisini_scanned_at?: string | null;
    category?: string;
};

export type DarisiniAttendance = {
    decodedId?: string;
    attendedAt?: string;
    scannerUserFullName?: string;
    notes?: string[];
    attachmentUrl?: string | null;
};

export type DarisiniCheck = {
    success?: boolean;
    error?: {
        code?: string;
        message?: string;
        ticketName?: string;
        eventTitle?: string;
        eventShortUrl?: string;
    } | null;
    data?: {
        publicId?: string;
        orderUserEmail?: string;
        orderUserFullName?: string;
        ownerUserEmail?: string;
        ownerUserFullName?: string;
        ownerUserGender?: string;
        ticket?: { name?: string; eventTitle?: string; eventStartDate?: string };
        attendance?: DarisiniAttendance[];
        maximumScan?: number;
        currentScanCount?: number;
    } | null;
};

