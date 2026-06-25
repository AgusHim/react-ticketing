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
    const [color, setColor] = React.useState("#10B981");
    const [category, setCategory] = React.useState("Reguler");
    const [prefix, setPrefix] = React.useState("");
    const [rotation, setRotation] = React.useState(0);

    // When selection changes, try to populate form with the first selected seat's data
    React.useEffect(() => {
        if (selectedIds.length > 0) {
            const firstSeat = seats.find(s => s.id === selectedIds[0]);
            if (firstSeat) {
                setColor(firstSeat.color || "#10B981");
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
            <div className="flex flex-col items-center justify-center p-6 h-full text-center">
                <div className="w-16 h-16 rounded-2xl bg-white/[0.04] border border-white/[0.06] flex items-center justify-center mb-4">
                    <svg className="w-8 h-8 text-neutral-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
                    </svg>
                </div>
                <h2 className="text-[13px] font-semibold text-neutral-300 mb-1.5 tracking-tight">Tidak ada yang dipilih</h2>
                <p className="text-[11px] text-neutral-500 leading-relaxed">Klik sebuah kursi di kanvas untuk mengedit propertinya.</p>
                <p className="text-[10px] text-neutral-600 mt-3 font-medium bg-white/[0.03] px-2 py-1 rounded-md border border-white/[0.04]">(Tahan Shift untuk pilih banyak sekaligus)</p>
            </div>
        );
    }

    const handleApply = () => {
        updateSelectedSeatsProperties(color, category, prefix, rotation);
    };

    return (
        <div className="flex flex-col p-4 h-full overflow-y-auto" style={{ scrollbarWidth: 'thin', scrollbarColor: '#333 transparent' }}>
            <h1 className="font-bold text-lg mb-2 text-white tracking-tight">Properties</h1>
            <p className="text-[11px] text-emerald-400 mb-6 bg-emerald-500/10 px-3 py-1.5 rounded-lg border border-emerald-500/20 inline-block font-medium">
                {selectedIds.length} kursi terpilih
            </p>

            <div className="space-y-5">
                {/* Prefix Rename (only useful for bulk or renaming) */}
                <div>
                    <Label className="text-[11px] text-neutral-400 font-medium">Ubah Penamaan (Prefix)</Label>
                    <p className="text-[10px] text-neutral-500 mb-1.5 mt-0.5">Kosongkan jika tidak ingin mengubah nomor kursi.</p>
                    <Input 
                        value={prefix}
                        onChange={(e) => setPrefix(e.target.value)}
                        placeholder="Cth: VIP-"
                        className="bg-[#141414] border-white/[0.08] text-white rounded-xl text-xs placeholder:text-neutral-600 focus-visible:ring-1 focus-visible:ring-emerald-500/50 h-9"
                    />
                </div>

                {/* Category */}
                <div>
                    <Label className="text-[11px] text-neutral-400 font-medium">Kategori</Label>
                    <Input 
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                        placeholder="Kategori Kursi"
                        className="bg-[#141414] border-white/[0.08] text-white mt-1.5 rounded-xl text-xs placeholder:text-neutral-600 focus-visible:ring-1 focus-visible:ring-emerald-500/50 h-9"
                    />
                </div>

                {/* Rotation */}
                <div>
                    <Label className="text-[11px] text-neutral-400 font-medium">Rotasi Derajat (0-360)</Label>
                    <Input 
                        type="number"
                        value={rotation}
                        onChange={(e) => setRotation(parseFloat(e.target.value) || 0)}
                        placeholder="0"
                        className="bg-[#141414] border-white/[0.08] text-white mt-1.5 rounded-xl text-xs placeholder:text-neutral-600 focus-visible:ring-1 focus-visible:ring-emerald-500/50 h-9"
                    />
                </div>

                {/* Color Picker */}
                <div>
                    <Label className="text-[11px] text-neutral-400 font-medium block mb-2">Warna (Color)</Label>
                    <div className="flex items-center gap-3 mb-4">
                        <div 
                            className="w-10 h-10 rounded-xl border border-white/[0.08] shadow-sm shrink-0" 
                            style={{ backgroundColor: color }} 
                        />
                        <Input 
                            type="text" 
                            value={color}
                            onChange={(e) => setColor(e.target.value)}
                            className="bg-[#141414] border-white/[0.08] text-white font-mono uppercase rounded-xl text-xs focus-visible:ring-1 focus-visible:ring-emerald-500/50 h-9"
                        />
                    </div>
                    
                    {/* Modern Color Palette Presets */}
                    <Label className="text-[10px] text-neutral-500 uppercase tracking-wider font-semibold block mb-2.5">Preset Warna</Label>
                    <div className="grid grid-cols-4 gap-2.5">
                        {MODERN_COLORS.map((c) => (
                            <button
                                key={c.hex}
                                onClick={() => setColor(c.hex)}
                                title={c.label}
                                className={`w-8 h-8 rounded-full border-2 transition-transform hover:scale-110 ${color === c.hex ? 'border-white scale-110 shadow-[0_0_10px_rgba(255,255,255,0.3)]' : 'border-transparent shadow-sm'}`}
                                style={{ backgroundColor: c.hex }}
                            />
                        ))}
                    </div>
                </div>

                <div className="pt-5 mt-2 border-t border-white/[0.06] flex flex-col gap-2.5">
                    <Button 
                        onClick={handleApply} 
                        className="w-full bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-xs font-semibold h-9 shadow-lg shadow-emerald-500/20 transition-all"
                    >
                        Simpan Perubahan
                    </Button>
                    <Button 
                        onClick={deleteSelectedSeats} 
                        variant="destructive" 
                        className="w-full rounded-xl text-xs font-semibold h-9 bg-red-500/10 text-red-500 hover:bg-red-500/20 hover:text-red-400 border border-red-500/20 transition-all"
                    >
                        Hapus Kursi Terpilih
                    </Button>
                </div>
            </div>
        </div>
    )
}
