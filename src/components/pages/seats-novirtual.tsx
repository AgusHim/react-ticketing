import { useEffect, useRef } from "react";
import { SeatGridNovirtual } from "../seat-grid-novirtual"
import { Input } from "../ui/input";
import { CELL_SIZE, COLS, ROWS } from "@/config/config";

export default function SeatsNovirtualPage() {
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (scrollRef.current) {
            const container = scrollRef.current;
            container.scrollLeft = container.scrollWidth / 2 - container.clientWidth / 2;
        }
    }, []);

    return (
        <div className="neo-dots flex min-h-screen flex-col items-center gap-4 p-5">
            <div className="neo-surface-sm flex flex-row justify-start gap-3 bg-neo-purple p-4">
                <Input type="category" placeholder="Kategori Kursi" />
                <Input type="color" placeholder="Warna Kursi" />
            </div>
            {/* Zoom Pan Area */}
            <SeatGridNovirtual cols={COLS} rows={ROWS} seatSize={CELL_SIZE} />
        </div>
    )
}
