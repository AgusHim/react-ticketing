import * as React from "react"
import { Input } from "./ui/input"
import { useSeats } from "@/context/SeatsContext";
import { Label } from "./ui/label";
import { SelectShowSeat } from "./select-show-seats"
import { Button } from "./ui/button";

export function SeatCreationTools() {
    const { seatGenerateConfig, setSeatGenerateConfig, generateSeats, createStage } = useSeats();

    const handleSeatGenerateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setSeatGenerateConfig({
            ...seatGenerateConfig,
            [name]: value,
        });
    };

    return (
        <div className="flex flex-col p-4 h-full overflow-y-auto" style={{ scrollbarWidth: 'thin', scrollbarColor: '#333 transparent' }}>
            <h1 className="font-bold text-lg mb-4 text-white tracking-tight">Project Setup</h1>
            <div className="mb-6">
                <Label className="text-neutral-400 text-[10px] uppercase tracking-wider font-semibold mb-2 block">Pilih Event (Show)</Label>
                <div className="[&_button]:bg-white/[0.06] [&_button]:border-white/[0.08] [&_button]:text-neutral-300 [&_button]:rounded-xl [&_button]:text-xs">
                    <SelectShowSeat />
                </div>
            </div>

            <hr className="border-white/[0.06] mb-6" />

            <h1 className="font-bold text-lg mb-2 text-white tracking-tight">Generate Block</h1>
            <p className="text-[11px] text-neutral-500 mb-5 leading-relaxed">Tambahkan sekumpulan kursi sekaligus di tengah layar.</p>
            
            <div className="space-y-4">
                <div>
                    <Label className="text-[11px] text-neutral-400 font-medium">Jumlah Kolom (Horizontal)</Label>
                    <Input 
                        name="cols" 
                        type="number" 
                        min="1"
                        placeholder="Contoh: 10" 
                        value={seatGenerateConfig.cols || ''}
                        onChange={handleSeatGenerateChange} 
                        className="bg-[#141414] border-white/[0.08] text-white mt-1.5 rounded-xl text-xs placeholder:text-neutral-600 focus-visible:ring-1 focus-visible:ring-emerald-500/50"
                    />
                </div>
                <div>
                    <Label className="text-[11px] text-neutral-400 font-medium">Jumlah Baris (Vertikal)</Label>
                    <Input 
                        name="rows" 
                        type="number" 
                        min="1"
                        placeholder="Contoh: 5" 
                        value={seatGenerateConfig.rows || ''}
                        onChange={handleSeatGenerateChange} 
                        className="bg-[#141414] border-white/[0.08] text-white mt-1.5 rounded-xl text-xs placeholder:text-neutral-600 focus-visible:ring-1 focus-visible:ring-emerald-500/50"
                    />
                </div>
                <div>
                    <Label className="text-[11px] text-neutral-400 font-medium">Awalan Nama (Prefix)</Label>
                    <Input 
                        name="group" 
                        type="text" 
                        placeholder="Contoh: VIP-" 
                        value={seatGenerateConfig.group}
                        onChange={handleSeatGenerateChange} 
                        className="bg-[#141414] border-white/[0.08] text-white mt-1.5 rounded-xl text-xs placeholder:text-neutral-600 focus-visible:ring-1 focus-visible:ring-emerald-500/50"
                    />
                </div>
                <div>
                    <Label className="text-[11px] text-neutral-400 font-medium">Mulai dari Angka</Label>
                    <Input 
                        name="number_start" 
                        type="number" 
                        min="1"
                        placeholder="Contoh: 1" 
                        value={seatGenerateConfig.number_start || ''}
                        onChange={handleSeatGenerateChange} 
                        className="bg-[#141414] border-white/[0.08] text-white mt-1.5 rounded-xl text-xs placeholder:text-neutral-600 focus-visible:ring-1 focus-visible:ring-emerald-500/50"
                    />
                </div>
                <div>
                    <Label className="text-[11px] text-neutral-400 font-medium">Jarak / Margin (px)</Label>
                    <Input 
                        name="margin" 
                        type="number" 
                        min="0"
                        step="10"
                        placeholder="Contoh: 10" 
                        value={seatGenerateConfig.margin ?? ''}
                        onChange={handleSeatGenerateChange} 
                        className="bg-[#141414] border-white/[0.08] text-white mt-1.5 rounded-xl text-xs placeholder:text-neutral-600 focus-visible:ring-1 focus-visible:ring-emerald-500/50"
                    />
                </div>
                <div>
                    <Label className="text-[11px] text-neutral-400 font-medium">Kategori</Label>
                    <Input 
                        name="category" 
                        type="text" 
                        placeholder="Contoh: VIP" 
                        value={seatGenerateConfig.category || ''}
                        onChange={handleSeatGenerateChange} 
                        className="bg-[#141414] border-white/[0.08] text-white mt-1.5 rounded-xl text-xs placeholder:text-neutral-600 focus-visible:ring-1 focus-visible:ring-emerald-500/50"
                    />
                </div>
                <div>
                    <Label className="text-[11px] text-neutral-400 font-medium">Gender</Label>
                    <select
                        name="gender"
                        value={seatGenerateConfig.gender || 'both'}
                        onChange={(e: any) => handleSeatGenerateChange(e)}
                        className="w-full bg-[#141414] border border-white/[0.08] text-white rounded-xl mt-1.5 h-9 px-3 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500/50"
                    >
                        <option value="both">Both (Semua Gender)</option>
                        <option value="male">Male (Pria)</option>
                        <option value="female">Female (Wanita)</option>
                    </select>
                </div>
                <div>
                    <Label className="text-[11px] text-neutral-400 font-medium">Warna Block</Label>
                    <div className="flex gap-2 mt-1.5">
                        <Input 
                            name="color" 
                            type="color" 
                            value={seatGenerateConfig.color || '#10B981'}
                            onChange={handleSeatGenerateChange} 
                            className="bg-[#141414] border-white/[0.08] p-1 w-12 h-9 rounded-xl cursor-pointer"
                        />
                        <Input 
                            name="color" 
                            type="text" 
                            value={seatGenerateConfig.color || '#10B981'}
                            onChange={handleSeatGenerateChange} 
                            className="bg-[#141414] border-white/[0.08] text-white flex-1 rounded-xl text-xs font-mono"
                        />
                    </div>
                </div>
                <Button 
                    onClick={generateSeats} 
                    className="w-full mt-2 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-semibold rounded-xl h-9 transition-colors shadow-lg shadow-emerald-500/20"
                >
                    + Generate Block Kursi
                </Button>
            </div>

            <hr className="border-white/[0.06] my-6" />

            <h1 className="font-bold text-lg mb-2 text-white tracking-tight">Decoration Tools</h1>
            <p className="text-[11px] text-neutral-500 mb-4 leading-relaxed">Tambahkan elemen dekorasi seperti panggung yang tidak bisa di-klik pembeli.</p>
            <Button 
                onClick={createStage} 
                variant="outline" 
                className="w-full bg-white/[0.04] border-white/[0.08] text-neutral-300 hover:text-white hover:bg-white/[0.08] text-xs rounded-xl h-9 transition-colors"
            >
                + Generate Stage (Panggung)
            </Button>
        </div>
    )
}
