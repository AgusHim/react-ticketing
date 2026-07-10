// context/TicketsProvider.tsx
import React, { useEffect, useState } from 'react';
import { TicketsContext } from './TicketsContext';
import type { Ticket } from '@/types/ticket';
import { findTicketsByID } from '@/api/ticket-api';
import { toast } from 'sonner';

export const TicketsProvider = ({ children }: { children: React.ReactNode }) => {
    const [ticket, setTicket] = useState<Ticket>({
        id: "",
        name: '',
        show_id: '',
        email: '',
        phone: '',
        gender: '',
        ticket_name: '',
    });
    const [tickets, setTickets] = useState<Ticket[]>([]);
    const [search, setSearch] = useState<string>("");

    useEffect(() => {
        const fetchTickets = async () => {
            const fetchData = async () => {
                try {
                    const tickets = await findTicketsByID(search);
                    setTickets(tickets);
                } catch (err) {
                    toast.error(`Failed to fetch selected seats: ${err}`);
                }
            };

            fetchData();
        };

        fetchTickets();
    }, [setTickets, search]);

    const handleSearch = async (search: string) => {
        try {
            setSearch(search);
            const ticket = await findTicketsByID(search, 1, 20);
            setTickets(ticket);
        } catch (err) {
            toast.error(`Failed to fetch selected seats: ${err}`);
        }
    }

    return (
        <TicketsContext.Provider
            value={{
                tickets,
                setTickets,
                ticket,
                setTicket,
                search,
                setSearch,
                handleSearch,
            }}
        >
            {children}
        </TicketsContext.Provider>
    );
};
