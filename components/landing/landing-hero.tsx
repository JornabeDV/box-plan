"use client";

import { Button } from "@/components/ui/button";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { Settings, Target } from "lucide-react";
import Image from "next/image";

const carouselSlides = [
  { src: "/banner_mobile_1.png", alt: "Box Plan - Vista mobile" },
];

export function LandingHero() {
  return (
    <section className="relative overflow-hidden bg-background">
      {/* Desktop: full background image */}
      <div className="hidden lg:block absolute inset-0">
        <Image
          src="/banner_3.png"
          alt="Box Plan App Screens"
          fill
          priority
          className="object-cover"
        />
      </div>

      {/* Desktop content — top-left over the empty space */}
      <div className="hidden lg:grid lg:grid-cols-2 relative z-10 min-h-[100dvh]">
        <div className="flex flex-col justify-start pt-28 lg:pt-32 px-6 sm:px-10 lg:px-16 pb-12">
          {/* Tag */}
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 mb-6 w-fit backdrop-blur-sm">
            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
            <span className="text-xs font-semibold tracking-widest uppercase text-primary">
              App de Entrenamiento
            </span>
          </div>

          {/* Title */}
          <h1
            className="text-5xl sm:text-6xl lg:text-6xl font-bold leading-[0.95] tracking-tight uppercase mb-6 text-left"
            style={{ fontFamily: "var(--font-space), sans-serif" }}
          >
            <span className="text-foreground">La</span>
            <br />
            <span className="text-foreground">herramienta</span>
            <br />
            <span className="text-foreground">para</span>
            <br />
            <span className="text-primary italic">coaches y</span>
            <br />
            <span className="text-primary italic">atletas</span>
          </h1>

          {/* Description */}
          <p className="text-base md:text-lg text-muted-foreground max-w-md mb-8 leading-relaxed text-left">
            Optimizá tu rendimiento con la plataforma de entrenamiento más
            avanzada. Gestión inteligente para boxes y tracking de precisión
            para deportistas de élite.
          </p>

          {/* Buttons */}
          <div className="flex flex-col gap-3 justify-start">
            <Button
              variant="default"
              size="lg"
              className="w-fit"
              onClick={() => {
                window.location.href = "/pricing";
              }}
            >
              <Settings className="w-4 h-4 mr-2" />
              Soy Coach
            </Button>
            <Button
              variant="default"
              size="lg"
              className="w-fit"
              onClick={() => {
                if (typeof window !== "undefined") {
                  localStorage.setItem("hasVisitedLogin", "true");
                }
                window.location.href = "/login";
              }}
            >
              <Target className="w-4 h-4 mr-2" />
              Soy Atleta
            </Button>
          </div>
        </div>

        {/* Right column — empty, mockups are in the background image */}
        <div />
      </div>

      {/* Mobile layout */}
      <div className="lg:hidden">
        {/* Text */}
        <div className="px-6 pt-24 pb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
            <span className="text-xs font-semibold tracking-widest uppercase text-primary">
              App de Entrenamiento
            </span>
          </div>

          <h1
            className="text-4xl sm:text-5xl font-bold leading-[0.95] tracking-tight uppercase mb-6"
            style={{ fontFamily: "var(--font-space), sans-serif" }}
          >
            <span className="text-foreground">La herramienta para </span>
            <span className="text-primary italic">coaches y atletas</span>
          </h1>

          <p className="text-base text-muted-foreground max-w-md mb-8 leading-relaxed">
            Optimizá tu rendimiento con la plataforma de entrenamiento más
            avanzada. Gestión inteligente para boxes y tracking de precisión.
          </p>

          <div className="flex flex-col gap-3">
            <Button
              variant="default"
              size="lg"
              className="w-full"
              onClick={() => {
                window.location.href = "/pricing";
              }}
            >
              <Settings className="w-4 h-4 mr-2" />
              Soy Coach
            </Button>
            <Button
              variant="default"
              size="lg"
              className="w-full"
              onClick={() => {
                if (typeof window !== "undefined") {
                  localStorage.setItem("hasVisitedLogin", "true");
                }
                window.location.href = "/login";
              }}
            >
              <Target className="w-4 h-4 mr-2" />
              Soy Atleta
            </Button>
          </div>
        </div>

        {/* Carousel */}
        <div>
          <Carousel
            opts={{
              align: "start",
              loop: true,
            }}
            className="w-full"
          >
            <CarouselContent className="ml-0">
              {carouselSlides.map((slide, index) => (
                <CarouselItem key={index} className="pl-0 basis-full">
                  <div className="flex justify-center overflow-hidden bg-background">
                    <Image
                      src={slide.src}
                      alt={slide.alt}
                      width={853}
                      height={1844}
                      className="w-full h-auto object-contain"
                      priority
                    />
                  </div>
                </CarouselItem>
              ))}
            </CarouselContent>
            <div className="flex items-center justify-center gap-2">
              <CarouselPrevious className="static translate-y-0" />
              <CarouselNext className="static translate-y-0" />
            </div>
          </Carousel>
        </div>
      </div>
    </section>
  );
}
