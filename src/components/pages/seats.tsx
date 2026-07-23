import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import {
    SidebarInset,
    SidebarProvider,
} from "@/components/ui/sidebar"

import SeatVirtualizerFixed from "../seats-viltualizer-fixed"
import { SeatsProvider } from "@/context/SeatsProvider"
import { Button } from "../ui/button"
import { IconLayout } from "@tabler/icons-react"
import { useNavigate } from "react-router-dom"
import { SeatCountByCateogry } from "../seat-count-by-category"
import { CELL_SIZE, COLS, ROWS } from "@/config/config"
import { SelectShowSeat } from "../select-show-seats"

export default function SeatsPage() {
    const navigate = useNavigate();
    return (
        <SidebarProvider
            style={
                {
                    "--sidebar-width": "calc(var(--spacing) * 72)",
                    "--header-height": "calc(var(--spacing) * 12)",
                } as React.CSSProperties
            }
        >
            <SeatsProvider>
                <AppSidebar variant="inset" />
                <SidebarInset>
                    <SiteHeader title="Seats Layout" />
                    <div className="flex flex-1 flex-col">
                        <div className="@container/main flex flex-1 flex-col gap-2">
                            <div className="flex flex-col gap-4 p-4">
                                <div className="neo-surface-sm flex flex-col gap-3 bg-neo-purple p-4 sm:flex-row sm:items-center">
                                    <SelectShowSeat />
                                    <Button onClick={() => navigate("/seats-layout")}><IconLayout /> Draw Layout</Button>
                                </div>
                                <SeatCountByCateogry />
                                <SeatVirtualizerFixed cols={COLS} rows={ROWS} seatSize={CELL_SIZE} />

                            </div>
                        </div>
                    </div>
                </SidebarInset>
            </SeatsProvider>
        </SidebarProvider>
    )
}
