import { useEffect, useState } from 'react';
import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { Textarea } from "@/components/ui/textarea";
import { getDarisiniSetting, updateDarisiniSetting } from "@/api/settings-api";
import { toast } from "sonner";
import { ImportExcel } from "../import-excel";

export default function SettingsPage() {
  const [cookie, setCookie] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    getDarisiniSetting()
      .then((data) => setCookie(data.cookie || ''))
      .catch(() => toast.error('Gagal mengambil setting Darisini'))
      .finally(() => setIsLoading(false));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const updated = await updateDarisiniSetting(cookie);
      setCookie(updated.cookie || '');
      toast.success('Cookie Darisini berhasil disimpan');
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Gagal menyimpan cookie Darisini');
    } finally {
      setIsSaving(false);
    }
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
        <SiteHeader title="Settings" />
        <div className="flex flex-1 flex-col">
          <div className="@container/main flex flex-1 flex-col gap-2">
            <div className="flex flex-col gap-6 px-4 py-4 md:px-6 md:py-6">
              <ImportExcel />
              <form onSubmit={handleSubmit} className="neo-surface w-full max-w-3xl bg-neo-purple p-6">
                <div className="flex flex-col gap-2">
                  <h2 className="text-xl font-extrabold">Darisini Scanner</h2>
                  <p className="text-sm text-muted-foreground">Cookie ini dipakai backend untuk scan tiket ke Darisini setelah goodie bag dikonfirmasi.</p>
                </div>
                <div className="mt-5 flex flex-col gap-2">
                  <Label htmlFor="darisini-cookie">Cookie</Label>
                  <Textarea
                    id="darisini-cookie"
                    value={cookie}
                    onChange={(e) => setCookie(e.target.value)}
                    disabled={isLoading || isSaving}
                    className="min-h-40 font-mono text-xs"
                    placeholder="__Host-next-auth.csrf-token=...; __Secure-next-auth.session-token=..."
                  />
                </div>
                <div className="mt-5 flex justify-end">
                  <Button type="submit" disabled={isLoading || isSaving}>
                    {isSaving ? 'Menyimpan...' : 'Simpan Cookie'}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
