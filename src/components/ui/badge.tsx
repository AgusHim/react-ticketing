import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center justify-center rounded-lg border-2 border-neo-border px-2.5 py-1 text-[11px] font-extrabold uppercase tracking-wide w-fit whitespace-nowrap shrink-0 [&>svg]:size-3 gap-1 [&>svg]:pointer-events-none focus-visible:ring-4 focus-visible:ring-neo-purple-solid/30 transition-colors overflow-hidden",
  {
    variants: {
      variant: {
        default:
          "bg-neo-yellow-solid text-neo-border",
        secondary:
          "bg-neo-purple text-neo-border",
        destructive:
          "bg-destructive text-white",
        outline:
          "bg-white text-foreground [a&]:hover:bg-accent",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

function Badge({
  className,
  variant,
  asChild = false,
  ...props
}: React.ComponentProps<"span"> &
  VariantProps<typeof badgeVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot : "span"

  return (
    <Comp
      data-slot="badge"
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    />
  )
}

export { Badge, badgeVariants }
