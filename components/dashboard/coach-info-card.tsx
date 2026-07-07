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
  showWhatsAppButton?: boolean;
}

export function CoachInfoCard({ coach, showWhatsAppButton }: CoachInfoCardProps) {
  return (
    <Card>
      <CardContent className="pt-5 space-y-4">
        <div className="flex items-center gap-2 mb-1">
          <User className="w-4 h-4 text-primary" />
          <span className="label-md">Tu Coach</span>
        </div>

        <div className="flex flex-col md:grid md:grid-cols-[1fr_auto] gap-4 sm:items-start">
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

          {showWhatsAppButton && coach.phone && (
            <div className="flex items-center">
              <WhatsAppContactButton
                phone={coach.phone}
                coachName={coach.name}
              />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

interface WhatsAppContactButtonProps {
  phone: string;
  coachName: string;
}

function WhatsAppContactButton({ phone, coachName }: WhatsAppContactButtonProps) {
  const formatPhoneForWhatsApp = (phoneNumber: string): string => {
    let cleaned = phoneNumber.replace(/[^\d+]/g, "");

    if (!cleaned.startsWith("+")) {
      if (cleaned.startsWith("54")) {
        cleaned = "+" + cleaned;
      } else {
        cleaned = "+54" + cleaned;
      }
    }

    return cleaned;
  };

  const handleWhatsAppClick = () => {
    const formattedPhone = formatPhoneForWhatsApp(phone);
    const message = `Hola ${coachName}, te contacto desde BoxPlan.`;

    const whatsappUrl = `https://wa.me/${formattedPhone.replace(
      /\+/g,
      ""
    )}?text=${encodeURIComponent(message)}`;

    window.open(whatsappUrl, "_blank");
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      handleWhatsAppClick();
    }
  };

  return (
    <button
      type="button"
      onClick={handleWhatsAppClick}
      onKeyDown={handleKeyDown}
      className="w-full md:w-auto flex items-center justify-center gap-2 rounded-none bg-[#25D366] hover:bg-[#20BA5A] text-white shadow-sm hover:shadow-md transition-all duration-200 hover:scale-[1.02] py-2.5 px-4 border-0 outline-none focus:outline-none focus:ring-2 focus:ring-[#25D366] focus:ring-offset-2 cursor-pointer"
      aria-label={`Contactar a ${coachName} por WhatsApp`}
      tabIndex={0}
    >
      <svg
        className="w-5 h-5"
        fill="currentColor"
        viewBox="0 0 24 24"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
      </svg>
      <span className="font-semibold">Contactar</span>
    </button>
  );
}
