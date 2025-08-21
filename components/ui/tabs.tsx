"use client"

import * as React from "react"
import * as TabsPrimitive from "@radix-ui/react-tabs"

import { cn } from "@/lib/utils"

const Tabs = TabsPrimitive.Root

const TabsList = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.List>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.List>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.List
    ref={ref}
    className={cn(
      "inline-flex h-auto items-center justify-start gap-1 rounded-xl bg-muted/60 backdrop-blur-sm p-1.5 text-muted-foreground shadow-sm border border-muted-foreground/10",
      "w-full flex-wrap sm:flex-nowrap sm:justify-center",
      "transition-all duration-200",
      className
    )}
    {...props}
  />
))
TabsList.displayName = TabsPrimitive.List.displayName

const TabsTrigger = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Trigger
    ref={ref}
    className={cn(
      "inline-flex items-center justify-center whitespace-nowrap rounded-lg px-3 py-2 sm:px-4 sm:py-2.5",
      "text-xs sm:text-sm font-medium",
      "ring-offset-background transition-all duration-300 ease-out",
      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
      "disabled:pointer-events-none disabled:opacity-50",
      "hover:bg-background/60 hover:text-foreground/80",
      "data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-md",
      "data-[state=active]:border data-[state=active]:border-muted-foreground/10",
      "relative overflow-hidden",
      "before:absolute before:inset-0 before:bg-gradient-to-r before:from-transparent before:via-foreground/10 before:to-transparent",
      "before:translate-x-[-200%] before:transition-transform before:duration-500",
      "data-[state=active]:before:translate-x-[200%]",
      "flex-1 sm:flex-initial min-w-[80px] sm:min-w-[100px]",
      className
    )}
    {...props}
  />
))
TabsTrigger.displayName = TabsPrimitive.Trigger.displayName

const TabsContent = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Content>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Content
    ref={ref}
    className={cn(
      "mt-4 sm:mt-6 ring-offset-background",
      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
      "data-[state=active]:animate-in data-[state=active]:fade-in-0 data-[state=active]:slide-in-from-bottom-3",
      "data-[state=inactive]:animate-out data-[state=inactive]:fade-out-0 data-[state=inactive]:slide-out-to-top-3",
      "transition-all duration-300",
      className
    )}
    {...props}
  />
))
TabsContent.displayName = TabsPrimitive.Content.displayName

export { Tabs, TabsList, TabsTrigger, TabsContent }