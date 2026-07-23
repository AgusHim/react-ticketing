"use client"
import { useSeats } from "@/context/SeatsContext";

export function SeatCountByCateogry() {
    const { countByCategory } = useSeats();
    if (!countByCategory) return null;

    const totalSeats = Object.entries(countByCategory)
        .filter(([key]) => key !== "STAGE")
        .reduce((acc, [, value]) => acc + value.total, 0);

    if (countByCategory) {
        return (<div className="neo-surface-sm flex flex-row justify-start gap-3 flex-wrap bg-neo-yellow p-3">
            <div className="flex flex-row items-center gap-2 rounded-lg border-2 border-neo-border bg-white px-3 py-1 font-extrabold text-foreground">
                <span>Total Kursi:</span>
                <span>{totalSeats}</span>
            </div>
            {Object.entries(countByCategory).map(([key, { total, color, category, gender }]) => (
                <div key={key} className="flex flex-row items-center gap-2 rounded-lg border-2 border-neo-border bg-white px-3 py-1.5">
                    <span className="h-3 w-3 rounded-full border border-neo-border" style={{ backgroundColor: color }}></span>
                    <div className="flex items-center gap-1.5 text-sm text-foreground">
                        <span className="font-semibold">{category}</span>
                        {gender !== 'both' && (
                            <span className={`text-[10px] px-1.5 py-0.5 rounded uppercase font-bold ${gender === 'male' ? 'bg-blue-500/20 text-blue-400' : 'bg-pink-500/20 text-pink-400'
                                }`}>
                                {gender === 'male' ? 'L' : 'P'}
                            </span>
                        )}
                        <span className="mx-1 text-muted-foreground">•</span>
                        <span className="font-mono font-medium">{total}</span>
                    </div>
                </div>
            ))}
        </div>)
    } else {
        return <></>
    }
}
