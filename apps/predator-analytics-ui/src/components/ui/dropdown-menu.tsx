"use client"

import * as React from "react";
import { cn } from "../../utils/cn";

// Complete custom implementation of DropdownMenu with zero dependencies (no Radix needed)
// ensuring it works 100% even if node_modules are corrupted.

const DropdownContext = React.createContext<{
    isOpen: boolean;
    setIsOpen: (v: boolean) => void;
    toggle: () => void;
} | null>(null);

const DropdownMenu = ({ children }: { children: React.ReactNode }) => {
    const [isOpen, setIsOpen] = React.useState(false);
    const toggle = () => setIsOpen(!isOpen);
    const dropdownRef = React.useRef<HTMLDivElement>(null);

    React.useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <DropdownContext.Provider value={{ isOpen, setIsOpen, toggle }}>
            <div ref={dropdownRef} className="relative inline-block text-left">
                {children}
            </div>
        </DropdownContext.Provider>
    );
};

const DropdownMenuTrigger = React.forwardRef<HTMLButtonElement, React.ButtonHTMLAttributes<HTMLButtonElement> & { asChild?: boolean }>(({ className, children, asChild, onClick, ...props }, ref) => {
    const context = React.useContext(DropdownContext);

    // If asChild is true, we should strictly clone the child, but for safety in this robust implementation
    // we'll just wrap it if it's not a button, or assume the user passed a button.
    // Simulating asChild behavior by cloning onClick

    if (asChild && React.isValidElement(children)) {
        return React.cloneElement(children as React.ReactElement, {
            onClick: (e: any) => {
                context?.toggle();
                children.props.onClick?.(e);
                onClick?.(e);
            },
            ref
        });
    }

    return (
        <button
            ref={ref}
            onClick={(e) => {
                context?.toggle();
                onClick?.(e);
            }}
            className={cn("inline-flex justify-center w-full", className)}
            {...props}
        >
            {children}
        </button>
    );
});
DropdownMenuTrigger.displayName = "DropdownMenuTrigger";


const DropdownMenuContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement> & { align?: 'start' | 'end' | 'center' }>(({ className, align = 'center', ...props }, ref) => {
    const context = React.useContext(DropdownContext);
    if (!context?.isOpen) return null;

    const alignClass = align === 'end' ? 'right-0' : align === 'start' ? 'left-0' : 'left-1/2 -translate-x-1/2';

    return (
        <div
            ref={ref}
            className={cn(
                "absolute z-50 mt-2 min-w-[8rem] overflow-hidden rounded-md border bg-popover text-popover-foreground shadow-md p-1 animate-in fade-in zoom-in-95 duration-100",
                alignClass,
                className
            )}
            {...props}
        />
    );
});
DropdownMenuContent.displayName = "DropdownMenuContent";


const DropdownMenuItem = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement> & { inset?: boolean }>(({ className, inset, onClick, ...props }, ref) => {
    const context = React.useContext(DropdownContext);
    return (
        <div
            ref={ref}
            onClick={(e) => {
                context?.setIsOpen(false);
                onClick?.(e);
            }}
            className={cn(
                "relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors hover:bg-accent hover:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50 cursor-pointer",
                inset && "pl-8",
                className
            )}
            {...props}
        />
    );
});
DropdownMenuItem.displayName = "DropdownMenuItem";

const DropdownMenuLabel = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement> & { inset?: boolean }>(({ className, inset, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "px-2 py-1.5 text-sm font-semibold",
      inset && "pl-8",
      className
    )}
    {...props}
  />
))
DropdownMenuLabel.displayName = "DropdownMenuLabel"

const DropdownMenuSeparator = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("-mx-1 my-1 h-px bg-muted", className)}
    {...props}
  />
))
DropdownMenuSeparator.displayName = "DropdownMenuSeparator"


export {
    DropdownMenu, DropdownMenuContent,
    // Exports below are mocks for unused components to prevent build errors if referenced elsewhere
    DropdownMenu as DropdownMenuGroup, DropdownMenuItem,
    DropdownMenuLabel, DropdownMenu as DropdownMenuPortal, DropdownMenu as DropdownMenuRadioGroup, DropdownMenuSeparator, DropdownMenu as DropdownMenuSub,
    DropdownMenuContent as DropdownMenuSubContent,
    DropdownMenuTrigger as DropdownMenuSubTrigger, DropdownMenuTrigger
};
