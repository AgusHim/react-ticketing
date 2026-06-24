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
import { getAllEvents, createEvent, updateEvent, deleteEvent, type EventModel } from '@/api/event-api';
import { toast } from 'sonner';
import { IconCalendarEvent, IconEdit, IconTrash, IconPlus } from '@tabler/icons-react';

export default function EventsPage() {
  const [events, setEvents] = useState<EventModel[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  
  const [formData, setFormData] = useState<Partial<EventModel>>({
    name: '',
    location: '',
    description: '',
    status: 'active',
    date: '',
    war_start_date: '',
  });

  const [editingId, setEditingId] = useState<string | null>(null);

  const fetchEvents = async () => {
    try {
      const data = await getAllEvents();
      setEvents(data);
    } catch (err) {
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

  const handleDelete = async (id: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus event ini?')) return;
    try {
      await deleteEvent(id);
      toast.success('Event berhasil dihapus');
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
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 flex items-center gap-2">
            <IconCalendarEvent className="h-8 w-8 text-primary" />
            Manajemen Events
          </h1>
          <p className="text-slate-500 mt-1">Kelola data event, waktu mulai war kursi, dan status acara.</p>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={handleOpenCreate} className="bg-primary hover:bg-primary/90 text-white gap-2">
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

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600">
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
                  <tr key={evt.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-semibold text-slate-800">{evt.name}</div>
                      <div className="text-xs text-slate-500 mt-0.5">{evt.location}</div>
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
                      <Button variant="outline" size="sm" onClick={() => handleOpenEdit(evt)} className="h-8 px-2 text-blue-600 border-blue-200 hover:bg-blue-50">
                        <IconEdit className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => handleDelete(evt.id)} className="h-8 px-2 text-red-600 border-red-200 hover:bg-red-50">
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
                    </div>
                </div>
            </div>
        </SidebarInset>
    </SidebarProvider>
  );
}
