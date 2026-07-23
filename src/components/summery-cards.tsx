import { getDashboardData } from "@/api/dashboard"
import {
  Card,
  CardContent,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import type { BookedSeatsSummary } from "@/types/dashboard"
import { useEffect, useState } from "react"
import { TicketSummaryTable } from "./table-ticket-summary"

export default function SummaryCards() {
  const [data, setData] = useState<BookedSeatsSummary>()

  useEffect(() => {
    const fetchData = async () => {
      const res = await getDashboardData()
      setData(res)
    }

    fetchData()
  }, [])

  if (!data) {
    return (
      <div className="mx-4 neo-surface neo-dots p-10 text-center">
        <p className="font-bold">Belum ada data dashboard.</p>
        <p className="mt-1 text-sm text-muted-foreground">Ringkasan akan muncul setelah data kursi tersedia.</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col">
      <div className="p-4 space-y-6">
        {Object.entries(data.booked_seats).map(([showId, categories]) => (
          <div key={showId} className="space-y-2">
            <h2 className="text-xl font-extrabold capitalize">{showId}</h2>
            <div className="grid gap-5 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
              {Object.entries(categories).map(([category, summary], index) => {
                const percent = Math.round(
                  (summary.booked_seats / summary.total_seats) * 100
                )

                return (
                  <Card
                    key={category}
                    className={`neo-lift ${["bg-neo-yellow", "bg-neo-mint", "bg-neo-pink", "bg-neo-purple"][index % 4]}`}
                  >
                    <CardContent className="space-y-3 p-5">
                      <div className="flex items-center justify-between">
                        <span className="capitalize font-extrabold">{category}</span>
                        <Badge
                          className="text-xs"
                          style={{ backgroundColor: summary.color }}
                        >
                          {summary.booked_seats}/{summary.total_seats}
                        </Badge>
                      </div>
                      <div className="text-4xl font-black">{summary.booked_seats}</div>
                      <p className="text-sm text-muted-foreground">Kursi telah dipesan</p>
                      <Progress value={percent} className="h-2" />
                      <div className="text-xs text-muted-foreground text-right">
                        {percent}% terisi
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </div>
        ))}
      </div>
      <TicketSummaryTable ticketSummary={data.ticket_summary} />
    </div>

  )
}
