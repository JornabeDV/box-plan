"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Menu, X } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

const navLinks = [
  { label: "Funcionalidades", href: "/#features" },
  { label: "Precios", href: "/pricing" },
  { label: "Comunidad", href: "/#testimonials" },
  { label: "Cómo funciona", href: "/#how-it-works" },
];

export function LandingNavbar() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/60 backdrop-blur-xl border-b border-white/5">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo — fixed left */}
          <Link
            href="/"
            className="flex items-center h-full shrink-0"
            style={{ fontFamily: "var(--font-space), sans-serif" }}
          >
            <span className="text-xl font-bold tracking-wider text-primary italic">
              BOX PLAN
            </span>
          </Link>

          {/* Desktop links — perfectly centered */}
          <div className="hidden md:flex flex-1 h-full items-center justify-center gap-8">
            {navLinks.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                className="inline-flex items-center h-full text-sm font-medium text-muted-foreground hover:text-foreground transition-colors tracking-wide uppercase"
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Desktop actions — fixed right */}
          <div className="hidden md:flex items-center gap-4 shrink-0">
            <Button
              variant="ghost"
              size="sm"
              className="text-sm tracking-wide"
              onClick={() => {
                if (typeof window !== "undefined") {
                  localStorage.setItem("hasVisitedLogin", "true");
                }
                window.location.href = "/login";
              }}
            >
              Iniciar sesión
            </Button>
            <Button
              size="sm"
              className="bg-primary text-primary-foreground hover:bg-primary/90 text-sm font-semibold tracking-wide"
              onClick={() => {
                window.location.href = "/pricing";
              }}
            >
              Comenzar
            </Button>
          </div>

          {/* Mobile menu button */}
          <button
            className="md:hidden p-2 text-muted-foreground hover:text-foreground relative w-9 h-9 flex items-center justify-center"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Alternar menú"
          >
            <Menu
              className={cn(
                "w-5 h-5 absolute transition-all duration-300 ease-in-out",
                mobileOpen ? "opacity-0 rotate-90 scale-50" : "opacity-100 rotate-0 scale-100"
              )}
            />
            <X
              className={cn(
                "w-5 h-5 absolute transition-all duration-300 ease-in-out",
                mobileOpen ? "opacity-100 rotate-0 scale-100" : "opacity-0 -rotate-90 scale-50"
              )}
            />
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      <div
        className={cn(
          "md:hidden grid transition-all duration-300 ease-in-out border-white/5",
          mobileOpen
            ? "grid-rows-[1fr] opacity-100 border-t bg-background/95 backdrop-blur-xl"
            : "grid-rows-[0fr] opacity-0 border-transparent bg-transparent"
        )}
      >
        <div className="overflow-hidden">
          <div className="px-4 py-4 space-y-3">
            {navLinks.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                className="block text-sm font-medium text-muted-foreground hover:text-foreground transition-colors tracking-wide uppercase py-2"
                onClick={() => setMobileOpen(false)}
              >
                {link.label}
              </Link>
            ))}
            <div className="pt-3 flex flex-col gap-2">
              <Button
                variant="ghost"
                className="w-full justify-start text-sm tracking-wide"
                onClick={() => {
                  setMobileOpen(false);
                  if (typeof window !== "undefined") {
                    localStorage.setItem("hasVisitedLogin", "true");
                  }
                  window.location.href = "/login";
                }}
              >
                Iniciar sesión
              </Button>
              <Button
                className="w-full bg-primary text-primary-foreground hover:bg-primary/90 text-sm font-semibold tracking-wide"
                onClick={() => {
                  setMobileOpen(false);
                  window.location.href = "/pricing";
                }}
              >
                Comenzar
              </Button>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
