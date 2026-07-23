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
            <h1 className="mb-4 text-lg font-extrabold tracking-tight text-foreground">Project Setup</h1>
            <div className="mb-6">
                <Label className="text-neutral-400 text-[10px] uppercase tracking-wider font-semibold mb-2 block">Pilih Event (Show)</Label>
                <div className="[&_button]:bg-white/[0.06] [&_button]:border-white/[0.08] [&_button]:text-neutral-300 [&_button]:rounded-xl [&_button]:text-xs">
                    <SelectShowSeat />
                </div>
            </div>

            <hr className="border-white/[0.06] mb-6" />

            <h1 className="mb-2 text-lg font-extrabold tracking-tight text-foreground">Generate Block</h1>
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
                        className="mt-1.5 text-xs"
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
                        className="mt-1.5 text-xs"
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
                        className="mt-1.5 text-xs"
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
                        className="mt-1.5 text-xs"
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
                        className="mt-1.5 text-xs"
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
                        className="mt-1.5 text-xs"
                    />
                </div>
                <div>
                    <Label className="text-[11px] text-neutral-400 font-medium">Gender</Label>
                    <select
                        name="gender"
                        value={seatGenerateConfig.gender || 'both'}
                        onChange={(e: any) => handleSeatGenerateChange(e)}
                        className="mt-1.5 h-10 w-full rounded-xl border-2 border-neo-border bg-white px-3 text-xs font-bold focus:outline-none focus:ring-4 focus:ring-neo-purple-solid/30"
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
                            className="flex-1 text-xs font-mono"
                        />
                    </div>
                </div>
                <Button 
                    onClick={generateSeats} 
                    className="mt-2 h-10 w-full bg-neo-yellow-solid text-xs"
                >
                    + Generate Block Kursi
                </Button>
            </div>

            <hr className="border-white/[0.06] my-6" />

            <h1 className="mb-2 text-lg font-extrabold tracking-tight text-foreground">Decoration Tools</h1>
            <p className="text-[11px] text-neutral-500 mb-4 leading-relaxed">Tambahkan elemen dekorasi seperti panggung yang tidak bisa di-klik pembeli.</p>
            <Button 
                onClick={createStage} 
                variant="outline" 
                className="h-10 w-full text-xs"
            >
                + Generate Stage (Panggung)
            </Button>
        </div>
    )
}
