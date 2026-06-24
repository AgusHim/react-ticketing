import { SeatGrid } from "../seat-layout-grid"
import { SeatCreationTools } from "../seat-creation-tools";
import { SeatPropertiesPanel } from "../seat-properties-panel";
import { SeatsProvider } from "@/context/SeatsProvider";
import { CELL_SIZE, COLS, ROWS } from "@/config/config";
import { SeatCountByCateogry } from "../seat-count-by-category";

export default function SeatsLayoutPage() {
    return (
        <SeatsProvider>
            {/* Header / Topbar could go here, but we'll use the main layout */}
            <div className="flex h-screen bg-slate-950 overflow-hidden text-slate-200">
                {/* Left Sidebar - Creation Tools (300px) */}
                <div className="w-[300px] shrink-0 z-10 shadow-xl flex flex-col">
                    <SeatCreationTools />
                </div>
                
                {/* Center Canvas - Flex remaining space */}
                <div className="flex-1 relative flex flex-col">
                    <div className="absolute top-4 right-4 z-10 flex gap-2">
                         {/* Snap to grid toggle could go here in future */}
                    </div>
                    
                    <div className="absolute bottom-4 left-4 z-10 pointer-events-none">
                        <div className="pointer-events-auto">
                            <SeatCountByCateogry />
                        </div>
                    </div>
                    {/* The Grid takes full height */}
                    <SeatGrid cols={COLS} rows={ROWS} seatSize={CELL_SIZE} />
                </div>

                {/* Right Sidebar - Properties Panel (300px) */}
                <div className="w-[300px] shrink-0 z-10 shadow-xl">
                    <SeatPropertiesPanel />
                </div>
            </div>
        </SeatsProvider>
    )
}
