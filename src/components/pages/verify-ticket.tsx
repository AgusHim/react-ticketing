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
        } catch { }

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
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4">
            <div className="w-full max-w-md">
                {/* Header */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
                        <IconTicket className="h-8 w-8 text-primary" />
                    </div>
                    <h1 className="text-3xl font-bold text-white">War Kursi</h1>
                    <p className="text-slate-400 mt-2">
                        Verifikasi tiketmu untuk memilih kursi
                    </p>
                </div>

                {/* Verification Card */}
                <div className="rounded-2xl border border-slate-700 bg-slate-800/50 backdrop-blur-sm p-6 shadow-xl">
                    <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                        <IconShieldCheck className="h-5 w-5 text-blue-400" />
                        Verifikasi E-Ticket
                    </h2>

                    <div className="flex flex-col gap-4">
                        <p className="text-sm text-slate-400">
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
                                        ? 'border-primary bg-primary/10 scale-[1.02]'
                                        : 'border-slate-600 hover:border-slate-500 hover:bg-slate-700/30'
                                    }`}
                            >
                                <div className="flex flex-col items-center gap-3">
                                    <div className={`rounded-full p-3 transition-colors ${isDragOver ? 'bg-primary/20' : 'bg-slate-700/50'
                                        }`}>
                                        <IconUpload className={`h-6 w-6 transition-colors ${isDragOver ? 'text-primary' : 'text-slate-400'
                                            }`} />
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-white">
                                            {isDragOver ? 'Lepaskan file di sini' : 'Drag & drop PDF e-ticket'}
                                        </p>
                                        <p className="text-xs text-slate-500 mt-1">
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
