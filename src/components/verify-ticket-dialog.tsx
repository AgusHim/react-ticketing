import { useState, useRef, useCallback } from 'react';
import { verifyTicketPDF, type VerifyResult } from '@/api/war-kursi-api';
import { toast } from 'sonner';
import {
    IconUpload,
    IconLoader2,
    IconDownload,
} from '@tabler/icons-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

export function VerifyTicketDialog({ eventId, onVerified, children }: { eventId: string, onVerified: (tickets: VerifyResult[]) => void, children?: React.ReactNode }) {
    const [isOpen, setIsOpen] = useState(false);
    const [isParsing, setIsParsing] = useState(false);
    const [isDragOver, setIsDragOver] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handlePdfFile = useCallback(async (file: File) => {
        if (file.type !== 'application/pdf') {
            toast.error('Hanya file PDF yang didukung');
            return;
        }

        setIsParsing(true);
        try {
            const tickets = await verifyTicketPDF(file);
            if (!tickets || tickets.length === 0) {
                toast.error('Tidak ditemukan kode tiket dalam PDF ini');
                return;
            }

            // Filter tickets matching current event
            const validTickets = tickets.filter(t => t.event_id === eventId);

            if (validTickets.length === 0) {
                toast.error('Tiket dalam PDF ini bukan untuk event yang dipilih!');
                return;
            }

            if (validTickets.length === 1) {
                toast.info(`Kode tiket ditemukan: ${validTickets[0].ticket_code}`);
            } else {
                toast.success(`Berhasil memverifikasi ${validTickets.length} tiket sekaligus`);
            }

            onVerified(validTickets);
            setIsOpen(false);
        } catch (err: any) {
            console.error('PDF parsing error:', err);
            const msg = err.response?.data?.message || 'Gagal membaca file PDF. Pastikan file tidak rusak.';
            toast.error(msg);
        } finally {
            setIsParsing(false);
        }
    }, [eventId, onVerified]);

    // File input handler
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) handlePdfFile(file);
        e.target.value = '';
    };

    // Drag and drop handlers
    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragOver(true);
    };

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragOver(false);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragOver(false);
        const file = e.dataTransfer.files[0];
        if (file) handlePdfFile(file);
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                {children ? children : (
                    <button className="rounded-lg border-2 border-neo-border bg-neo-yellow-solid px-2.5 py-1.5 text-[10px] font-extrabold text-foreground shadow-[2px_2px_0_#1a1a1a] transition-colors hover:bg-neo-yellow">
                        + Tambah Tiket
                    </button>
                )}
            </DialogTrigger>
            <DialogContent className="bg-white text-foreground sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Tambah Tiket ke Sesi</DialogTitle>
                    <DialogDescription>
                        Sebelumnya download e-tiket darisini.com . Upload file PDF e-ticket Anda untuk ditambahkan ke sesi war kursi ini.
                    </DialogDescription>
                </DialogHeader>

                <div className="flex flex-col gap-4 py-4">
                    <input
                        ref={fileInputRef}
                        data-testid="ticket-pdf-input"
                        type="file"
                        accept=".pdf,application/pdf"
                        className="hidden"
                        onChange={handleFileChange}
                    />

                    {!isParsing ? (
                        <>
                            <div
                                data-testid="ticket-pdf-dropzone"
                                onDragOver={handleDragOver}
                                onDragLeave={handleDragLeave}
                                onDrop={handleDrop}
                                onClick={() => fileInputRef.current?.click()}
                                className={`relative cursor-pointer rounded-xl border-2 border-dashed p-8 text-center transition-all duration-200 ${isDragOver
                                        ? 'border-neo-purple-solid bg-neo-purple -translate-y-1'
                                        : 'border-neo-border bg-neo-purple/50 hover:bg-neo-purple'
                                    }`}
                            >
                                <div className="flex flex-col items-center gap-3">
                                    <div className={`rounded-xl border-2 border-neo-border p-3 transition-colors ${isDragOver ? 'bg-neo-yellow-solid' : 'bg-white'
                                        }`}>
                                        <IconUpload className="h-6 w-6 text-foreground" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-extrabold text-foreground">
                                            {isDragOver ? 'Lepaskan file di sini' : 'Drag & drop PDF e-ticket'}
                                        </p>
                                        <p className="text-xs text-slate-500 mt-1">
                                            atau klik untuk pilih file
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <a
                                href="https://www.darisini.com/orders"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="w-full block mt-2"
                            >
                                <button type="button" className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-neo-border bg-neo-mint py-2.5 text-sm font-extrabold text-foreground shadow-[3px_3px_0_#1a1a1a] transition-colors hover:bg-white">
                                    <IconDownload className="h-4 w-4" />
                                    Download Tiket
                                </button>
                            </a>
                        </>
                    ) : (
                        <div className="flex flex-col items-center gap-3 py-10">
                            <IconLoader2 className="h-8 w-8 text-primary animate-spin" />
                            <p className="text-sm text-slate-300">Membaca PDF...</p>
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
