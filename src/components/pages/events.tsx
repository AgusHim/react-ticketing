import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { getAllEvents, createEvent, updateEvent, deleteEvent, type EventModel } from '@/api/event-api';
import { toast } from 'sonner';
import { IconCalendarEvent, IconEdit, IconTrash, IconPlus } from '@tabler/icons-react';

export default function EventsPage() {
  const [events, setEvents] = useState<EventModel[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<EventModel | null>(null);
  
  const [formData, setFormData] = useState<Partial<EventModel>>({
    name: '',
    location: '',
    description: '',
    status: 'active',
    date: '',
    war_start_date: '',
    image_url: '',
    color: '#e50914',
    event_scanner_id: '',
  });

  const [editingId, setEditingId] = useState<string | null>(null);

  const fetchEvents = async () => {
    try {
      const data = await getAllEvents();
      setEvents(data);
    } catch {
      toast.error('Gagal mengambil data event');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleStatusChange = (value: string) => {
    setFormData((prev) => ({ ...prev, status: value }));
  };

  const handleOpenCreate = () => {
    setEditingId(null);
    setFormData({
      name: '',
      location: '',
      description: '',
      status: 'active',
      date: '',
      war_start_date: '',
      image_url: '',
      color: '#e50914',
      event_scanner_id: '',
    });
    setIsDialogOpen(true);
  };

  const handleOpenEdit = (evt: EventModel) => {
    setEditingId(evt.id);
    setFormData({
      name: evt.name,
      location: evt.location,
      description: evt.description,
      status: evt.status,
      date: evt.date ? new Date(evt.date).toISOString().slice(0, 16) : '',
      war_start_date: evt.war_start_date ? new Date(evt.war_start_date).toISOString().slice(0, 16) : '',
      image_url: evt.image_url || '',
      color: evt.color || '#e50914',
      event_scanner_id: evt.event_scanner_id || '',
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        ...formData,
        date: formData.date ? new Date(formData.date).toISOString() : undefined,
        war_start_date: formData.war_start_date ? new Date(formData.war_start_date).toISOString() : undefined,
      };

      if (editingId) {
        await updateEvent(editingId, payload);
        toast.success('Event berhasil diperbarui');
      } else {
        await createEvent(payload);
        toast.success('Event berhasil dibuat');
      }
      setIsDialogOpen(false);
      fetchEvents();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Terjadi kesalahan');
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteEvent(deleteTarget.id);
      toast.success('Event berhasil dihapus');
      setDeleteTarget(null);
      fetchEvents();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Gagal menghapus event');
    }
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '-';
    return new Intl.DateTimeFormat('id-ID', {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(new Date(dateStr));
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
            <SiteHeader title="Events" />
            <div className="flex flex-1 flex-col">
                <div className="@container/main flex flex-1 flex-col gap-2">
                    <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6 mx-5">
      <div className="mb-8 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="flex items-center gap-3 text-3xl font-black text-foreground">
            <span className="neo-icon-tile size-11 bg-neo-purple"><IconCalendarEvent className="h-6 w-6 text-foreground" /></span>
            Manajemen Events
          </h1>
          <p className="mt-2 text-muted-foreground">Kelola data event, waktu mulai war kursi, dan status acara.</p>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={handleOpenCreate} className="gap-2">
              <IconPlus className="h-4 w-4" /> Tambah Event
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>{editingId ? 'Edit Event' : 'Tambah Event Baru'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nama Event</Label>
                <Input
                  id="name"
                  name="name"
                  required
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="Contoh: Konser Kemerdekaan"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="location">Lokasi</Label>
                <Input
                  id="location"
                  name="location"
                  required
                  value={formData.location}
                  onChange={handleInputChange}
                  placeholder="Contoh: Stadion Utama GBK"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="image_url">URL Banner Event</Label>
                  <Input
                    id="image_url"
                    name="image_url"
                    value={formData.image_url}
                    onChange={handleInputChange}
                    placeholder="https://example.com/banner.jpg"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="color">Warna Tema</Label>
                  <div className="flex gap-2">
                    <Input
                      id="color"
                      name="color"
                      type="color"
                      className="w-12 h-10 p-1 cursor-pointer"
                      value={formData.color}
                      onChange={handleInputChange}
                    />
                    <Input
                      type="text"
                      value={formData.color}
                      onChange={(e) => setFormData(prev => ({...prev, color: e.target.value}))}
                      placeholder="#e50914"
                      className="flex-1 font-mono uppercase"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="event_scanner_id">Event Scanner ID (Darisini)</Label>
                <Input
                  id="event_scanner_id"
                  name="event_scanner_id"
                  value={formData.event_scanner_id || ''}
                  onChange={handleInputChange}
                  placeholder="contoh: cmt12rzyl013js601r4p5kwj5"
                />
                <p className="text-xs text-muted-foreground">Dipakai untuk mengonfirmasi kehadiran ke Darisini saat goodie bag diambil.</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="date">Waktu Pelaksanaan</Label>
                  <Input
                    id="date"
                    name="date"
                    type="datetime-local"
                    required
                    value={formData.date as string}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="war_start_date">Waktu Mulai War Kursi</Label>
                  <Input
                    id="war_start_date"
                    name="war_start_date"
                    type="datetime-local"
                    value={formData.war_start_date as string}
                    onChange={handleInputChange}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select value={formData.status} onValueChange={handleStatusChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active (Pendaftaran Buka)</SelectItem>
                    <SelectItem value="closed">Closed (Pendaftaran Tutup)</SelectItem>
                    <SelectItem value="draft">Draft (Belum Publikasi)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Deskripsi Singkat</Label>
                <Textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="Informasi tambahan mengenai acara..."
                  rows={3}
                />
              </div>

              <DialogFooter className="pt-4">
                <Button type="submit" className="w-full">
                  {editingId ? 'Simpan Perubahan' : 'Buat Event'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="neo-surface overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="border-b-2 border-neo-border bg-neo-yellow text-foreground">
              <tr>
                <th className="px-6 py-4 font-semibold">Nama Event</th>
                <th className="px-6 py-4 font-semibold">Waktu Pelaksanaan</th>
                <th className="px-6 py-4 font-semibold">Mulai War Kursi</th>
                <th className="px-6 py-4 font-semibold">Status</th>
                <th className="px-6 py-4 font-semibold text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-slate-500">Memuat data event...</td>
                </tr>
              ) : events.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-slate-500">Belum ada event yang dibuat.</td>
                </tr>
              ) : (
                events.map((evt) => (
                  <tr key={evt.id} className="border-b border-neo-border/20 transition-colors hover:bg-neo-mint/60">
                    <td className="px-6 py-4">
                      <div className="font-extrabold text-foreground">{evt.name}</div>
                      <div className="mt-0.5 text-xs text-muted-foreground">{evt.location}</div>
                    </td>
                    <td className="px-6 py-4 text-slate-600">{formatDate(evt.date)}</td>
                    <td className="px-6 py-4">
                      {evt.war_start_date ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {formatDate(evt.war_start_date)}
                        </span>
                      ) : (
                        <span className="text-slate-400 text-xs italic">Belum diatur</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        evt.status === 'active' ? 'bg-green-100 text-green-800' : 
                        evt.status === 'draft' ? 'bg-slate-100 text-slate-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {evt.status.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right space-x-2">
                      <Button variant="secondary" size="sm" onClick={() => handleOpenEdit(evt)} className="h-8 px-2">
                        <IconEdit className="h-4 w-4" />
                      </Button>
                      <Button variant="destructive" size="sm" onClick={() => setDeleteTarget(evt)} className="h-8 px-2" aria-label={`Hapus ${evt.name}`}>
                        <IconTrash className="h-4 w-4" />
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus event?</AlertDialogTitle>
            <AlertDialogDescription>
              Event “{deleteTarget?.name}” akan dihapus. Tindakan ini tidak dapat dibatalkan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-white hover:bg-red-500">
              Hapus Event
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
                    </div>
                </div>
            </div>
        </SidebarInset>
    </SidebarProvider>
  );
}
