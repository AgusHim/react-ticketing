import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getFollowingCommunities } from "@/api/community-api";
import type { Community } from "@/types/community";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export default function AccountFollowingPage() {
  const [communities, setCommunities] = useState<Community[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    getFollowingCommunities()
      .then(setCommunities)
      .catch(() => toast.error("Gagal memuat komunitas yang diikuti"))
      .finally(() => setIsLoading(false));
  }, []);

  return (
    <section>
      <h1 className="text-3xl font-black">Komunitas Diikuti</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Akses cepat ke komunitas dan aktivitas yang kamu ikuti.
      </p>
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {isLoading ? (
          <p className="font-bold">Memuat...</p>
        ) : communities.length === 0 ? (
          <Card className="sm:col-span-2">
            <CardContent className="p-6 text-sm text-muted-foreground">
              Belum mengikuti komunitas.
            </CardContent>
          </Card>
        ) : (
          communities.map((community) => (
            <Card key={community.id} className="bg-neo-purple">
              <CardHeader>
                <span className="text-xs font-black uppercase">{community.type}</span>
                <CardTitle>{community.name}</CardTitle>
              </CardHeader>
              <CardContent>
                <Button asChild size="sm">
                  <Link to={`/communities/${community.slug}`}>Buka komunitas</Link>
                </Button>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </section>
  );
}
