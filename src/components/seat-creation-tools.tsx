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
        <div className="flex flex-col p-4 bg-slate-900 border-r border-slate-800 h-full overflow-y-auto">
            <h1 className="font-black text-xl mb-4 text-white">Project Setup</h1>
            <div className="mb-6">
                <Label className="text-slate-400 mb-2 block">Pilih Event (Show)</Label>
                <SelectShowSeat />
            </div>

            <hr className="border-slate-800 mb-6" />

            <h1 className="font-black text-xl mb-4 text-white">Generate Block</h1>
            <p className="text-xs text-slate-400 mb-4">Tambahkan sekumpulan kursi sekaligus di tengah layar.</p>
            
            <div className="space-y-4">
                <div>
                    <Label className="text-slate-300">Jumlah Kolom (Horizontal)</Label>
                    <Input 
                        name="cols" 
                        type="number" 
                        min="1"
                        placeholder="Contoh: 10" 
                        value={seatGenerateConfig.cols || ''}
                        onChange={handleSeatGenerateChange} 
                        className="bg-slate-800 border-slate-700 text-white mt-1"
                    />
                </div>
                <div>
                    <Label className="text-slate-300">Jumlah Baris (Vertikal)</Label>
                    <Input 
                        name="rows" 
                        type="number" 
                        min="1"
                        placeholder="Contoh: 5" 
                        value={seatGenerateConfig.rows || ''}
                        onChange={handleSeatGenerateChange} 
                        className="bg-slate-800 border-slate-700 text-white mt-1"
                    />
                </div>
                <div>
                    <Label className="text-slate-300">Awalan Nama (Prefix)</Label>
                    <Input 
                        name="group" 
                        type="text" 
                        placeholder="Contoh: VIP-" 
                        value={seatGenerateConfig.group}
                        onChange={handleSeatGenerateChange} 
                        className="bg-slate-800 border-slate-700 text-white mt-1"
                    />
                </div>
                <div>
                    <Label className="text-slate-300">Mulai dari Angka</Label>
                    <Input 
                        name="number_start" 
                        type="number" 
                        min="1"
                        placeholder="Contoh: 1" 
                        value={seatGenerateConfig.number_start || ''}
                        onChange={handleSeatGenerateChange} 
                        className="bg-slate-800 border-slate-700 text-white mt-1"
                    />
                </div>
                <div>
                    <Label className="text-slate-300">Jarak / Margin (px)</Label>
                    <Input 
                        name="margin" 
                        type="number" 
                        min="0"
                        step="10"
                        placeholder="Contoh: 10" 
                        value={seatGenerateConfig.margin ?? ''}
                        onChange={handleSeatGenerateChange} 
                        className="bg-slate-800 border-slate-700 text-white mt-1"
                    />
                </div>
                <div>
                    <Label className="text-slate-300">Kategori</Label>
                    <Input 
                        name="category" 
                        type="text" 
                        placeholder="Contoh: VIP" 
                        value={seatGenerateConfig.category || ''}
                        onChange={handleSeatGenerateChange} 
                        className="bg-slate-800 border-slate-700 text-white mt-1"
                    />
                </div>
                <div>
                    <Label className="text-slate-300">Gender</Label>
                    <select
                        name="gender"
                        value={seatGenerateConfig.gender || 'both'}
                        onChange={(e: any) => handleSeatGenerateChange(e)}
                        className="w-full bg-slate-800 border border-slate-700 text-white rounded-md mt-1 h-10 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                    >
                        <option value="both">Both (Semua Gender)</option>
                        <option value="male">Male (Pria)</option>
                        <option value="female">Female (Wanita)</option>
                    </select>
                </div>
                <div>
                    <Label className="text-slate-300">Warna Block</Label>
                    <div className="flex gap-2 mt-1">
                        <Input 
                            name="color" 
                            type="color" 
                            value={seatGenerateConfig.color || '#00BFFF'}
                            onChange={handleSeatGenerateChange} 
                            className="bg-slate-800 border-slate-700 p-1 w-12 h-10 cursor-pointer"
                        />
                        <Input 
                            name="color" 
                            type="text" 
                            value={seatGenerateConfig.color || '#00BFFF'}
                            onChange={handleSeatGenerateChange} 
                            className="bg-slate-800 border-slate-700 text-white flex-1"
                        />
                    </div>
                </div>
                <Button onClick={generateSeats} className="w-full mt-4 bg-primary text-white hover:bg-primary/90">
                    + Generate Block Kursi
                </Button>
            </div>

            <hr className="border-slate-800 my-6" />

            <h1 className="font-black text-xl mb-4 text-white">Decoration Tools</h1>
            <p className="text-xs text-slate-400 mb-4">Tambahkan elemen dekorasi seperti panggung yang tidak bisa di-klik pembeli.</p>
            <Button onClick={createStage} variant="outline" className="w-full border-slate-700 bg-slate-800 text-white hover:bg-slate-700">
                + Generate Stage (Panggung)
            </Button>
        </div>
    )
}
