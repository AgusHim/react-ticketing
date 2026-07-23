// context/TicketsProvider.tsx
import React, { useCallback, useEffect, useRef, useState } from 'react';
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
    const requestSeqRef = useRef(0);

    const refreshTickets = useCallback(async () => {
        const requestSeq = requestSeqRef.current + 1;
        requestSeqRef.current = requestSeq;

        try {
            const tickets = await findTicketsByID(search, 1, 20);
            if (requestSeq === requestSeqRef.current) {
                setTickets(tickets);
            }
        } catch (err) {
            if (requestSeq === requestSeqRef.current) {
                toast.error(`Failed to fetch tickets: ${err}`);
            }
        }
    }, [search]);

    useEffect(() => {
        void refreshTickets();
    }, [refreshTickets]);

    const handleSearch = (search: string) => {
        setSearch(search);
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
                refreshTickets,
            }}
        >
            {children}
        </TicketsContext.Provider>
    );
};
