import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { register } from "@/api/user-api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export default function RegisterPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    try {
      await register(form.name, form.email, form.password);
      toast.success("Akun berhasil dibuat. Silakan masuk.");
      navigate("/login");
    } catch (error: unknown) {
      const message = axios.isAxiosError(error)
        ? error.response?.data?.message
        : undefined;
      toast.error(message || "Gagal membuat akun");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="neo-dots flex min-h-[calc(100svh-4rem)] items-center justify-center p-4 py-10">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Buat akun Usloop</CardTitle>
          <CardDescription>
            Ikuti komunitas, daftar event, dan kelola tiketmu.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="grid gap-5">
            <div className="grid gap-2">
              <Label htmlFor="register-name">Nama</Label>
              <Input
                id="register-name"
                value={form.name}
                onChange={(event) => setForm({ ...form, name: event.target.value })}
                autoComplete="name"
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="register-email">Email</Label>
              <Input
                id="register-email"
                type="email"
                value={form.email}
                onChange={(event) => setForm({ ...form, email: event.target.value })}
                autoComplete="email"
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="register-password">Password</Label>
              <Input
                id="register-password"
                type="password"
                value={form.password}
                onChange={(event) => setForm({ ...form, password: event.target.value })}
                autoComplete="new-password"
                minLength={8}
                required
              />
              <p className="text-xs text-muted-foreground">Minimal 8 karakter.</p>
            </div>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Membuat akun..." : "Daftar"}
            </Button>
            <p className="text-center text-sm">
              Sudah punya akun?{" "}
              <Link to="/login" className="font-bold underline">Masuk</Link>
            </p>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}
