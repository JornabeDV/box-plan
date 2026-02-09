"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { User, Building2 } from "lucide-react";
import Image from "next/image";

interface Coach {
  id: number;
  userId: number;
  name: string;
  email: string;
  image: string | null;
  businessName: string | null;
  phone: string | null;
  address: string | null;
  logoUrl: string | null;
  joinedAt: string | Date;
}

interface CoachInfoCardProps {
  coach: Coach;
}

export function CoachInfoCard({ coach }: CoachInfoCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <User className="w-5 h-5" />
          Tu Coach
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Información del coach */}
        <div className="flex items-start gap-4">
          {/* Mostrar logo del coach si existe, sino imagen de perfil, sino icono por defecto */}
          {coach.logoUrl ? (
            <div className="relative w-16 h-16 rounded-lg overflow-hidden border bg-background flex-shrink-0">
              <Image
                src={coach.logoUrl}
                alt={coach.businessName || coach.name}
                fill
                className="object-cover"
                onError={(e) => {
                  // Si falla el logo, mostrar imagen de perfil o icono
                  const target = e.target as HTMLImageElement;
                  target.style.display = "none";
                }}
              />
            </div>
          ) : coach.image ? (
            <div className="relative w-16 h-16 rounded-full overflow-hidden border">
              <Image
                src={coach.image}
                alt={coach.name}
                fill
                className="object-cover"
              />
            </div>
          ) : (
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center border">
              <User className="w-8 h-8 text-muted-foreground" />
            </div>
          )}
          <div className="flex-1 space-y-2">
            <div>
              <h3 className="font-semibold text-lg">{coach.name}</h3>
              {coach.businessName && (
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <Building2 className="w-4 h-4" />
                  <span>{coach.businessName}</span>
                </div>
              )}
            </div>
            <Badge variant="outline">
              Coach Asignado
            </Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
