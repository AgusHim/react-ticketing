import { Link, useParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { getPortalCommunity, type PortalCommunity } from "@/api/community-api";
import { toast } from "sonner";

export default function CommunityPortalDashboardPage() {
  const { communityId = "" } = useParams();
  const [portal, setPortal] = useState<PortalCommunity | null>(null);

  useEffect(() => {
    getPortalCommunity(communityId)
      .then(setPortal)
      .catch(() => toast.error("Gagal memuat komunitas"));
  }, [communityId]);

  return (
    <section>
      <h1 className="text-3xl font-black">
        {portal?.community.name || "Portal Komunitas"}
      </h1>
      <p className="mt-2 text-sm text-muted-foreground">
        {portal
          ? `${portal.community.type} · ${portal.community.location || "Indonesia"} · role ${portal.role}`
          : "Memuat informasi tenant..."}
      </p>
      <div className="mt-6 grid gap-4 md:grid-cols-3">
        <Card className="bg-neo-yellow">
          <CardHeader><CardTitle>Tim</CardTitle></CardHeader>
          <CardContent>
            <Button asChild size="sm">
              <Link to={`/portal/${communityId}/members`}>Kelola anggota</Link>
            </Button>
          </CardContent>
        </Card>
        <Card className="bg-neo-mint">
          <CardHeader><CardTitle>Profil</CardTitle></CardHeader>
          <CardContent>
            <Button asChild size="sm">
              <Link to={`/portal/${communityId}/profile`}>Edit profil publik</Link>
            </Button>
          </CardContent>
        </Card>
        <Card className="bg-neo-purple">
          <CardHeader><CardTitle>Jamaah</CardTitle></CardHeader>
          <CardContent className="text-sm text-muted-foreground">CRM tersedia pada fase berikutnya.</CardContent>
        </Card>
      </div>
    </section>
  );
}
