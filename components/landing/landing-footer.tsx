"use client";

import Link from "next/link";
import Image from "next/image";

export function LandingFooter() {
  return (
    <footer className="border-t border-white/5 bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
        {/* Logo grande centrado */}
        <div className="flex flex-col items-center">
          <div className="relative w-48 h-48 mb-4">
            <div className="absolute inset-0 bg-primary/10 blur-3xl rounded-full" />
            <Image
              src="/logo_sin_fondo.png"
              alt="Box Plan"
              fill
              className="object-contain relative z-10 drop-shadow-[0_0_20px_rgba(230,255,43,0.2)]"
            />
          </div>
          </div>

        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          {/* Links */}
          <div className="flex items-center gap-6 text-xs text-muted-foreground">
            <Link href="#" className="hover:text-foreground transition-colors">
              Privacy Policy
            </Link>
            <Link href="#" className="hover:text-foreground transition-colors">
              Terms of Service
            </Link>
            {/* <Link href="#" className="hover:text-foreground transition-colors">
              Support
            </Link>
            <Link href="#" className="hover:text-foreground transition-colors">
              Twitter
            </Link>
            <Link href="#" className="hover:text-foreground transition-colors">
              Discord
            </Link> */}
          </div>

          {/* Copyright */}
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} BOX PLAN. ALL RIGHTS RESERVED.
          </p>
        </div>
      </div>
    </footer>
  );
}
