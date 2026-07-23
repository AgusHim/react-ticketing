import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useAuth } from "@/context/AuthContext"
import { useState } from "react"

export function LoginForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const [data, setData] = useState<{email:string, password:string}>({
    "email":"",
    "password":""
  });
  const { handleLogin } = useAuth();
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setData({
            ...data,
            [name]: value,
        });
    };

    const handleSubmit = async(e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        handleLogin(data.email,data.password);
    };

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card>
        <CardHeader>
          <CardTitle>Selamat Datang!</CardTitle>
          <CardDescription>
            Masukkan email dan password untuk melanjutkan.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit}>
            <div className="flex flex-col gap-6">
              <div className="grid gap-3">
                  <Label htmlFor="email" className="font-bold">Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="nama@contoh.com"
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="grid gap-3">
                <div className="flex items-center">
                  <Label htmlFor="password" className="font-bold">Password</Label>
                </div>
                <Input id="password" name="password" type="password" required onChange={handleChange} />
              </div>
              <div className="flex flex-col gap-3">
                <Button type="submit" className="w-full">
                  Masuk
                </Button>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
