import * as React from "react"
import { cn } from "../../utils/cn"

const badgeVariants = {
  default: "border-transparent bg-primary text-primary-foreground shadow-[0_0_10px_rgba(255,255,255,0.1)]",
  secondary: "border-transparent bg-secondary text-secondary-foreground",
  destructive: "border-transparent bg-destructive/10 text-destructive border-destructive/20 shadow-[inset_0_0_10px_rgba(220,38,38,0.1)]",
  outline: "border border-slate-700/70 text-slate-200 bg-black/40 backdrop-blur-sm",
  neon: "border border-indigo-500/50 bg-indigo-950/40 text-indigo-400 shadow-[0_0_10px_rgba(99,102,241,0.2),inset_0_0_10px_rgba(99,102,241,0.1)] tracking-widest",
  cyber: "border border-[#10b981]/50 bg-[#090b10] text-[#10b981] uppercase tracking-[0.15em] font-black shadow-[0_0_15px_rgba(16,185,129,0.15),inset_0_0_15px_rgba(16,185,129,0.1)] relative overflow-hidden before:absolute before:inset-0 before:bg-[url('/scanline.png')] before:opacity-10",
  holographic: "border border-[#06b6d4]/40 bg-[#06141d] text-[#06b6d4] uppercase tracking-wider font-bold shadow-[0_0_15px_rgba(6,182,212,0.15),inset_0_0_15px_rgba(6,182,212,0.1)] backdrop-blur-md",
  success: "border-transparent bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-[0_0_10px_rgba(16,185,129,0.1)]",
  warning: "border-transparent bg-amber-500/10 text-amber-400 border border-amber-500/20 shadow-[0_0_10px_rgba(245,158,11,0.1)]"
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

