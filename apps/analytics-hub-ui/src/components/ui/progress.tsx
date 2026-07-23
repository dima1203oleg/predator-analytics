import React from 'react';
import { cn } from '@/utils/cn';
export function Progress({ className, value, ...props }: any) {
    return <div className={cn("w-full bg-gray-200 rounded", className)} {...props}>
        <div className="bg-blue-500 h-full rounded" style={{ width: `${value || 0}%` }} />
    </div>;
}
