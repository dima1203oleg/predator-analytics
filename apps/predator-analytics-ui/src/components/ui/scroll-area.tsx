import * as React from "react"
import { cn } from "@/lib/utils"

// 🦁 PREDATOR — Заглушка для ScrollArea (поки не встановлено Radix)
// Ми робимо нативну прокрутку з кастомним стилем
const ScrollArea = React.forwardRef<
    HTMLDivElement,
    React.HTMLAttributes<HTMLDivElement>
>(({ className, children, ...props }, ref) => (
    <div
        ref={ref}
        className={cn("relative overflow-auto scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-transparent", className)}
        {...props}
    >
        {children}
    </div>
))
ScrollArea.displayName = "ScrollArea"

export { ScrollArea }
