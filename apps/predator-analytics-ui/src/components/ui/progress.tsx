import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "../../utils/cn"

const progressVariants = cva(
  "relative h-4 w-full overflow-hidden rounded-full",
  {
    variants: {
      variant: {
        default: "bg-secondary",
        cyber: "bg-slate-900 border border-white/5",
        neon: "bg-indigo-950/50 border border-indigo-500/20",
        holographic: "bg-cyan-950/30 border border-cyan-500/20 backdrop-blur-md",
      }
    },
    defaultVariants: {
      variant: "default",
    }
  }
)

const indicatorVariants = cva(
  "h-full w-full flex-1 transition-all duration-500 ease-in-out",
  {
    variants: {
      variant: {
        default: "bg-primary",
        cyber: "bg-emerald-500 shadow-[0_0_10px_#10b981]",
        neon: "bg-gradient-to-r from-indigo-500 via-purple-500 to-fuchsia-500 shadow-[0_0_15px_rgba(217,70,239,0.5)]",
        holographic: "bg-gradient-to-r from-cyan-400 to-blue-500 shadow-[0_0_20px_rgba(6,182,212,0.6)]",
      }
    },
    defaultVariants: {
      variant: "default",
    }
  }
)

export interface ProgressProps
  extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof progressVariants> {
  value?: number
  indicatorClassName?: string
}

const Progress = React.forwardRef<HTMLDivElement, ProgressProps>(
  ({ className, variant, value, indicatorClassName, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(progressVariants({ variant, className }))}
      {...props}
    >
      <div
        className={cn(indicatorVariants({ variant }), indicatorClassName)}
        style={{ transform: `translateX(-${100 - (value || 0)}%)` }}
      />
    </div>
  )
)
Progress.displayName = "Progress"

export { Progress }
