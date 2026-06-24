import { admin_api } from './axios';
import axiosInstance from './axios';

export interface ImportResult {
  message: string;
  imported_count: number;
  skipped_count: number;
}

export interface VerifyResult {
  ticket_id: string;
  ticket_code: string;
  name: string;
  ticket_name: string;
  token: string;
  order_id?: string;
  email?: string;
  page?: number;
  event_id?: string;
}

// Admin: Import participants from Excel file
export const importExcelParticipants = async (file: File, eventId: string): Promise<ImportResult> => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('event_id', eventId);

  const res = await admin_api.post('/admin_api/import-excel', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    timeout: 60000, // 60s for large files
  });
  return res.data as ImportResult;
};

// Public: Verify ticket code for war kursi
export const verifyTicketCode = async (ticketCode: string): Promise<VerifyResult> => {
  const res = await axiosInstance.post('/api/verify-ticket', {
    ticket_code: ticketCode,
  });
  return res.data.data as VerifyResult;
};

// Public: Verify ticket via PDF upload
export const verifyTicketPDF = async (file: File): Promise<VerifyResult[]> => {
  const formData = new FormData();
  formData.append('file', file);
  
  const res = await axiosInstance.post('/api/verify-ticket-pdf', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    timeout: 30000,
  });
  return res.data.data as VerifyResult[];
};


// Public: Lock/unlock a seat during war kursi
export const lockSeatWarKursi = async (eventId: string, seatId: string, userId: string) => {
  const res = await axiosInstance.post('/api/seats/lock', {
    show_id: eventId,
    seat_id: seatId,
    admin_id: userId,
  });
  return res.data;
};

// Public: Get all currently locked seats
export const getLockedSeats = async (eventId: string) => {
  const res = await axiosInstance.get('/api/seats/locked', {
    params: { show_id: eventId },
  });
  return res.data.data;
};

// Public: Confirm a locked seat permanently
export const confirmSeatBooking = async (eventId: string, seatId: string, ticketId: string, name: string) => {
  const res = await axiosInstance.post('/api/seats/confirm', {
    event_id: eventId,
    seat_id: seatId,
    ticket_id: ticketId,
    name: name,
  });
  return res.data;
};
