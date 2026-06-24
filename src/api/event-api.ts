import axiosInstance, { admin_api } from './axios';

export interface EventModel {
  id: string;
  name: string;
  date: string;
  location: string;
  description: string;
  status: string;
  image_url?: string;
  color?: string;
  war_start_date?: string;
  created_at: string;
  updated_at: string;
}

export const getAllEvents = async (): Promise<EventModel[]> => {
  const res = await axiosInstance.get(`/api/events`);
  return res.data.data;
};

export const getEvent = async (id: string = 'default'): Promise<EventModel> => {
  const res = await axiosInstance.get(`/api/events/${id}`);
  return res.data.data;
};

export const updateEvent = async (id: string, payload: Partial<EventModel>): Promise<EventModel> => {
  const res = await admin_api.put(`/admin_api/events/${id}`, payload);
  return res.data.data;
};

export const createEvent = async (payload: Partial<EventModel>): Promise<EventModel> => {
  const res = await admin_api.post(`/admin_api/events`, payload);
  return res.data.data;
};

export const deleteEvent = async (id: string): Promise<void> => {
  await admin_api.delete(`/admin_api/events/${id}`);
};
