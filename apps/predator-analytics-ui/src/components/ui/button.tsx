import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/utils/cn"

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 focus-visible:ring-rose-500/50 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg shadow-primary/20",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90 shadow-lg shadow-destructive/20",
        outline: "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
        neon: "bg-indigo-950/40 text-indigo-400 border border-indigo-500/50 hover:bg-indigo-900/40 hover:border-indigo-400 hover:shadow-[0_0_20px_rgba(99,102,241,0.3),inset_0_0_15px_rgba(99,102,241,0.2)] hover:-translate-y-0.5 transition-all duration-300 tracking-wide",
        cyber: "bg-[#090b10] border border-[#10b981]/40 text-[#10b981] hover:bg-[#10b981]/10 hover:border-[#10b981] shadow-[inset_0_0_15px_rgba(16,185,129,0.1)] hover:shadow-[0_0_20px_rgba(16,185,129,0.3),inset_0_0_20px_rgba(16,185,129,0.2)] uppercase tracking-[0.2em] text-[10px] font-black transition-all duration-300 relative overflow-hidden before:absolute before:inset-0 before:bg-gradient-to-r before:from-transparent before:via-[#10b981]/20 before:to-transparent before:-translate-x-full hover:before:animate-[shimmer_1.5s_infinite] after:absolute after:bottom-0 after:left-0 after:h-[1px] after:w-0 after:bg-[#10b981] hover:after:w-full after:transition-all after:duration-300",
        holographic: "bg-[#06141d] border border-[#06b6d4]/40 text-[#06b6d4] hover:bg-[#06b6d4]/15 hover:border-[#06b6d4] shadow-[inset_0_0_15px_rgba(6,182,212,0.1)] hover:shadow-[0_0_20px_rgba(6,182,212,0.3),inset_0_0_20px_rgba(6,182,212,0.2)] uppercase tracking-wider text-[11px] font-bold transition-all duration-300 relative overflow-hidden backdrop-blur-sm",
        sovereign: "bg-rose-950/40 border border-rose-500/40 text-rose-500 hover:bg-rose-900/40 hover:border-rose-400 hover:text-white hover:shadow-[0_0_20px_rgba(225,29,72,0.4),inset_0_0_15px_rgba(225,29,72,0.3)] hover:-translate-y-0.5 uppercase tracking-[0.2em] text-[10px] font-black transition-all duration-300 relative overflow-hidden",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
  VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
        aria-disabled={props.disabled}
        role={asChild ? undefined : "button"}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
