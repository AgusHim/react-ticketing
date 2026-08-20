import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import { createCommunity, getMyCommunities } from "@/api/community-api";
import type { Community, CommunityType } from "@/types/community";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

export default function AccountCommunitiesPage() {
  const [communities, setCommunities] = useState<Community[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [form, setForm] = useState<{
    name: string;
    type: CommunityType;
    description: string;
    location: string;
  }>({ name: "", type: "dakwah", description: "", location: "" });

  const load = useCallback(async () => {
    setIsLoading(true);
    try {
      setCommunities(await getMyCommunities());
    } catch {
      toast.error("Gagal memuat komunitas");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function handleCreate(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsCreating(true);
    try {
      const community = await createCommunity(form);
      setCommunities((current) => [...current, community]);
      setForm({ name: "", type: "dakwah", description: "", location: "" });
      toast.success("Komunitas berhasil dibuat");
    } catch (error: unknown) {
      const message = axios.isAxiosError(error)
        ? error.response?.data?.error?.message
        : undefined;
      toast.error(message || "Gagal membuat komunitas");
    } finally {
      setIsCreating(false);
    }
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
      <section>
        <h1 className="text-3xl font-black">Komunitas Saya</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Kelola event, tim, dan jamaah dari setiap komunitas.
        </p>
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          {isLoading ? (
            <p className="font-bold">Memuat...</p>
          ) : communities.length === 0 ? (
            <Card className="sm:col-span-2">
              <CardContent className="p-6 text-sm text-muted-foreground">
                Belum ada komunitas. Buat komunitas pertama dari formulir.
              </CardContent>
            </Card>
          ) : (
            communities.map((community) => (
              <Card key={community.id} className="bg-neo-mint">
                <CardHeader>
                  <span className="text-xs font-black uppercase">{community.type}</span>
                  <CardTitle>{community.name}</CardTitle>
                  <CardDescription>{community.location || "Indonesia"}</CardDescription>
                </CardHeader>
                <CardContent className="flex gap-2">
                  <Button asChild size="sm">
                    <Link to={`/portal/${community.id}`}>Buka portal</Link>
                  </Button>
                  <Button asChild size="sm" variant="outline">
                    <Link to={`/communities/${community.slug}`}>Lihat publik</Link>
                  </Button>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </section>

      <Card className="h-fit bg-neo-yellow">
        <CardHeader>
          <CardTitle>Buat komunitas</CardTitle>
          <CardDescription>Template dapat dikembangkan setelah komunitas dibuat.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleCreate} className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="community-name">Nama</Label>
              <Input
                id="community-name"
                value={form.name}
                onChange={(event) => setForm({ ...form, name: event.target.value })}
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="community-type">Tipe</Label>
              <select
                id="community-type"
                value={form.type}
                onChange={(event) => setForm({ ...form, type: event.target.value as CommunityType })}
                className="h-10 rounded-xl border-2 border-neo-border bg-white px-3 text-sm font-bold"
              >
                <option value="dakwah">Dakwah</option>
                <option value="running">Lari</option>
                <option value="general">Umum</option>
              </select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="community-location">Lokasi</Label>
              <Input
                id="community-location"
                value={form.location}
                onChange={(event) => setForm({ ...form, location: event.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="community-description">Deskripsi</Label>
              <Textarea
                id="community-description"
                value={form.description}
                onChange={(event) => setForm({ ...form, description: event.target.value })}
              />
            </div>
            <Button type="submit" disabled={isCreating}>
              {isCreating ? "Membuat..." : "Buat komunitas"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
