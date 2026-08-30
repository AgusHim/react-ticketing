import { useEffect, useMemo, useState } from "react"
import { Skeleton } from "@/components/ui/skeleton"
import {
    Bar,
    BarChart,
    CartesianGrid,
    Cell,
    Pie,
    PieChart,
    XAxis,
    YAxis,
} from "recharts"
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import {
    ChartContainer,
    ChartLegend,
    ChartLegendContent,
    ChartTooltip,
    ChartTooltipContent,
    type ChartConfig,
} from "@/components/ui/chart"
import { getDashboardData } from "@/api/dashboard"
import type { BookedSeatsSummary } from "@/types/dashboard"

// Neo-brutalist chart palette (mirrors --chart-1..5 from index.css).
const PALETTE = ["#f5c518", "#2f8f72", "#e85a9e", "#6c63d6", "#ef7b45"]
const CLAIMED_COLOR = "#2f8f72"
const UNCLAIMED_COLOR = "#f5c518"

const KPI_CARDS = [
    "bg-neo-yellow",
    "bg-neo-mint",
    "bg-neo-pink",
    "bg-neo-purple",
] as const

export default function DistributionCharts() {
    const [data, setData] = useState<BookedSeatsSummary>()
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        setIsLoading(true)
        getDashboardData()
            .then(setData)
            .catch((err) => console.error("Failed to fetch dashboard", err))
            .finally(() => setIsLoading(false))
    }, [])

    // --- Ticket distribution: per category ---
    const ticketChart = useMemo(() => {
        const summary = data?.ticket_summary ?? {}
        const rows = Object.entries(summary)
            .map(([category, count], i) => ({
                category,
                count,
                fill: PALETTE[i % PALETTE.length],
            }))
            .sort((a, b) => b.count - a.count)

        const config: ChartConfig = {
            count: { label: "Jumlah Tiket", color: PALETTE[0] },
        }

        return { rows, config }
    }, [data])

    const totalTickets = useMemo(() => {
        const summary = data?.ticket_summary ?? {}
        return Object.values(summary).reduce((acc, c) => acc + c, 0)
    }, [data])

    // --- Goodie bag distribution ---
    const goodie = data?.goodie_bag
    const goodieTotal = goodie?.total ?? 0
    const goodieClaimed = goodie?.claimed ?? 0
    const goodieUnclaimed = goodie?.unclaimed ?? 0
    const claimedPercent =
        goodieTotal > 0 ? Math.round((goodieClaimed / goodieTotal) * 100) : 0

    const donutData = [
        { key: "claimed", name: "Diambil", value: goodieClaimed },
        { key: "unclaimed", name: "Belum Diambil", value: goodieUnclaimed },
    ]
    const donutConfig: ChartConfig = {
        claimed: { label: "Diambil", color: CLAIMED_COLOR },
        unclaimed: { label: "Belum Diambil", color: UNCLAIMED_COLOR },
    }

    const goodieByCategory = useMemo(() => {
        const byCat = data?.goodie_bag?.by_category ?? {}
        return Object.entries(byCat)
            .map(([category, s]) => ({
                category,
                claimed: s.claimed,
                unclaimed: s.unclaimed,
                total: s.total,
            }))
            .sort((a, b) => b.total - a.total)
    }, [data])

    const categoryConfig: ChartConfig = {
        claimed: { label: "Diambil", color: CLAIMED_COLOR },
        unclaimed: { label: "Belum Diambil", color: UNCLAIMED_COLOR },
    }

    if (isLoading) {
        return (
            <div className="px-4 lg:px-6 space-y-6">
                <div>
                    <h2 className="text-xl font-extrabold">Persebaran Tiket &amp; Goodie Bag</h2>
                    <p className="text-sm text-muted-foreground">
                        Visualisasi distribusi tiket dan status pengambilan goodie bag.
                    </p>
                </div>
                <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
                    {Array.from({ length: 4 }).map((_, i) => (
                        <Skeleton key={i} className="h-28 w-full rounded-xl" />
                    ))}
                </div>
                <div className="grid gap-5 lg:grid-cols-3">
                    <Skeleton className="h-[380px] w-full rounded-xl lg:col-span-2" />
                    <Skeleton className="h-[380px] w-full rounded-xl" />
                </div>
            </div>
        )
    }

    const hasTicketData = totalTickets > 0
    const hasGoodieData = goodieTotal > 0

    return (
        <div className="px-4 lg:px-6 space-y-6">
            <div>
                <h2 className="text-xl font-extrabold">Persebaran Tiket &amp; Goodie Bag</h2>
                <p className="text-sm text-muted-foreground">
                    Visualisasi distribusi tiket dan status pengambilan goodie bag.
                </p>
            </div>

            {/* KPI cards */}
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
                <Card className={`neo-lift ${KPI_CARDS[0]}`}>
                    <CardContent className="space-y-1 p-5">
                        <p className="text-sm font-bold text-muted-foreground">Total Tiket</p>
                        <div className="text-4xl font-black">{totalTickets}</div>
                    </CardContent>
                </Card>
                <Card className={`neo-lift ${KPI_CARDS[1]}`}>
                    <CardContent className="space-y-1 p-5">
                        <p className="text-sm font-bold text-muted-foreground">Goodie Bag Diambil</p>
                        <div className="text-4xl font-black">{goodieClaimed}</div>
                    </CardContent>
                </Card>
                <Card className={`neo-lift ${KPI_CARDS[2]}`}>
                    <CardContent className="space-y-1 p-5">
                        <p className="text-sm font-bold text-muted-foreground">Belum Diambil</p>
                        <div className="text-4xl font-black">{goodieUnclaimed}</div>
                    </CardContent>
                </Card>
                <Card className={`neo-lift ${KPI_CARDS[3]}`}>
                    <CardContent className="space-y-1 p-5">
                        <p className="text-sm font-bold text-muted-foreground">Persentase Diambil</p>
                        <div className="text-4xl font-black">{claimedPercent}%</div>
                    </CardContent>
                </Card>
            </div>

            {/* Ticket distribution per category */}
            <Card>
                <CardHeader>
                    <CardTitle>Persebaran Tiket per Kategori</CardTitle>
                    <CardDescription>
                        Jumlah tiket untuk masing-masing kategori tiket.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {hasTicketData ? (
                        <ChartContainer
                            config={ticketChart.config}
                            className="aspect-auto h-[300px] w-full"
                        >
                            <BarChart data={ticketChart.rows}>
                                <CartesianGrid vertical={false} />
                                <XAxis
                                    dataKey="category"
                                    tickLine={false}
                                    axisLine={false}
                                    tickMargin={8}
                                />
                                <YAxis allowDecimals={false} tickLine={false} axisLine={false} width={40} />
                                <ChartTooltip content={<ChartTooltipContent />} />
                                <Bar dataKey="count" radius={4}>
                                    {ticketChart.rows.map((row, i) => (
                                        <Cell key={`cell-${i}`} fill={row.fill} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ChartContainer>
                    ) : (
                        <p className="py-10 text-center text-sm text-muted-foreground">
                            Belum ada data tiket.
                        </p>
                    )}
                </CardContent>
            </Card>

            {/* Goodie bag donut + per category bar */}
            <div className="grid gap-5 lg:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle>Status Goodie Bag</CardTitle>
                        <CardDescription>
                            Perbandingan goodie bag yang sudah dan belum diambil.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {hasGoodieData ? (
                            <ChartContainer
                                config={donutConfig}
                                className="aspect-auto h-[300px] w-full"
                            >
                                <PieChart>
                                    <ChartTooltip content={<ChartTooltipContent nameKey="key" />} />
                                    <Pie
                                        data={donutData}
                                        dataKey="value"
                                        nameKey="key"
                                        innerRadius={60}
                                        outerRadius={100}
                                        paddingAngle={2}
                                    >
                                        <Cell fill={CLAIMED_COLOR} />
                                        <Cell fill={UNCLAIMED_COLOR} />
                                    </Pie>
                                    <ChartLegend content={<ChartLegendContent nameKey="key" />} />
                                </PieChart>
                            </ChartContainer>
                        ) : (
                            <p className="py-10 text-center text-sm text-muted-foreground">
                                Belum ada data goodie bag.
                            </p>
                        )}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Persebaran Goodie Bag per Kategori</CardTitle>
                        <CardDescription>
                            Status pengambilan goodie bag dipecah per kategori tiket.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {hasGoodieData && goodieByCategory.length > 0 ? (
                            <ChartContainer
                                config={categoryConfig}
                                className="aspect-auto h-[300px] w-full"
                            >
                                <BarChart data={goodieByCategory}>
                                    <CartesianGrid vertical={false} />
                                    <XAxis
                                        dataKey="category"
                                        tickLine={false}
                                        axisLine={false}
                                        tickMargin={8}
                                    />
                                    <YAxis allowDecimals={false} tickLine={false} axisLine={false} width={40} />
                                    <ChartTooltip content={<ChartTooltipContent />} />
                                    <ChartLegend content={<ChartLegendContent />} />
                                    <Bar
                                        dataKey="claimed"
                                        stackId="a"
                                        fill="var(--color-claimed)"
                                        radius={4}
                                    />
                                    <Bar
                                        dataKey="unclaimed"
                                        stackId="a"
                                        fill="var(--color-unclaimed)"
                                        radius={4}
                                    />
                                </BarChart>
                            </ChartContainer>
                        ) : (
                            <p className="py-10 text-center text-sm text-muted-foreground">
                                Belum ada data goodie bag.
                            </p>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
