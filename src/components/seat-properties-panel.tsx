import * as React from "react"
import { Input } from "./ui/input"
import { useSeats } from "@/context/SeatsContext";
import { Label } from "./ui/label";
import { Button } from "./ui/button";

const MODERN_COLORS = [
    { label: "VIP Gold", hex: "#F59E0B" },
    { label: "VVIP Red", hex: "#EF4444" },
    { label: "Reguler Blue", hex: "#3B82F6" },
    { label: "Balcony Teal", hex: "#14B8A6" },
    { label: "Festival Green", hex: "#10B981" },
    { label: "Disabled Pink", hex: "#EC4899" },
    { label: "Staff Grey", hex: "#6B7280" },
    { label: "Stage Black", hex: "#000000" },
];

export function SeatPropertiesPanel() {
    const { selectedIds, updateSelectedSeatsProperties, deleteSelectedSeats, seats } = useSeats();

    // Default state for the form
    const [color, setColor] = React.useState("#3B82F6");
    const [category, setCategory] = React.useState("Reguler");
    const [prefix, setPrefix] = React.useState("");
    const [rotation, setRotation] = React.useState(0);

    // When selection changes, try to populate form with the first selected seat's data
    React.useEffect(() => {
        if (selectedIds.length > 0) {
            const firstSeat = seats.find(s => s.id === selectedIds[0]);
            if (firstSeat) {
                setColor(firstSeat.color || "#3B82F6");
                setCategory(firstSeat.category || "Reguler");
                setRotation(firstSeat.rotation || 0);
                // If it's a single selection, maybe we want to edit its exact name?
                // For bulk, prefix is better. Let's just reset prefix when selection changes.
                setPrefix("");
            }
        }
    }, [selectedIds, seats]);

    if (selectedIds.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center p-6 bg-slate-900 border-l border-slate-800 h-full text-center">
                <div className="w-16 h-16 rounded-full bg-slate-800 flex items-center justify-center mb-4">
                    <svg className="w-8 h-8 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
                    </svg>
                </div>
                <h2 className="text-lg font-semibold text-white mb-2">Tidak ada yang dipilih</h2>
                <p className="text-sm text-slate-400">Klik sebuah kursi di kanvas untuk mengedit propertinya.</p>
                <p className="text-xs text-slate-500 mt-2">(Tahan Shift untuk pilih banyak sekaligus)</p>
            </div>
        );
    }

    const handleApply = () => {
        updateSelectedSeatsProperties(color, category, prefix, rotation);
    };

    return (
        <div className="flex flex-col p-4 bg-slate-900 border-l border-slate-800 h-full overflow-y-auto">
            <h1 className="font-black text-xl mb-2 text-white">Properties</h1>
            <p className="text-sm text-blue-400 mb-6 bg-blue-500/10 p-2 rounded border border-blue-500/20">
                {selectedIds.length} kursi terpilih
            </p>

            <div className="space-y-5">
                {/* Prefix Rename (only useful for bulk or renaming) */}
                <div>
                    <Label className="text-slate-300">Ubah Penamaan (Prefix)</Label>
                    <p className="text-xs text-slate-500 mb-2">Kosongkan jika tidak ingin mengubah nomor kursi.</p>
                    <Input 
                        value={prefix}
                        onChange={(e) => setPrefix(e.target.value)}
                        placeholder="Cth: VIP-"
                        className="bg-slate-800 border-slate-700 text-white"
                    />
                </div>

                {/* Category */}
                <div>
                    <Label className="text-slate-300">Kategori</Label>
                    <Input 
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                        placeholder="Kategori Kursi"
                        className="bg-slate-800 border-slate-700 text-white mt-1"
                    />
                </div>

                {/* Rotation */}
                <div>
                    <Label className="text-slate-300">Rotasi Derajat (0-360)</Label>
                    <Input 
                        type="number"
                        value={rotation}
                        onChange={(e) => setRotation(parseFloat(e.target.value) || 0)}
                        placeholder="0"
                        className="bg-slate-800 border-slate-700 text-white mt-1"
                    />
                </div>

                {/* Color Picker */}
                <div>
                    <Label className="text-slate-300 block mb-2">Warna (Color)</Label>
                    <div className="flex items-center gap-3 mb-3">
                        <div 
                            className="w-10 h-10 rounded border border-slate-600 shadow-sm" 
                            style={{ backgroundColor: color }} 
                        />
                        <Input 
                            type="text" 
                            value={color}
                            onChange={(e) => setColor(e.target.value)}
                            className="bg-slate-800 border-slate-700 text-white font-mono uppercase"
                        />
                    </div>
                    
                    {/* Modern Color Palette Presets */}
                    <Label className="text-xs text-slate-500 block mb-2">Preset Warna</Label>
                    <div className="grid grid-cols-4 gap-2">
                        {MODERN_COLORS.map((c) => (
                            <button
                                key={c.hex}
                                onClick={() => setColor(c.hex)}
                                title={c.label}
                                className={`w-8 h-8 rounded-full border-2 transition-transform hover:scale-110 ${color === c.hex ? 'border-white scale-110' : 'border-transparent'}`}
                                style={{ backgroundColor: c.hex }}
                            />
                        ))}
                    </div>
                </div>

                <div className="pt-4 border-t border-slate-800 flex flex-col gap-3">
                    <Button onClick={handleApply} className="w-full bg-green-600 hover:bg-green-700 text-white">
                        Simpan Perubahan
                    </Button>
                    <Button onClick={deleteSelectedSeats} variant="destructive" className="w-full">
                        Hapus Kursi Terpilih
                    </Button>
                </div>
            </div>
        </div>
    )
}
