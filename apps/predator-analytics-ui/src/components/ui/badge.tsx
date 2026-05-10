import * as React from "react"
import { cn } from "../../utils/cn"

const badgeVariants = {
  default: "border-transparent bg-primary text-primary-foreground hover:bg-primary/80",
  secondary: "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
  destructive: "border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80",
  outline: "border border-slate-700/70 text-slate-200 bg-transparent",
  neon: "border border-indigo-500/50 bg-indigo-500/20 text-indigo-400 ",
  cyber: "border border-emerald-500/50 bg-emerald-500/10 text-emerald-400 uppercase tracking-widest font-black ",
  holographic: "border border-cyan-500/40 bg-cyan-500/10 text-cyan-400  ",
  success: "border-transparent bg-emerald-500/10 text-emerald-400",
  warning: "border-transparent bg-amber-500/10 text-amber-400"
} as const;

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: keyof typeof badgeVariants;
}

function Badge({ className, variant = "default", ...props }: BadgeProps) {
  return (
    <div
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
        badgeVariants[variant || "default"],
        className
      )}
      {...props}
    />
  )
}

export { Badge }

