import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import {
  getPortalCommunity,
  updateCommunityProfile,
} from "@/api/community-api";
import type { Community } from "@/types/community";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

type ProfileForm = Pick<
  Community,
  "name" | "description" | "location" | "logo_url" | "cover_url"
>;

const emptyForm: ProfileForm = {
  name: "",
  description: "",
  location: "",
  logo_url: "",
  cover_url: "",
};

export default function CommunityProfileSettingsPage() {
  const { communityId = "" } = useParams();
  const [form, setForm] = useState<ProfileForm>(emptyForm);
  const [slug, setSlug] = useState("");
  const [type, setType] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    getPortalCommunity(communityId)
      .then(({ community }) => {
        setForm({
          name: community.name,
          description: community.description || "",
          location: community.location || "",
          logo_url: community.logo_url || "",
          cover_url: community.cover_url || "",
        });
        setSlug(community.slug);
        setType(community.type);
      })
      .catch(() => toast.error("Gagal memuat profil komunitas"));
  }, [communityId]);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSaving(true);
    try {
      const community = await updateCommunityProfile(communityId, form);
      setForm({
        name: community.name,
        description: community.description || "",
        location: community.location || "",
        logo_url: community.logo_url || "",
        cover_url: community.cover_url || "",
      });
      toast.success("Profil komunitas diperbarui");
    } catch (error: unknown) {
      const message = axios.isAxiosError(error)
        ? error.response?.data?.error?.message
        : undefined;
      toast.error(message || "Gagal memperbarui profil");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <section className="max-w-3xl">
      <h1 className="text-3xl font-black">Profil Komunitas</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Informasi ini tampil pada halaman publik komunitas.
      </p>
      <Card className="mt-6">
        <CardHeader><CardTitle>Informasi publik</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={submit} className="grid gap-5">
            <div className="grid gap-2">
              <Label htmlFor="profile-name">Nama komunitas</Label>
              <Input
                id="profile-name"
                value={form.name}
                maxLength={160}
                required
                onChange={(event) => setForm({ ...form, name: event.target.value })}
              />
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="profile-slug">Slug permanen</Label>
                <Input id="profile-slug" value={slug} disabled />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="profile-type">Template komunitas</Label>
                <Input id="profile-type" value={type} disabled />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="profile-description">Deskripsi</Label>
              <Textarea
                id="profile-description"
                value={form.description}
                maxLength={5000}
                rows={6}
                onChange={(event) => setForm({ ...form, description: event.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="profile-location">Lokasi</Label>
              <Input
                id="profile-location"
                value={form.location}
                maxLength={255}
                onChange={(event) => setForm({ ...form, location: event.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="profile-logo">URL logo</Label>
              <Input
                id="profile-logo"
                type="url"
                value={form.logo_url}
                onChange={(event) => setForm({ ...form, logo_url: event.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="profile-cover">URL cover</Label>
              <Input
                id="profile-cover"
                type="url"
                value={form.cover_url}
                onChange={(event) => setForm({ ...form, cover_url: event.target.value })}
              />
            </div>
            <Button type="submit" disabled={isSaving}>
              {isSaving ? "Menyimpan..." : "Simpan profil"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </section>
  );
}
