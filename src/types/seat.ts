export type Seat = {
    id?: string;
    position?: string | null;
    name?: string;
    category: string;
    gender?: string;
    color: string;
    show_id?: string | null;
    event_id?: string | null;
    x?: number;
    y?: number;
    rotation?: number;
    width?: number;
    height?: number;
};

export type SeatLocked = {
    seat_id?: string;
    admin_id?: string;
    show_id?: string;
    ticket_id?: string;
    ticket_code?: string;
    name?: string;
    email?: string;
    ticket_name?: string;

};

export type ResSeatLocked = {
    status: string,
    data: SeatLocked,
}

export type SeatGenerate = {
    start: string;
    cols: number;
    rows: number;
    group: string;
    number_start: number;
    category?: string;
    gender?: string;
    color?: string;
    margin?: number;
};