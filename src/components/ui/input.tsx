import * as React from "react"

import { cn } from "@/lib/utils"

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground border-neo-border flex h-10 w-full min-w-0 rounded-xl border-2 bg-white px-3 py-1 text-base font-medium shadow-none transition-[color,box-shadow] outline-none file:mr-3 file:inline-flex file:h-8 file:rounded-lg file:border-2 file:border-neo-border file:bg-neo-mint file:px-3 file:text-sm file:font-bold disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-muted disabled:opacity-60 md:text-sm",
        "focus-visible:ring-4 focus-visible:ring-neo-purple-solid/30",
        "aria-invalid:border-destructive aria-invalid:ring-destructive/20",
        className
      )}
      {...props}
    />
  )
}

export { Input }
