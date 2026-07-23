import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl border-2 border-neo-border text-sm font-bold transition-all shadow-[3px_3px_0_#1a1a1a] hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[5px_5px_0_#1a1a1a] active:translate-x-[3px] active:translate-y-[3px] active:shadow-none disabled:pointer-events-none disabled:opacity-50 disabled:shadow-none [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:ring-4 focus-visible:ring-neo-purple-solid/40 aria-invalid:border-destructive",
  {
    variants: {
      variant: {
        default:
          "bg-neo-yellow-solid text-neo-border hover:bg-[#ffd84d]",
        destructive:
          "bg-destructive text-white hover:bg-red-500",
        outline:
          "bg-white text-neo-border hover:bg-neo-yellow",
        secondary:
          "bg-neo-purple text-neo-border hover:bg-[#d7d2fa]",
        ghost:
          "border-transparent bg-transparent shadow-none hover:translate-x-0 hover:translate-y-0 hover:border-neo-border hover:bg-neo-yellow hover:shadow-none active:translate-x-0 active:translate-y-0",
        link: "border-transparent bg-transparent p-0 text-neo-purple-solid shadow-none underline-offset-4 hover:translate-x-0 hover:translate-y-0 hover:underline hover:shadow-none",
      },
      size: {
        default: "h-10 px-4 py-2 has-[>svg]:px-3",
        sm: "h-9 gap-1.5 px-3 has-[>svg]:px-2.5",
        lg: "h-12 px-6 has-[>svg]:px-4",
        icon: "size-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot : "button"

  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
