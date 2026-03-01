"use client"

import * as React from "react";
import { cn } from "../../utils/cn";

const TabsContext = React.createContext<{
    value: string;
    onValueChange: (v: string) => void;
} | null>(null);

const Tabs = ({
    children,
    defaultValue,
    value: controlledValue,
    onValueChange,
    className
}: {
    children: React.ReactNode,
    defaultValue?: string,
    value?: string,
    onValueChange?: (v: string) => void,
    className?: string
}) => {
    const [internalValue, setInternalValue] = React.useState(defaultValue || "");
    const value = controlledValue !== undefined ? controlledValue : internalValue;

    const handleValueChange = (v: string) => {
        if (controlledValue === undefined) {
            setInternalValue(v);
        }
        onValueChange?.(v);
    };

    return (
        <TabsContext.Provider value={{ value, onValueChange: handleValueChange }}>
            <div className={cn("w-full", className)}>
                {children}
            </div>
        </TabsContext.Provider>
    );
};

const TabsList = React.forwardRef<
    HTMLDivElement,
    React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
    <div
        ref={ref}
        role="tablist"
        className={cn(
            "inline-flex h-10 items-center justify-center rounded-md bg-muted p-1 text-muted-foreground",
            className
        )}
        {...props}
    />
))
TabsList.displayName = "TabsList"

const TabsTrigger = React.forwardRef<
    HTMLButtonElement,
    React.ButtonHTMLAttributes<HTMLButtonElement> & { value: string }
>(({ className, value, onClick, ...props }, ref) => {
    const context = React.useContext(TabsContext)
    const isActive = context?.value === value

    return (
        <button
            ref={ref}
            role="tab"
            aria-selected={!!isActive}
            data-state={isActive ? "active" : "inactive"}
            onClick={(e) => {
                context?.onValueChange(value)
                onClick?.(e)
            }}
            className={cn(
                "inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm",
                className
            )}
            {...props}
        />
    )
})
TabsTrigger.displayName = "TabsTrigger"

const TabsContent = React.forwardRef<
    HTMLDivElement,
    React.HTMLAttributes<HTMLDivElement> & { value: string }
>(({ className, value, ...props }, ref) => {
    const context = React.useContext(TabsContext)
    if (context?.value !== value) return null

    return (
        <div
            ref={ref}
            role="tabpanel"
            data-state={context.value === value ? "active" : "inactive"}
            className={cn(
                "mt-2 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                className
            )}
            {...props}
        />
    )
})
TabsContent.displayName = "TabsContent"

export { Tabs, TabsContent, TabsList, TabsTrigger };
