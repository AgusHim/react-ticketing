import axiosInstance, { admin_api } from './axios';

export interface EventModel {
  id: string;
  slug?: string;
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
  community?: {
    id: string;
    slug: string;
    name: string;
    type: string;
    logo_url?: string;
  };
}

export type PublicEventFilters = {
  q?: string;
  location?: string;
  community?: string;
  date_from?: string;
  date_to?: string;
  page?: number;
  limit?: number;
};

export type PublicEventResult = {
  events: EventModel[];
  total: number;
  page: number;
  limit: number;
};

export const getAllEvents = async (): Promise<EventModel[]> => {
  const res = await axiosInstance.get(`/api/events`);
  return res.data.data;
};

export const getEvent = async (id: string = 'default'): Promise<EventModel> => {
  const res = await axiosInstance.get(`/api/events/${id}`);
  return res.data.data;
};

export const searchPublicEvents = async (
  filters: PublicEventFilters = {},
): Promise<PublicEventResult> => {
  const res = await axiosInstance.get("/api/v1/events", { params: filters });
  return {
    events: res.data.data as EventModel[],
    total: Number(res.data.meta?.total || 0),
    page: Number(res.data.meta?.page || 1),
    limit: Number(res.data.meta?.limit || 12),
  };
};

export const getPublicEvent = async (idOrSlug: string): Promise<EventModel> => {
  const res = await axiosInstance.get(
    `/api/v1/events/${encodeURIComponent(idOrSlug)}`,
  );
  return res.data.data as EventModel;
};

export const getFollowingEvents = async (): Promise<EventModel[]> => {
  const res = await admin_api.get("/api/v1/me/events");
  return res.data.data as EventModel[];
};

export const getCommunityEvents = async (slug: string): Promise<EventModel[]> => {
  const res = await axiosInstance.get(
    `/api/v1/communities/${encodeURIComponent(slug)}/events`,
    { params: { limit: 6 } },
  );
  return res.data.data as EventModel[];
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
