// context/SeatsContext.tsx
import React, { createContext, useContext } from 'react';
import type { Seat, SeatGenerate } from '@/types/seat';

export type SeatsContextType = {
    selectedShow: string;
    setSelectedShow: React.Dispatch<React.SetStateAction<string>>;
    toggleSelectShow: (show: string) => Promise<void>;
    seatConfig: Seat;
    setSeatConfig: React.Dispatch<React.SetStateAction<Seat>>;
    seatGenerateConfig: SeatGenerate;
    setSeatGenerateConfig: React.Dispatch<React.SetStateAction<SeatGenerate>>;
    seats: Seat[];
    setSeats: React.Dispatch<React.SetStateAction<Seat[]>>;
    toggleSeat: (id: string) => void;
    updateSeat: () => void;
    updateSeatCoordinates: (id: string, x: number, y: number, rotation: number, width?: number, height?: number) => void;
    updateMultipleSeatCoordinates: (updates: { id: string, x: number, y: number, rotation: number, width?: number, height?: number }[]) => void;
    
    // Global Selection & Bulk Actions
    selectedIds: string[];
    setSelectedIds: React.Dispatch<React.SetStateAction<string[]>>;
    updateSelectedSeatsProperties: (color: string, category: string, prefix?: string, rotation?: number) => void;
    deleteSelectedSeats: () => void;

    countByCategory: Record<string, { total: number; color: string; category: string; gender: string }>;
    removeSeat: (id: string) => void;
    createSeat: (id: string) => void;
    createStage: () => void;
    generateReset: () => void;
    generateSeats: () => void;
};

export const SeatsContext = createContext<SeatsContextType | undefined>(undefined);

export const useSeats = (): SeatsContextType => {
    const context = useContext(SeatsContext);
    if (!context) {
        throw new Error('useSeats must be used within a SeatsProvider');
    }
    return context;
};
