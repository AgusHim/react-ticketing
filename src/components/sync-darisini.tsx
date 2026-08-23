import { useState, useEffect } from 'react';
import { syncDarisiniParticipants } from '@/api/war-kursi-api';
import { getAllEvents, type EventModel } from '@/api/event-api';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { IconRefresh, IconDatabaseImport, IconCheck, IconX, IconAlertCircle } from '@tabler/icons-react';

export function SyncDarisini() {
    const [isSyncing, setIsSyncing] = useState(false);
    const [result, setResult] = useState<{ imported: number; updated: number; skipped: number } | null>(null);
    const [events, setEvents] = useState<EventModel[]>([]);
    const [selectedEventId, setSelectedEventId] = useState<string>('');

    useEffect(() => {
        const fetchEvents = async () => {
            try {
                const data = await getAllEvents();
                setEvents(data);
                // Do not auto-select: user must explicitly pick an event first
                // so that event_id is intentionally set before syncing.
            } catch (error) {
                console.error("Failed to load events", error);
            }
        };
        fetchEvents();
    }, []);

    const selectedEvent = events.find((ev) => ev.id === selectedEventId);
    const scannerId = selectedEvent?.event_scanner_id?.trim() ?? '';
    const missingScannerId = !!selectedEventId && !scannerId;

    const handleSync = async () => {
        if (!selectedEventId) {
            toast.error('Pilih event terlebih dahulu');
            return;
        }
        if (!scannerId) {
            toast.error('Event ini belum punya Event Scanner ID (Darisini). Lengkapi di halaman Events.');
            return;
        }

        setIsSyncing(true);
        try {
            const res = await syncDarisiniParticipants(selectedEventId, scannerId);
            setResult({
                imported: res.imported_count,
                updated: res.updated_count,
                skipped: res.skipped_count,
            });
            toast.success(
                `Sync selesai! ${res.imported_count} baru, ${res.updated_count} diperbarui, ${res.skipped_count} dilewati.`
            );
        } catch (err: any) {
            toast.error(err?.response?.data?.message || `Gagal sync: ${err}`);
        } finally {
            setIsSyncing(false);
        }
    };

    return (
        <div>
            <div className="neo-surface bg-neo-mint p-6">
                <div className="flex items-center gap-3 mb-4">
                    <span className="neo-icon-tile size-10 bg-white"><IconDatabaseImport className="h-6 w-6 text-neo-mint-solid" /></span>
                    <h2 className="text-xl font-extrabold">Sync Peserta dari Darisini</h2>
                </div>
                <p className="text-sm text-muted-foreground mb-4">
                    Tarik seluruh data peserta langsung dari Darisini berdasarkan <strong>Event Scanner ID</strong>.
                    Tiket baru akan dibuat, tiket yang sudah ada akan diperbarui (anti duplikasi).
                </p>

                <div className="flex flex-col gap-4">
                    <div className="flex flex-col gap-2">
                        <label className="text-sm font-medium">Pilih Event</label>
                        <select
                            className="flex h-10 w-full rounded-xl border-2 border-neo-border bg-white px-3 py-2 text-sm font-bold focus:outline-none focus:ring-4 focus:ring-neo-purple-solid/30"
                            value={selectedEventId}
                            onChange={(e) => { setSelectedEventId(e.target.value); setResult(null); }}
                            disabled={isSyncing}
                        >
                            <option value="">-- Pilih Event --</option>
                            {events.map((ev) => (
                                <option key={ev.id} value={ev.id}>{ev.name}</option>
                            ))}
                        </select>
                        {selectedEvent && (
                            <p className="text-xs text-muted-foreground">
                                Event Scanner ID: <code className="font-mono">{scannerId || '(belum diatur)'}</code>
                            </p>
                        )}
                        {!selectedEvent && events.length > 0 && (
                            <div className="flex items-center gap-2 rounded-xl border-2 border-neo-border bg-neo-yellow p-3 text-sm">
                                <IconAlertCircle className="h-4 w-4 text-neo-yellow-solid" />
                                <span>Pilih event terlebih dahulu untuk mengisi <code>event_id</code> sebelum sync.</span>
                            </div>
                        )}
                    </div>

                    {missingScannerId && (
                        <div className="flex items-center gap-2 rounded-xl border-2 border-neo-border bg-neo-pink p-3 text-sm">
                            <IconAlertCircle className="h-4 w-4 text-neo-pink-solid" />
                            <span>Event ini belum punya Event Scanner ID. Atur dahulu di halaman Events.</span>
                        </div>
                    )}

                    <div className="flex gap-2">
                        <Button
                            onClick={handleSync}
                            disabled={!selectedEventId || !scannerId || isSyncing}
                        >
                            <IconRefresh className={`h-4 w-4 mr-2 ${isSyncing ? 'animate-spin' : ''}`} />
                            {isSyncing ? 'Menyinkronkan...' : 'Sync dari Darisini'}
                        </Button>
                    </div>

                    {result && (
                        <div className="rounded-xl border-2 border-neo-border bg-white p-4">
                            <h3 className="font-medium mb-2">Hasil Sync:</h3>
                            <div className="flex flex-wrap gap-6">
                                <div className="flex items-center gap-2 text-green-600">
                                    <IconCheck className="h-4 w-4" />
                                    <span className="text-sm font-medium">{result.imported} tiket baru</span>
                                </div>
                                <div className="flex items-center gap-2 text-blue-600">
                                    <IconRefresh className="h-4 w-4" />
                                    <span className="text-sm font-medium">{result.updated} tiket diperbarui</span>
                                </div>
                                <div className="flex items-center gap-2 text-amber-600">
                                    <IconX className="h-4 w-4" />
                                    <span className="text-sm font-medium">{result.skipped} dilewati</span>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
