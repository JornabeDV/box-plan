"use client";

const steps = [
  {
    number: "01",
    title: "Configura",
    description:
      "Creá tu box, importá tus atletas y personalizá tus niveles de entrenamiento en minutos.",
  },
  {
    number: "02",
    title: "Programa",
    description:
      "Usá nuestro generador de WODs inteligente para crear rutinas desafiantes y variadas.",
  },
  {
    number: "03",
    title: "Analiza",
    description:
      "Revisá el performance, ajustá cargas y celebrá los resultados basados en data real.",
  },
];

export function LandingHowItWorks() {
  return (
    <section id="how-it-works" className="py-20 md:py-28 bg-[#020c10]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section header */}
        <div className="mb-14">
          <p
            className="text-xs font-semibold tracking-[0.25em] uppercase text-muted-foreground mb-2"
            style={{ fontFamily: "var(--font-space), sans-serif" }}
          >
            El workflow de la victoria
          </p>
          <h2
            className="text-3xl md:text-4xl font-bold tracking-tight uppercase text-foreground"
            style={{ fontFamily: "var(--font-space), sans-serif" }}
          >
            Cómo funciona
          </h2>
        </div>

        {/* Steps */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-10">
          {steps.map((step) => (
            <div key={step.number} className="relative">
              <span
                className="block text-5xl md:text-6xl font-bold text-white/5 mb-4"
                style={{ fontFamily: "var(--font-space), sans-serif" }}
              >
                {step.number}
              </span>
              <h3
                className="text-lg font-bold tracking-wider uppercase text-foreground mb-3"
                style={{ fontFamily: "var(--font-space), sans-serif" }}
              >
                {step.title}
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {step.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
