"use client"
import { useSeats } from "@/context/SeatsContext";

export function SeatCountByCateogry() {
    const { countByCategory } = useSeats();
    if (!countByCategory) return null;

    const totalSeats = Object.entries(countByCategory)
        .filter(([key]) => key !== "STAGE")
        .reduce((acc, [, value]) => acc + value.total, 0);

    if (countByCategory) {
        return (<div className="flex flex-row justify-start m-5 gap-4 flex-wrap bg-slate-900/50 p-3 rounded-xl border border-slate-800">
            <div className="flex flex-row items-center gap-2 font-bold text-white bg-slate-800 px-3 py-1 rounded-lg">
                <span>Total Kursi:</span>
                <span className="text-primary text-white">{totalSeats}</span>
            </div>
            {Object.entries(countByCategory).map(([key, { total, color, category, gender }]) => (
                <div key={key} className="flex flex-row items-center gap-2 bg-slate-800/60 px-3 py-1.5 rounded-lg border border-slate-700/50">
                    <span className="w-3 h-3 rounded-full shadow-sm" style={{ backgroundColor: color }}></span>
                    <div className="flex items-center gap-1.5 text-sm text-slate-200">
                        <span className="font-semibold">{category}</span>
                        {gender !== 'both' && (
                            <span className={`text-[10px] px-1.5 py-0.5 rounded uppercase font-bold ${gender === 'male' ? 'bg-blue-500/20 text-blue-400' : 'bg-pink-500/20 text-pink-400'
                                }`}>
                                {gender === 'male' ? 'L' : 'P'}
                            </span>
                        )}
                        <span className="text-slate-400 mx-1">•</span>
                        <span className="font-mono font-medium">{total}</span>
                    </div>
                </div>
            ))}
        </div>)
    } else {
        return <></>
    }
}