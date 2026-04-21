"use client";

import { Card, CardContent } from "@/components/ui/card";
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
      <CardContent className="pt-5 space-y-4">
        <div className="flex items-center gap-2 mb-1">
          <User className="w-4 h-4 text-primary" />
          <span className="label-md">Tu Coach</span>
        </div>

        <div className="flex items-start gap-4">
          {coach.logoUrl ? (
            <div className="relative w-14 h-14 rounded-xl overflow-hidden bg-surface-container-high border border-outline/20 flex-shrink-0">
              <Image
                src={coach.logoUrl}
                alt={coach.businessName || coach.name}
                fill
                className="object-cover"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.style.display = "none";
                }}
              />
            </div>
          ) : coach.image ? (
            <div className="relative w-14 h-14 rounded-xl overflow-hidden border border-outline/20">
              <Image
                src={coach.image}
                alt={coach.name}
                fill
                className="object-cover"
              />
            </div>
          ) : (
            <div className="w-14 h-14 rounded-xl bg-surface-container-high flex items-center justify-center border border-outline/20">
              <User className="w-6 h-6 text-muted-foreground" />
            </div>
          )}

          <div className="flex-1 space-y-1">
            <h3 className="font-semibold text-foreground">{coach.name}</h3>
            {coach.businessName && (
              <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <Building2 className="w-3.5 h-3.5" />
                <span>{coach.businessName}</span>
              </div>
            )}
            <Badge>Coach Asignado</Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
