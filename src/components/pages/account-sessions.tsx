import { useEffect, useState } from "react";
import {
  getAuthSessions,
  revokeAuthSession,
  type AuthSession,
} from "@/api/user-api";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { IconDeviceDesktop, IconDeviceMobile } from "@tabler/icons-react";
import { toast } from "sonner";

export default function AccountSessionsPage() {
  const [sessions, setSessions] = useState<AuthSession[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [revoking, setRevoking] = useState("");

  useEffect(() => {
    getAuthSessions()
      .then(setSessions)
      .catch(() => toast.error("Gagal memuat sesi perangkat"))
      .finally(() => setIsLoading(false));
  }, []);

  async function revoke(session: AuthSession) {
    setRevoking(session.id);
    try {
      await revokeAuthSession(session.id);
      setSessions((current) => current.filter((item) => item.id !== session.id));
      toast.success("Sesi berhasil dicabut");
    } catch {
      toast.error("Gagal mencabut sesi");
    } finally {
      setRevoking("");
    }
  }

  return (
    <section className="max-w-3xl">
      <h1 className="text-3xl font-black">Sesi Perangkat</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Tinjau perangkat yang masih dapat memperbarui sesi account ini.
      </p>
      <div className="mt-6 grid gap-3">
        {isLoading ? (
          <p className="font-bold">Memuat...</p>
        ) : sessions.length === 0 ? (
          <Card>
            <CardContent className="p-5 text-sm text-muted-foreground">
              Tidak ada refresh session aktif.
            </CardContent>
          </Card>
        ) : (
          sessions.map((session) => {
            const mobile = /mobile|android|iphone/i.test(session.user_agent);
            const DeviceIcon = mobile ? IconDeviceMobile : IconDeviceDesktop;
            return (
              <Card key={session.id}>
                <CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center">
                  <span className="neo-icon-tile size-11 bg-neo-purple">
                    <DeviceIcon className="size-6" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-black">
                      {session.user_agent || "Perangkat tidak dikenal"}
                      {session.current && " · sesi saat ini"}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      IP {session.ip_address || "tidak tersedia"} · terakhir aktif{" "}
                      {new Date(session.last_used_at).toLocaleString("id-ID")}
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={revoking === session.id}
                    onClick={() => void revoke(session)}
                  >
                    {revoking === session.id ? "Mencabut..." : "Cabut sesi"}
                  </Button>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </section>
  );
}
