import { useState, useRef, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { verifyTicketPDF, type VerifyResult } from '@/api/war-kursi-api';
import { toast } from 'sonner';
import {
    IconTicket,
    IconCheck,
    IconShieldCheck,
    IconUpload,
    IconFileTypePdf,
    IconX,
    IconLoader2,
} from '@tabler/icons-react';

export default function VerifyTicketPage() {
    const [searchParams] = useSearchParams();
    const eventId = searchParams.get('event_id') || 'default';
    const [isParsing, setIsParsing] = useState(false);

    // PDF parsing state
    const [extractedTickets, setExtractedTickets] = useState<VerifyResult[]>([]);
    const [pdfFileName, setPdfFileName] = useState<string>('');
    const [isDragOver, setIsDragOver] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Handle PDF file processing
    const handlePdfFile = useCallback(async (file: File) => {
        if (file.type !== 'application/pdf') {
            toast.error('Hanya file PDF yang didukung');
            return;
        }

        setPdfFileName(file.name);
        setIsParsing(true);
        setExtractedTickets([]);

        try {
            const tickets = await verifyTicketPDF(file);
            if (!tickets || tickets.length === 0) {
                toast.error('Tidak ditemukan kode tiket dalam PDF ini');
                setPdfFileName('');
                return;
            }

            // Filter tickets matching current event
            const validTickets = tickets.filter(t => t.event_id === eventId);

            if (validTickets.length === 0) {
                toast.error('Tiket dalam PDF ini bukan untuk event yang dipilih!');
                setPdfFileName('');
                return;
            }

            setExtractedTickets(validTickets);

            if (validTickets.length === 1) {
                toast.info(`Kode tiket ditemukan: ${validTickets[0].ticket_code}`);
            } else {
                toast.success(`Berhasil memverifikasi ${validTickets.length} tiket sekaligus`);
            }
            selectTickets(validTickets);
        } catch (err: any) {
            console.error('PDF parsing error:', err);
            const msg = err.response?.data?.message || 'Gagal membaca file PDF. Pastikan file tidak rusak.';
            toast.error(msg);
            setPdfFileName('');
        } finally {
            setIsParsing(false);
        }
    }, [eventId]);

    const selectTickets = (newTickets: VerifyResult[]) => {
        const key = `war_kursi_tokens_${eventId}`;
        const existingRaw = localStorage.getItem(key);
        let existingTokens: string[] = [];
        try {
            if (existingRaw) existingTokens = JSON.parse(existingRaw);
        } catch {
            existingTokens = [];
        }

        // Combine existing tokens with new tokens (avoid duplicates by token string)
        const newTokens = newTickets.map(t => t.token);
        const combined = Array.from(new Set([...existingTokens, ...newTokens]));

        localStorage.setItem(key, JSON.stringify(combined));

        toast.success(`${newTickets.length} Tiket terverifikasi dan ditambahkan ke Sesi!`);
        // Navigate immediately to booking
        setTimeout(() => {
            window.location.href = `/booking?event_id=${eventId}`;
        }, 1500);
    };

    // File input handler
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) handlePdfFile(file);
        // Reset so the same file can be re-selected
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

    const resetAll = () => {
        setExtractedTickets([]);
        setPdfFileName('');
    };

    return (
        <div className="neo-workspace neo-dots flex min-h-screen items-center justify-center p-4">
            <div className="w-full max-w-md">
                {/* Header */}
                <div className="text-center mb-8">
                    <div className="neo-icon-tile mb-4 inline-flex h-16 w-16 bg-neo-yellow-solid">
                        <IconTicket className="h-8 w-8 text-foreground" />
                    </div>
                    <h1 className="text-4xl font-black text-foreground">War Kursi</h1>
                    <p className="mt-2 text-muted-foreground">
                        Verifikasi tiketmu untuk memilih kursi
                    </p>
                </div>

                {/* Verification Card */}
                <div className="neo-surface bg-white p-6">
                    <h2 className="mb-4 flex items-center gap-2 text-xl font-extrabold text-foreground">
                        <span className="neo-icon-tile size-9 bg-neo-purple"><IconShieldCheck className="h-5 w-5 text-foreground" /></span>
                        Verifikasi E-Ticket
                    </h2>

                    <div className="flex flex-col gap-4">
                        <p className="text-sm text-muted-foreground">
                            Upload file <strong>PDF E-Ticket</strong> dari darisini. Kode tiket akan diekstrak otomatis.
                        </p>

                        {/* Hidden file input */}
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept=".pdf,application/pdf"
                            className="hidden"
                            onChange={handleFileChange}
                        />

                        {/* Drop Zone */}
                        {!pdfFileName && !isParsing && (
                            <div
                                id="pdf-drop-zone"
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
                                        <IconUpload className="h-6 w-6 text-foreground"
                                        />
                                    </div>
                                    <div>
                                        <p className="text-sm font-extrabold text-foreground">
                                            {isDragOver ? 'Lepaskan file di sini' : 'Drag & drop PDF e-ticket'}
                                        </p>
                                        <p className="mt-1 text-xs text-muted-foreground">
                                            atau klik untuk pilih file
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Parsing state */}
                        {isParsing && (
                            <div className="flex flex-col items-center gap-3 py-6">
                                <IconLoader2 className="h-8 w-8 text-primary animate-spin" />
                                <p className="text-sm text-slate-300">Membaca PDF...</p>
                                <p className="text-xs text-slate-500">{pdfFileName}</p>
                            </div>
                        )}

                        {/* File loaded + extracted tickets */}
                        {pdfFileName && !isParsing && extractedTickets.length > 0 && (
                            <div className="flex flex-col gap-3">
                                {/* File info bar */}
                                <div className="flex items-center gap-2 rounded-lg bg-slate-700/40 px-3 py-2">
                                    <IconFileTypePdf className="h-4 w-4 text-red-400 shrink-0" />
                                    <span className="text-sm text-slate-300 truncate flex-1">{pdfFileName}</span>
                                    <button
                                        type="button"
                                        onClick={resetAll}
                                        className="text-slate-500 hover:text-white transition-colors"
                                    >
                                        <IconX className="h-4 w-4" />
                                    </button>
                                </div>
                                <div className="flex flex-col items-center justify-center p-6 bg-slate-700/30 rounded-lg border border-slate-600 mt-2">
                                    <IconCheck className="h-10 w-10 text-green-400 mb-2" />
                                    <p className="text-white font-medium">Tiket berhasil diproses</p>
                                    <p className="text-sm text-slate-400">Mengarahkan ke halaman Booking...</p>
                                </div>
                            </div>
                        )}

                        {/* No tickets found */}
                        {pdfFileName && !isParsing && extractedTickets.length === 0 && (
                            <div className="text-center py-4">
                                <p className="text-sm text-red-400 mb-2">Tidak ada kode tiket ditemukan</p>
                                <button
                                    type="button"
                                    onClick={resetAll}
                                    className="text-xs text-slate-400 hover:text-white underline transition-colors"
                                >
                                    Coba file lain
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                <p className="text-center text-xs text-slate-500 mt-6">
                    Upload PDF E-Ticket Anda untuk diverifikasi.
                </p>
            </div>
        </div>
    );
}
