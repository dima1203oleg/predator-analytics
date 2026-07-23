import React from 'react';
import { cn } from '@/utils/cn';
export function Badge({ className, variant, ...props }: any) {
    return <div className={cn("inline-block px-2 py-1 text-xs font-bold rounded", className)} {...props} />;
}
