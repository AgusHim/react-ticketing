import { useCallback, useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import {
  getCommunityMembers,
  getPortalCommunity,
  inviteCommunityMember,
  removeCommunityMember,
  updateCommunityMemberRole,
} from "@/api/community-api";
import type { CommunityMember, CommunityRole, InvitationResult } from "@/types/community";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";

type InviteRole = Exclude<CommunityRole, "owner">;

export default function CommunityMembersPage() {
  const { communityId = "" } = useParams();
  const [members, setMembers] = useState<CommunityMember[]>([]);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<InviteRole>("event_manager");
  const [latestInvite, setLatestInvite] = useState<InvitationResult | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [actorRole, setActorRole] = useState<CommunityRole | "platform_admin" | "">("");
  const [changingMember, setChangingMember] = useState("");
  const { user } = useAuth();

  const load = useCallback(async () => {
    try {
      setMembers(await getCommunityMembers(communityId));
    } catch {
      toast.error("Gagal memuat anggota tim");
    }
  }, [communityId]);

  useEffect(() => {
    void load();
    getPortalCommunity(communityId)
      .then((portal) => setActorRole(portal.role))
      .catch(() => undefined);
  }, [load, communityId]);

  async function changeRole(member: CommunityMember, nextRole: InviteRole) {
    setChangingMember(member.id);
    try {
      await updateCommunityMemberRole(communityId, member.id, nextRole);
      setMembers((current) =>
        current.map((item) =>
          item.id === member.id ? { ...item, role: nextRole } : item,
        ),
      );
      toast.success("Peran anggota diperbarui");
    } catch (error: unknown) {
      const message = axios.isAxiosError(error)
        ? error.response?.data?.error?.message
        : undefined;
      toast.error(message || "Gagal memperbarui peran");
    } finally {
      setChangingMember("");
    }
  }

  async function remove(member: CommunityMember) {
    setChangingMember(member.id);
    try {
      await removeCommunityMember(communityId, member.id);
      setMembers((current) => current.filter((item) => item.id !== member.id));
      toast.success("Anggota dihapus dari tim");
    } catch (error: unknown) {
      const message = axios.isAxiosError(error)
        ? error.response?.data?.error?.message
        : undefined;
      toast.error(message || "Gagal menghapus anggota");
    } finally {
      setChangingMember("");
    }
  }

  async function handleInvite(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setLatestInvite(null);
    try {
      const invitation = await inviteCommunityMember(communityId, email, role);
      setLatestInvite(invitation);
      setEmail("");
      toast.success("Undangan berhasil dibuat");
    } catch (error: unknown) {
      const message = axios.isAxiosError(error)
        ? error.response?.data?.error?.message
        : undefined;
      toast.error(message || "Gagal membuat undangan");
    } finally {
      setIsSubmitting(false);
    }
  }

  const inviteURL = latestInvite
    ? `${window.location.origin}/invitations/${latestInvite.token}`
    : "";

  return (
    <section className="grid gap-6 lg:grid-cols-[1fr_360px]">
      <div>
        <h1 className="text-3xl font-black">Tim Komunitas</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Akses diberikan berdasarkan peran pada komunitas ini.
        </p>
        <div className="mt-6 grid gap-3">
          {members.map((member) => (
            <Card key={member.id}>
              <CardContent className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center">
                <div className="flex min-w-0 items-center gap-4">
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-xl border-2 border-neo-border bg-neo-yellow font-black">
                    {member.user.name.slice(0, 1).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate font-black">{member.user.name}</p>
                    <p className="truncate text-xs text-muted-foreground">{member.user.email}</p>
                  </div>
                </div>
                <div className="flex w-full min-w-0 items-center gap-2 sm:ml-auto sm:w-auto">
                  {(actorRole === "owner" ||
                    actorRole === "admin" ||
                    actorRole === "platform_admin") &&
                  member.role !== "owner" &&
                  member.user_id !== user?.id ? (
                    <>
                      <select
                        aria-label={`Peran ${member.user.name}`}
                        value={member.role}
                        disabled={changingMember === member.id}
                        onChange={(event) =>
                          void changeRole(member, event.target.value as InviteRole)
                        }
                        className="h-9 min-w-0 flex-1 rounded-lg border-2 border-neo-border bg-white px-2 text-xs font-black sm:flex-none"
                      >
                        {actorRole !== "admin" && <option value="admin">Admin</option>}
                        <option value="event_manager">Event Manager</option>
                        <option value="checkin_staff">Check-in Staff</option>
                        <option value="moderator">Moderator</option>
                        <option value="mentor">Mentor/Ustadz/Pelatih</option>
                      </select>
                      <Button
                        type="button"
                        size="sm"
                        variant="destructive"
                        disabled={changingMember === member.id}
                        onClick={() => void remove(member)}
                      >
                        Hapus
                      </Button>
                    </>
                  ) : (
                    <span className="rounded-lg border-2 border-neo-border bg-neo-purple px-2 py-1 text-xs font-black">
                      {member.role}
                    </span>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <Card className="h-fit bg-neo-yellow">
        <CardHeader><CardTitle>Undang anggota</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={handleInvite} className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="invite-email">Email</Label>
              <Input
                id="invite-email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="invite-role">Peran</Label>
              <select
                id="invite-role"
                value={role}
                onChange={(event) => setRole(event.target.value as InviteRole)}
                className="h-10 rounded-xl border-2 border-neo-border bg-white px-3 text-sm font-bold"
              >
                <option value="admin">Admin</option>
                <option value="event_manager">Event Manager</option>
                <option value="checkin_staff">Check-in Staff</option>
                <option value="moderator">Moderator</option>
                <option value="mentor">Mentor/Ustadz/Pelatih</option>
              </select>
            </div>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Membuat..." : "Buat undangan"}
            </Button>
          </form>
          {latestInvite && (
            <div className="mt-5 rounded-xl border-2 border-neo-border bg-white p-3">
              <p className="text-xs font-black">Link undangan—ditampilkan sekali</p>
              <p className="mt-2 break-all text-xs">{inviteURL}</p>
            </div>
          )}
        </CardContent>
      </Card>
    </section>
  );
}
