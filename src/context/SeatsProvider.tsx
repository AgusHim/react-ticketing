// context/SeatsProvider.tsx
import React, { useEffect, useState } from 'react';
import { SeatsContext } from './SeatsContext';
import { deleteSeat, findSeats, postSeat, putSeat } from '@/api/seatApi';
import type { Seat, SeatGenerate } from '@/types/seat';
import { toast } from 'sonner';

export const SeatsProvider = ({ children }: { children: React.ReactNode }) => {
    const [selectedShow, setSelectedShow] = useState<string>("reconnect");
    const [seatConfig, setSeatConfig] = useState<Seat>({
        name: 'Default Name',
        color: '#00BFFF',
        category: 'default',
        gender: 'both',
    });

    const [seatGenerateConfig, setSeatGenerateConfig] = useState<SeatGenerate>({
        start: '',
        cols: 0,
        rows: 0,
        group: 'A',
        number_start: 1,
        category: 'default',
        gender: 'both',
        color: '#00BFFF',
        margin: 10,
    });

    const [selectedIds, setSelectedIds] = useState<string[]>([]);

    const toggleSelectShow = async (show: string) => {
        setSelectedShow(show);
        localStorage.setItem("selectedShow", show);
        const seats = await findSeats(show);
        setSeats(seats);
        setSelectedIds([]);
    };

    const [seats, setSeats] = useState<Seat[]>([]);

    const toggleSeat = (position: string) => {
        setSeats((prev) => {
            const exists = prev.find((s) => s.position === position);
            let newSeats: Seat[];

            if (exists) {
                const id = `${selectedShow}-${position}`;
                newSeats = prev.filter((s) => s.position !== position);
                deleteSeat(id).then(() => toast.success(`Berhasil hapus kursi`)).catch((err) =>
                    toast.error(`Gagal hapus kursi: ${err}`)
                );
            } else {
                const id = `${selectedShow}-${position}`;
                const newSeat: Seat = { ...seatConfig, id: id, position: position, show_id: selectedShow, event_id: selectedShow };
                newSeats = [...prev, newSeat];
                postSeat(newSeat).catch((err) =>
                    toast.error(`Gagal hapus kursi: ${err}`)
                );
            }

            return newSeats;
        });
    };

    const removeSeat = (position: string) => {
        setSeats((prev) => {
            const exists = prev.find((s) => s.position === position);
            let newSeats = [...prev];

            if (exists) {
                const id = `${selectedShow}-${position}`;
                newSeats = prev.filter((s) => s.position !== position);
                deleteSeat(id).catch((err) =>
                    toast.error(`Gagal hapus kursi: ${err}`)
                );
            }
            return newSeats;
        });
    };

    const createSeat = (position: string, name?: string) => {
        setSeats((prev) => {
            const id = `${selectedShow}-${position}`;
            const newSeat: Seat = { ...seatConfig, id: id, name, position: position, show_id: selectedShow, event_id: selectedShow };
            const newSeats = [...prev, newSeat];
            postSeat(newSeat).catch((err) =>
                toast.error(`Gagal hapus kursi: ${err}`)
            );
            return newSeats;
        });
    };

    const createSeatWithPos = (position: string, name: string, x: number, y: number, overrides?: Partial<Seat>) => {
        setSeats((prev) => {
            const id = `${selectedShow}-${position}`;
            const newSeat: Seat = { ...seatConfig, ...overrides, id: id, name, position: position, show_id: selectedShow, event_id: selectedShow, x, y, rotation: 0 };
            const newSeats = [...prev, newSeat];
            postSeat(newSeat).catch((err) =>
                toast.error(`Gagal hapus kursi: ${err}`)
            );
            return newSeats;
        });
    };

    const updateSeat = () => {
        putSeat(seatConfig.id ?? '', seatConfig).then(() => {
            setSeats((prevSeats) =>
                prevSeats.map((seat) =>
                    seat.id === seatConfig.id ? { ...seatConfig } : seat
                )
            );
            toast.success(`Success update`);
        }).catch((err) =>
            toast.error(`Gagal hapus kursi: ${err}`)
        );
    };

    const updateSeatCoordinates = (id: string, x: number, y: number, rotation: number, width?: number, height?: number) => {
        setSeats((prevSeats) => {
            const seat = prevSeats.find(s => s.id === id);
            if (!seat) return prevSeats;
            
            const updatedSeat = { ...seat, x, y, rotation, width: width ?? seat.width, height: height ?? seat.height };
            
            putSeat(id, updatedSeat).catch((err) => 
                console.error(`Failed to save coordinates for ${id}:`, err)
            );

            return prevSeats.map(s => s.id === id ? updatedSeat : s);
        });
    };

    const updateMultipleSeatCoordinates = (updates: { id: string, x: number, y: number, rotation: number, width?: number, height?: number }[]) => {
        setSeats((prevSeats) => {
            const updatedSeats = [...prevSeats];
            const seatsToSave: Seat[] = [];

            updates.forEach(update => {
                const index = updatedSeats.findIndex(s => s.id === update.id);
                if (index !== -1) {
                    const seat = updatedSeats[index];
                    const updatedSeat = { 
                        ...seat, 
                        x: update.x, 
                        y: update.y, 
                        rotation: update.rotation, 
                        width: update.width ?? seat.width, 
                        height: update.height ?? seat.height 
                    };
                    updatedSeats[index] = updatedSeat;
                    seatsToSave.push(updatedSeat);
                }
            });

            if (seatsToSave.length > 0) {
                import('@/api/seatApi').then(({ saveBulkLayout }) => {
                    saveBulkLayout(seatsToSave).catch(err => {
                        console.error("Failed to save bulk coordinates", err);
                    });
                });
            }

            return updatedSeats;
        });
    };

    const createStage = () => {
        setSeats((prev) => {
            const uniqueHash = Math.random().toString(36).substring(2, 8);
            const position = `stage-${Date.now()}-${uniqueHash}`;
            const id = `${selectedShow}-${position}`;
            
            // Calculate center
            const canvasCenterX = (window.innerWidth * 0.75) / 2;
            const canvasCenterY = (window.innerHeight * 0.8) / 2;
            
            // Snap to 10px grid
            const startX = Math.round((canvasCenterX - 150) / 10) * 10;
            const startY = Math.round((canvasCenterY - 50) / 10) * 10;

            const newSeat: Seat = { 
                id, 
                position, 
                name: "STAGE", 
                category: "STAGE", 
                color: "#1e293b", // Slate 800 dark color
                show_id: selectedShow, 
                event_id: selectedShow, 
                x: startX, 
                y: startY, 
                rotation: 0,
                width: 300,
                height: 100
            };
            
            const newSeats = [...prev, newSeat];
            postSeat(newSeat).catch((err) =>
                toast.error(`Gagal membuat stage: ${err}`)
            );
            
            // Auto select
            setTimeout(() => setSelectedIds([id]), 100);
            return newSeats;
        });
    };

    const updateSelectedSeatsProperties = (color: string, category: string, prefix?: string, rotation?: number) => {
        if (selectedIds.length === 0) return;

        setSeats((prevSeats) => {
            const updatedSeats = prevSeats.map((seat, index) => {
                if (selectedIds.includes(seat.id!)) {
                    const newSeat = { ...seat, color, category };
                    if (rotation !== undefined) {
                        newSeat.rotation = rotation;
                    }
                    if (prefix) {
                        newSeat.name = `${prefix}${index + 1}`;
                    }
                    putSeat(seat.id!, newSeat).catch((err) => 
                        console.error(`Failed to save bulk update for ${seat.id}:`, err)
                    );
                    return newSeat;
                }
                return seat;
            });
            toast.success(`Berhasil update ${selectedIds.length} kursi`);
            return updatedSeats;
        });
    };

    const deleteSelectedSeats = () => {
        if (selectedIds.length === 0) return;

        selectedIds.forEach(id => {
            deleteSeat(id).catch((err) => 
                console.error(`Failed to delete seat ${id}:`, err)
            );
        });

        setSeats(prev => prev.filter(s => !selectedIds.includes(s.id!)));
        setSelectedIds([]);
        toast.success(`Berhasil hapus kursi`);
    };

    useEffect(() => {
        const fetchseats = async () => {
            const fetchData = async () => {
                try {
                    const seats = await findSeats(selectedShow);
                    setSeats(seats);
                } catch (err) {
                    toast.error(`Failed to fetch selected seats: ${err}`);
                }
            };

            fetchData();
        };

        fetchseats();
    }, [setSeats, selectedShow]);

    const countByCategory = seats.reduce((acc, seat) => {
        if (seat.category === 'STAGE') return acc;
        
        const genderLabel = seat.gender ? seat.gender.toLowerCase() : 'both';
        const key = `${seat.category}|${genderLabel}`;

        if (!acc[key]) {
            acc[key] = {
                total: 0,
                color: seat.color,
                category: seat.category,
                gender: genderLabel
            };
        }

        acc[key].total += 1;
        return acc;
    }, {} as Record<string, { total: number; color: string; category: string; gender: string }>);

    function generateReset() {
        // dummy function as it's removed from UI
    }

    function generateSeats() {
        if (
            seatGenerateConfig.cols <= 0 ||
            seatGenerateConfig.rows <= 0
        ) {
            toast.error("Isi jumlah baris dan kolom");
            return;
        }

        const rows = Number(seatGenerateConfig.rows);
        const cols = Number(seatGenerateConfig.cols);
        const group = seatGenerateConfig.group || '';
        const margin = Number(seatGenerateConfig.margin ?? 10);
        let seatNumber = seatGenerateConfig.number_start ?? 1;

        // Base seat size is 50, distance between centers is 50 + margin
        const spacing = 50 + margin;

        // Calculate center of screen for spawning (approximate 800x600 canvas)
        const canvasCenterX = (window.innerWidth * 0.75) / 2;
        const canvasCenterY = (window.innerHeight * 0.8) / 2;
        const blockWidth = cols * spacing;
        const blockHeight = rows * spacing;
        
        // Snap to 10px grid
        const startX = Math.round((canvasCenterX - (blockWidth / 2)) / 10) * 10;
        const startY = Math.round((canvasCenterY - (blockHeight / 2)) / 10) * 10;

        let newIds: string[] = [];

        console.log(`Generating block: ${rows}x${cols} at center`);
        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
                // Generate a unique ID based on timestamp and random string
                const uniqueHash = Math.random().toString(36).substring(2, 8);
                const position = `${Date.now()}-${uniqueHash}`;
                const formattedNumber = String(seatNumber);
                const name = `${group}${formattedNumber}`;
                seatNumber++;

                const visualX = startX + (c * spacing);
                const visualY = startY + (r * spacing);

                createSeatWithPos(position, name, visualX, visualY, { 
                    category: seatGenerateConfig.category || 'default', 
                    gender: seatGenerateConfig.gender || 'both',
                    color: seatGenerateConfig.color || '#00BFFF' 
                });
                newIds.push(`${selectedShow}-${position}`);
            }
        }
        
        // Auto select the newly generated block
        setTimeout(() => setSelectedIds(newIds), 100);
    }

    return (
        <SeatsContext.Provider
            value={{
                selectedShow,
                setSelectedShow,
                toggleSelectShow,
                seatConfig,
                setSeatConfig,
                seatGenerateConfig,
                setSeatGenerateConfig,
                seats,
                setSeats,
                toggleSeat,
                updateSeat,
                updateSeatCoordinates,
                updateMultipleSeatCoordinates,
                selectedIds,
                setSelectedIds,
                updateSelectedSeatsProperties,
                deleteSelectedSeats,
                countByCategory,
                removeSeat,
                createSeat,
                createStage,
                generateReset,
                generateSeats,
            }}
        >
            {children}
        </SeatsContext.Provider>
    );
};
