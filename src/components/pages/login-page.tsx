import { LoginForm } from "@/components/login-form"
import { IconTicket } from "@tabler/icons-react"

export default function LoginPage() {
  return (
    <div className="neo-dots flex min-h-svh w-full items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-md">
        <div className="mb-7 text-center">
          <span className="neo-icon-tile mb-4 size-16 bg-neo-yellow-solid">
            <IconTicket className="size-8" stroke={2.2} />
          </span>
          <h1 className="text-3xl font-black">YN Solo Event</h1>
          <p className="mt-2 text-sm text-muted-foreground">Masuk ke pusat kendali ticketing.</p>
        </div>
        <LoginForm />
      </div>
    </div>
  )
}
