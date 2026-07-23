import React from 'react';
import { cn } from '@/utils/cn';
export const Button = React.forwardRef<HTMLButtonElement, any>(({ className, variant, size, ...props }, ref) => (
    <button ref={ref} className={cn("px-4 py-2 bg-blue-500 text-white rounded", className)} {...props} />
));
Button.displayName = "Button";
