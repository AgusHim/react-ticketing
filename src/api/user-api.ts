import type { User } from '@/types/user';
import axios, { admin_api, refreshAccessToken } from './axios';
import type { BookedSeat } from '@/types/booked-seat';

export const findUsers = async (): Promise<BookedSeat[]> => {
    const res = await admin_api.get("/admin_api/users",);
    return res.data.data as BookedSeat[];
};

export const login = async (email:string, password:string): Promise<User> => {
    const res = await axios.post("/api/v1/auth/login", {
        "email":email,
        "password":password,
    });
    const token = res.data.token;
    const user = res.data.data;
    if(token && user){
        localStorage.setItem('token',token);
        localStorage.setItem('user',JSON.stringify(user));
    }
    return res.data.data as User;
};

export const register = async (name: string, email: string, password: string): Promise<void> => {
    await axios.post("/api/v1/auth/register", { name, email, password });
};

export const getMe = async (): Promise<User> => {
    const res = await admin_api.get("/api/v1/me");
    return res.data.data as User;
};

export const refreshSession = async (): Promise<User> => {
    await refreshAccessToken();
    return getMe();
};

export const logoutSession = async (): Promise<void> => {
    await axios.post("/api/v1/auth/logout");
};

export type AuthSession = {
    id: string;
    user_agent: string;
    ip_address: string;
    expires_at: string;
    last_used_at: string;
    created_at: string;
    current: boolean;
};

export const getAuthSessions = async (): Promise<AuthSession[]> => {
    const res = await admin_api.get("/api/v1/auth/sessions");
    return res.data.data as AuthSession[];
};

export const revokeAuthSession = async (sessionId: string): Promise<void> => {
    await admin_api.delete(`/api/v1/auth/sessions/${encodeURIComponent(sessionId)}`);
};
