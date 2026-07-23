import { useState, useRef, useEffect } from 'react';
import { importExcelParticipants } from '@/api/war-kursi-api';
import { getAllEvents, type EventModel } from '@/api/event-api';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { IconUpload, IconFileSpreadsheet, IconCheck, IconX } from '@tabler/icons-react';

export function ImportExcel() {
    const [isUploading, setIsUploading] = useState(false);
    const [result, setResult] = useState<{ imported: number; skipped: number } | null>(null);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [events, setEvents] = useState<EventModel[]>([]);
    const [selectedEventId, setSelectedEventId] = useState<string>('');
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        const fetchEvents = async () => {
            try {
                const data = await getAllEvents();
                setEvents(data);
                if (data.length > 0) {
                    setSelectedEventId(data[0].id);
                }
            } catch (error) {
                console.error("Failed to load events", error);
            }
        };
        fetchEvents();
    }, []);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
                toast.error('File harus berformat .xlsx atau .xls');
                return;
            }
            setSelectedFile(file);
            setResult(null);
        }
    };

    const handleUpload = async () => {
        if (!selectedFile) {
            toast.error('Pilih file Excel terlebih dahulu');
            return;
        }
        if (!selectedEventId) {
            toast.error('Pilih event terlebih dahulu');
            return;
        }

        setIsUploading(true);
        try {
            const res = await importExcelParticipants(selectedFile, selectedEventId);
            setResult({ imported: res.imported_count, skipped: res.skipped_count });
            toast.success(`Import selesai! ${res.imported_count} tiket ditambahkan, ${res.skipped_count} tiket dilewati (duplikat).`);
        } catch (err) {
            toast.error(`Gagal import: ${err}`);
        } finally {
            setIsUploading(false);
        }
    };

    const handleReset = () => {
        setSelectedFile(null);
        setResult(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    return (
        <div>
            <div className="neo-surface bg-neo-mint p-6">
                <div className="flex items-center gap-3 mb-4">
                    <span className="neo-icon-tile size-10 bg-white"><IconFileSpreadsheet className="h-6 w-6 text-neo-mint-solid" /></span>
                    <h2 className="text-xl font-extrabold">Import Data Peserta (Excel)</h2>
                </div>
                <p className="text-sm text-muted-foreground mb-4">
                    Pilih event dan upload file <code>.xlsx</code> dari platform tiket. Sistem akan otomatis melewati data yang sudah ada (anti duplikasi).
                </p>

                <div className="flex flex-col gap-4">
                    <div className="flex flex-col gap-2">
                        <label className="text-sm font-medium">Pilih Event</label>
                        <select
                            className="flex h-10 w-full rounded-xl border-2 border-neo-border bg-white px-3 py-2 text-sm font-bold focus:outline-none focus:ring-4 focus:ring-neo-purple-solid/30"
                            value={selectedEventId}
                            onChange={(e) => setSelectedEventId(e.target.value)}
                            disabled={isUploading}
                        >
                            <option value="">-- Pilih Event --</option>
                            {events.map(ev => (
                                <option key={ev.id} value={ev.id}>{ev.name}</option>
                            ))}
                        </select>
                    </div>
                    <div className="flex items-center gap-3">
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept=".xlsx,.xls"
                            onChange={handleFileChange}
                            className="block w-full cursor-pointer rounded-xl border-2 border-neo-border bg-white p-2 text-sm text-muted-foreground file:mr-4 file:rounded-lg file:border-2 file:border-neo-border file:bg-neo-yellow-solid file:px-4 file:py-2 file:text-sm file:font-bold"
                        />
                    </div>

                    {selectedFile && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <IconFileSpreadsheet className="h-4 w-4" />
                            <span>{selectedFile.name} ({(selectedFile.size / 1024).toFixed(1)} KB)</span>
                        </div>
                    )}

                    <div className="flex gap-2">
                        <Button
                            onClick={handleUpload}
                            disabled={!selectedFile || isUploading}
                        >
                            <IconUpload className="h-4 w-4 mr-2" />
                            {isUploading ? 'Mengimport...' : 'Upload & Import'}
                        </Button>
                        {selectedFile && (
                            <Button variant="outline" onClick={handleReset}>
                                Reset
                            </Button>
                        )}
                    </div>

                    {result && (
                        <div className="rounded-xl border-2 border-neo-border bg-white p-4">
                            <h3 className="font-medium mb-2">Hasil Import:</h3>
                            <div className="flex gap-6">
                                <div className="flex items-center gap-2 text-green-600">
                                    <IconCheck className="h-4 w-4" />
                                    <span className="text-sm font-medium">{result.imported} tiket berhasil ditambahkan</span>
                                </div>
                                <div className="flex items-center gap-2 text-amber-600">
                                    <IconX className="h-4 w-4" />
                                    <span className="text-sm font-medium">{result.skipped} tiket dilewati (duplikat)</span>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
