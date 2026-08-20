import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import axios from "axios";
import { acceptCommunityInvitation } from "@/api/community-api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function AcceptInvitationPage() {
  const { token = "" } = useParams();
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  async function accept() {
    setStatus("loading");
    try {
      await acceptCommunityInvitation(token);
      setStatus("success");
      setMessage("Undangan berhasil diterima.");
    } catch (error: unknown) {
      const errorMessage = axios.isAxiosError(error)
        ? error.response?.data?.error?.message
        : undefined;
      setStatus("error");
      setMessage(errorMessage || "Undangan tidak dapat digunakan.");
    }
  }

  return (
    <main className="flex min-h-svh items-center justify-center bg-bg-app p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Undangan komunitas</CardTitle>
          <CardDescription>
            Undangan hanya dapat diterima oleh akun dengan email yang dituju.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          {message && (
            <p className={`rounded-xl border-2 border-neo-border p-3 text-sm font-bold ${
              status === "success" ? "bg-neo-mint" : "bg-neo-pink"
            }`}>
              {message}
            </p>
          )}
          {status === "success" ? (
            <Button asChild><Link to="/account/communities">Lihat komunitas</Link></Button>
          ) : (
            <Button type="button" onClick={accept} disabled={status === "loading" || !token}>
              {status === "loading" ? "Memproses..." : "Terima undangan"}
            </Button>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
