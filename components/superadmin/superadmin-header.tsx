"use client";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { LogOut, Shield } from "lucide-react";
import { useAuthWithRoles } from "@/hooks/use-auth-with-roles";

export function SuperAdminHeader() {
  const { user, signOut } = useAuthWithRoles();

  return (
    <div className="border-b bg-card/50 backdrop-blur-sm">
      <div className="container mx-auto px-4 py-6">
        <div className="flex items-center justify-between">
          <div className="flex flex-col justify-center">
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold">
              Super Admin Dashboard
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground mt-0.5">
              Administración de coaches y planes
            </p>
          </div>
          <div className="flex items-center gap-2 md:gap-4">
            <Badge
              variant="outline"
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-xs md:text-sm"
            >
              <Shield className="w-3 h-3 md:w-4 md:h-4" />
              Super Admin
            </Badge>
            {user && (
              <Button
                onClick={() => signOut()}
                variant="ghost"
                size="sm"
                className="flex items-center gap-1.5 md:gap-2 hover:bg-white/5 hover:text-red-400 transition-colors rounded-xl touch-manipulation"
              >
                <LogOut className="w-4 h-4 md:w-5 md:h-5" />
                <span className="hidden sm:inline text-xs md:text-sm font-semibold">
                  Salir
                </span>
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
