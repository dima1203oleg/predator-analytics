import React from 'react';
import { cn } from '@/utils/cn';
export function HoloCard({ className, title, variant, children, ...props }: any) {
    return <div className={cn("border border-blue-500/30 p-4 rounded-xl", className)} {...props}>
        {title && <h3 className="text-lg font-bold mb-2">{title}</h3>}
        {children}
    </div>;
}
