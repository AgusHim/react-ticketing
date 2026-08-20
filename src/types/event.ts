export interface Event {
    id: string;
    name: string;
    date: string;
    location: string;
    description: string;
    status: string;
    image_url?: string;
    color?: string;
    event_scanner_id?: string;
    event_scanner_user_full_name?: string;
    war_start_date?: string;
    created_at: string;
    updated_at: string;
}
