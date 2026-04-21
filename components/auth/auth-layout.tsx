"use client";

import Image from "next/image";
import { ReactNode } from "react";

interface AuthLayoutProps {
  title: string;
  subtitle?: string;
  children: ReactNode;
}

export function AuthLayout({ title, subtitle, children }: AuthLayoutProps) {
  return (
    <main className="relative z-10 flex flex-col items-center px-6 pb-12 max-w-md mx-auto pt-8">
      {/* Logo */}
      <div className="relative w-64 h-64 mb-6">
        <div className="absolute inset-0 bg-primary/20 blur-2xl rounded-full" />
        <Image
          src="/logo_sin_fondo.png"
          alt="Box Plan"
          fill
          className="object-contain relative z-10 drop-shadow-[0_0_15px_rgba(230,255,43,0.3)]"
          priority
        />
      </div>

      {/* Title */}
      <div className="text-center mb-10">
        <h2 className="display-lg uppercase italic text-foreground">
          {title}
        </h2>
        {subtitle && (
          <p className="mt-2 text-muted-foreground text-sm">{subtitle}</p>
        )}
        <div className="mt-3 mx-auto w-16 h-1 bg-primary rounded-full" />
      </div>

      {/* Form / Content */}
      <div className="w-full">{children}</div>
    </main>
  );
}
