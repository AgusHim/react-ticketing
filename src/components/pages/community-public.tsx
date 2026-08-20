import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  getCommunity,
  getCommunityFollowState,
  setCommunityFollowing,
} from "@/api/community-api";
import type { Community } from "@/types/community";
import { Card, CardContent } from "@/components/ui/card";
import { IconMapPin, IconUsersGroup } from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";
import { getCommunityEvents, type EventModel } from "@/api/event-api";
import { PublicEventCard } from "@/components/public-event-card";
import { usePublicMetadata } from "@/hooks/use-public-metadata";
import { SharePageButton } from "@/components/share-page-button";

export default function CommunityPublicPage() {
  const { slug = "" } = useParams();
  const [community, setCommunity] = useState<Community | null>(null);
  const [error, setError] = useState("");
  const [following, setFollowing] = useState(false);
  const [isFollowLoading, setIsFollowLoading] = useState(false);
  const [events, setEvents] = useState<EventModel[]>([]);
  const { user, isInitialized } = useAuth();
  const communityID = community?.id;
  usePublicMetadata(
    community
      ? {
          title: community.name,
          description:
            community.description || `Ikuti aktivitas ${community.name} di usloop.id`,
          image: community.cover_url || community.logo_url,
          type: "website",
        }
      : null,
  );

  useEffect(() => {
    getCommunity(slug)
      .then(setCommunity)
      .catch(() => setError("Komunitas tidak ditemukan"));
    getCommunityEvents(slug)
      .then(setEvents)
      .catch(() => setEvents([]));
  }, [slug]);

  useEffect(() => {
    if (!communityID || !user) return;
    getCommunityFollowState(communityID)
      .then(setFollowing)
      .catch(() => toast.error("Gagal memuat status follow"));
  }, [communityID, user]);

  async function toggleFollow() {
    if (!community) return;
    setIsFollowLoading(true);
    try {
      const next = await setCommunityFollowing(community.id, !following);
      setFollowing(next);
      setCommunity((current) =>
        current
          ? {
              ...current,
              follower_count: Math.max(
                0,
                (current.follower_count || 0) + (next ? 1 : -1),
              ),
            }
          : current,
      );
    } catch {
      toast.error("Gagal mengubah status follow");
    } finally {
      setIsFollowLoading(false);
    }
  }

  if (error) {
    return <main className="mx-auto max-w-4xl p-8 text-center font-bold">{error}</main>;
  }
  if (!community) {
    return <main className="mx-auto max-w-4xl p-8 text-center font-bold">Memuat komunitas...</main>;
  }

  return (
    <main>
      <section className="border-b-2 border-neo-border bg-neo-purple">
        <div className="mx-auto max-w-5xl px-4 py-12 md:py-20">
          <span className="rounded-lg border-2 border-neo-border bg-white px-3 py-1 text-xs font-black uppercase">
            {community.type}
          </span>
          <h1 className="mt-5 max-w-3xl text-4xl font-black md:text-6xl">{community.name}</h1>
          <p className="mt-4 max-w-2xl text-base font-medium text-muted-foreground">
            {community.description || "Komunitas di usloop.id"}
          </p>
          <div className="mt-6 flex flex-wrap items-center gap-3">
            {isInitialized && user ? (
              <Button
                type="button"
                variant={following ? "outline" : "default"}
                disabled={isFollowLoading}
                onClick={() => void toggleFollow()}
              >
                {isFollowLoading
                  ? "Memproses..."
                  : following
                    ? "Berhenti mengikuti"
                    : "Ikuti komunitas"}
              </Button>
            ) : (
              <Button asChild>
                <Link to="/login">Masuk untuk mengikuti</Link>
              </Button>
            )}
            <span className="text-sm font-black">
              {community.follower_count || 0} pengikut
            </span>
            <SharePageButton title={community.name} />
          </div>
        </div>
      </section>
      <section className="mx-auto grid max-w-5xl gap-5 px-4 py-8 md:grid-cols-3">
        <Card className="md:col-span-2">
          <CardContent className="p-6">
            <h2 className="text-xl font-black">Tentang komunitas</h2>
            <p className="mt-3 whitespace-pre-line text-sm leading-6 text-muted-foreground">
              {community.description || "Informasi komunitas akan segera tersedia."}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="grid gap-4 p-6 text-sm font-bold">
            <div className="flex items-center gap-3">
              <IconUsersGroup className="size-5" />
              {community.follower_count || 0} pengikut aktif
            </div>
            <div className="flex items-center gap-3">
              <IconMapPin className="size-5" />
              {community.location || "Indonesia"}
            </div>
          </CardContent>
        </Card>
      </section>
      <section className="mx-auto max-w-5xl px-4 pb-12">
        <h2 className="text-2xl font-black">Event Komunitas</h2>
        {events.length === 0 ? (
          <p className="mt-4 text-sm text-muted-foreground">
            Belum ada event published dari komunitas ini.
          </p>
        ) : (
          <div className="mt-5 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {events.map((event) => (
              <PublicEventCard key={event.id} event={event} />
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
