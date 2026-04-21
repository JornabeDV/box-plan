import type React from "react";

interface PageWrapperProps {
  children: React.ReactNode;
  className?: string;
}

export function PageWrapper({ children, className = "" }: PageWrapperProps) {
  return (
    <div className={`min-h-[100dvh] bg-background text-foreground relative overflow-hidden ${className}`}>
      <div className="absolute inset-0 kinetic-grid-bg pointer-events-none" aria-hidden="true" />
      {children}
    </div>
  );
}
