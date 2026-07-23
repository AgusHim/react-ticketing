import { SeatGrid } from "../seat-layout-grid"
import { SeatCreationTools } from "../seat-creation-tools";
import { SeatPropertiesPanel } from "../seat-properties-panel";
import { SeatsProvider } from "@/context/SeatsProvider";
import { CELL_SIZE, COLS, ROWS } from "@/config/config";
import { SeatCountByCateogry } from "../seat-count-by-category";
import { IconDeviceDesktop, IconArrowLeft } from "@tabler/icons-react";

export default function SeatsLayoutPage() {
    return (
        <SeatsProvider>
            <div className="neo-dots flex h-screen items-center justify-center p-6 md:hidden">
                <div className="neo-surface max-w-sm bg-white p-7 text-center">
                    <span className="neo-icon-tile mx-auto mb-4 size-14 bg-neo-purple">
                        <IconDeviceDesktop className="size-7" />
                    </span>
                    <h1 className="text-2xl font-black">Gunakan layar lebih besar</h1>
                    <p className="mt-2 text-sm text-muted-foreground">
                        Editor layout membutuhkan tablet landscape atau desktop agar drag, resize, dan multi-select tetap presisi.
                    </p>
                    <a href="/seats" className="mt-5 inline-flex items-center gap-2 rounded-xl border-2 border-neo-border bg-neo-yellow-solid px-4 py-2 text-sm font-extrabold shadow-[3px_3px_0_#1a1a1a]">
                        <IconArrowLeft className="size-4" /> Kembali
                    </a>
                </div>
            </div>
            {/* Header / Topbar could go here, but we'll use the main layout */}
            <div className="neo-workspace hidden h-screen overflow-hidden bg-bg-app text-foreground md:flex">
                {/* Left Sidebar - Creation Tools (300px) */}
                <div className="w-[300px] shrink-0 z-10 flex flex-col border-r-2 border-neo-border bg-bg-sidebar">
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
                <div className="w-[300px] shrink-0 z-10 border-l-2 border-neo-border bg-bg-sidebar">
                    <SeatPropertiesPanel />
                </div>
            </div>
        </SeatsProvider>
    )
}
