// context/SeatsContext.tsx
import { createContext, useContext } from 'react';
import type { Ticket } from '@/types/ticket';

export type TicketsContextType = {
    tickets: Ticket[];
    setTickets: React.Dispatch<React.SetStateAction<Ticket[]>>;
    ticket: Ticket;
    setTicket: React.Dispatch<React.SetStateAction<Ticket>>;
    search: string;
    setSearch: React.Dispatch<React.SetStateAction<string>>;
    handleSearch: (search: string) => void;
    refreshTickets: () => Promise<void>;
};

export const TicketsContext = createContext<TicketsContextType | undefined>(undefined);

export const useTickets = (): TicketsContextType => {
    const context = useContext(TicketsContext);
    if (!context) {
        throw new Error('useTickets must be used within a TicketsProvider');
    }
    return context;
};
