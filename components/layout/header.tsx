"use client";

import { LogOut } from "lucide-react";
import { useAuthWithRoles } from "@/hooks/use-auth-with-roles";
import { useUserCoach } from "@/hooks/use-user-coach";
import { useStudentSubscription } from "@/hooks/use-student-subscription";
import Link from "next/link";
import Image from "next/image";

interface HeaderProps {}

export function Header({}: HeaderProps) {
  const { user, isAdmin, isCoach } = useAuthWithRoles();
  const { loading: subscriptionLoading } = useStudentSubscription();
  useUserCoach();

  if (!user) return null;

  return (
    <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-xl">
      <div className="flex items-center justify-between px-4 max-w-7xl mx-auto">
        {/* Logo de la app */}
        <Link
          href="/profile"
          className="relative group shrink-0"
        >
          <div className="w-16 h-16 rounded-xl overflow-hidden flex items-center justify-center">
            <Image
              src="/logo_isotipo_sin_fondo.png"
              alt="Box Plan"
              width={40}
              height={40}
              className="w-full h-full object-contain"
            />
          </div>
        </Link>

        {/* Nombre de la app */}
        <Link href="/" className="flex items-center">
          <h1 className="text-3xl font-bold tracking-tight text-foreground" style={{ fontFamily: 'var(--font-space), sans-serif' }}>
            <span className="italic">BOX</span>{" "}
            <span className="italic text-primary">PLAN</span>
          </h1>
        </Link>

        <div className="w-10 shrink-0" />
      </div>
    </header>
  );
}
