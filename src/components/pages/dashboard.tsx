import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar"
import SummaryCards from "../summery-cards"
import { useEffect, useState } from "react"
import { getEvent, updateEvent, type EventModel } from "@/api/event-api"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"

export default function DashboardPage() {
  const [eventData, setEventData] = useState<EventModel | null>(null);
  const [warDate, setWarDate] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    getEvent("default").then((data) => {
      setEventData(data);
      if (data.war_start_date) {
        // Format for datetime-local input: YYYY-MM-DDThh:mm
        const d = new Date(data.war_start_date);
        const tzoffset = (new Date()).getTimezoneOffset() * 60000;
        const localISOTime = (new Date(d.getTime() - tzoffset)).toISOString().slice(0, 16);
        setWarDate(localISOTime);
      }
    }).catch(err => {
      console.error("Failed to fetch event", err);
    });
  }, []);

  const handleSaveWarDate = async () => {
    if (!eventData) return;
    setIsLoading(true);
    try {
      const payloadDate = warDate ? new Date(warDate).toISOString() : undefined;
      const updated = await updateEvent("default", {
        ...eventData,
        war_start_date: payloadDate
      });
      setEventData(updated);
      toast.success("Jadwal War Tiket berhasil disimpan!");
    } catch (err) {
      toast.error("Gagal menyimpan jadwal War Tiket");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "calc(var(--spacing) * 72)",
          "--header-height": "calc(var(--spacing) * 12)",
        } as React.CSSProperties
      }
    >
      <AppSidebar variant="inset" />
      <SidebarInset>
        <SiteHeader title="Dashboard"/>
        <div className="flex flex-1 flex-col">
          <div className="@container/main flex flex-1 flex-col gap-2">
            <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
              <SummaryCards />
              
              <div className="px-4 lg:px-6 mt-4">
                <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border shadow-sm">
                  <h2 className="text-lg font-semibold mb-4">Pengaturan Event</h2>
                  <div className="flex flex-col gap-2 max-w-sm">
                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                      Jadwal Mulai War Tiket
                    </label>
                    <input 
                      type="datetime-local" 
                      className="flex h-10 w-full rounded-md border border-slate-300 bg-transparent px-3 py-2 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:border-transparent dark:border-slate-700 dark:text-slate-50 dark:focus:ring-slate-400 dark:focus:ring-offset-slate-900"
                      value={warDate}
                      onChange={(e) => setWarDate(e.target.value)}
                    />
                    <Button 
                      className="mt-2" 
                      onClick={handleSaveWarDate}
                      disabled={isLoading}
                    >
                      {isLoading ? "Menyimpan..." : "Simpan Pengaturan"}
                    </Button>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
