"use client";

import { LandingNavbar } from "./landing-navbar";
import { LandingHero } from "./landing-hero";
import { LandingFeatures } from "./landing-features";
import { LandingHowItWorks } from "./landing-how-it-works";
import { LandingTestimonials } from "./landing-testimonials";
import { LandingCTA } from "./landing-cta";
import { LandingFooter } from "./landing-footer";

export function LandingPage() {
  return (
    <div className="min-h-[100dvh] bg-background text-foreground">
      <LandingNavbar />
      <main>
        <LandingHero />
        <LandingFeatures />
        <LandingHowItWorks />
        <LandingTestimonials />
        <LandingCTA />
      </main>
      <LandingFooter />
    </div>
  );
}
