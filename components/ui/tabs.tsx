"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

const TabsContext = React.createContext<{
  selectedTab: string;
  setSelectedTab: (tab: string) => void;
} | null>(null);

interface TabsProps {
  defaultValue: string;
  value?: string;
  onValueChange?: (value: string) => void;
  children: React.ReactNode;
  className?: string;
}

export function Tabs({
  defaultValue,
  value,
  onValueChange,
  children,
  className,
}: TabsProps) {
  const [selectedTab, setSelectedTab] = React.useState(value || defaultValue);

  React.useEffect(() => {
    if (value !== undefined) {
      setSelectedTab(value);
    }
  }, [value]);

  const handleTabChange = (tab: string) => {
    setSelectedTab(tab);
    onValueChange?.(tab);
  };

  return (
    <TabsContext.Provider
      value={{ selectedTab, setSelectedTab: handleTabChange }}
    >
      <div className={cn("w-full", className)}>{children}</div>
    </TabsContext.Provider>
  );
}

interface TabsListProps {
  children: React.ReactNode;
  className?: string;
}

export function TabsList({ children, className }: TabsListProps) {
  return <div className={cn("flex items-center", className)}>{children}</div>;
}

interface TabsTriggerProps {
  value: string;
  children: React.ReactNode;
  className?: string;
  variant?: "underline" | "segment";
}

export function TabsTrigger({
  value,
  children,
  className,
  variant = "underline",
}: TabsTriggerProps) {
  const context = React.useContext(TabsContext);
  if (!context) {
    throw new Error("TabsTrigger must be used within a Tabs component");
  }

  const isSelected = context.selectedTab === value;

  return (
    <button
      type="button"
      className={cn(
        "flex-shrink-0 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
        variant === "underline" && "px-2 py-1 text-sm",
        variant === "segment" && "px-4 py-2 text-[15px] rounded-xl",
        isSelected
          ? variant === "underline"
            ? "text-foreground border-b-2 border-b-black font-semibold"
            : "bg-background font-medium shadow text-foreground"
          : variant === "underline"
            ? "text-muted-foreground hover:text-foreground"
            : "text-muted-foreground",
        className,
      )}
      onClick={() => context.setSelectedTab(value)}
    >
      {children}
    </button>
  );
}

interface TabsContentProps {
  value: string;
  children: React.ReactNode;
  className?: string;
}

export function TabsContent({ value, children, className }: TabsContentProps) {
  const context = React.useContext(TabsContext);
  if (!context) {
    throw new Error("TabsContent must be used within a Tabs component");
  }

  if (context.selectedTab !== value) {
    return null;
  }

  return (
    <div
      className={cn(
        "mt-2 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        className,
      )}
    >
      {children}
    </div>
  );
}
