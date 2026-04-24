"use client";

export function PhoneMockup() {
  return (
    <div className="relative mx-auto w-[260px] h-[520px] sm:w-[280px] sm:h-[560px] md:w-[300px] md:h-[600px]">
      {/* Outer phone frame */}
      <div className="absolute inset-0 rounded-[3rem] bg-gradient-to-b from-white/15 to-white/5 p-[2px] shadow-2xl shadow-black/60">
        <div className="relative h-full w-full rounded-[2.85rem] bg-[#050505] overflow-hidden border border-white/5">
          {/* Notch */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-28 h-6 bg-black rounded-b-2xl z-20" />

          {/* Screen content */}
          <div className="h-full w-full pt-7 pb-2 px-2 flex flex-col">
            {/* App header inside mockup */}
            <div className="flex items-center justify-between px-3 py-2 mb-2">
              <div className="w-7 h-7 rounded-md bg-primary/20 flex items-center justify-center">
                <span className="text-[9px] font-bold text-primary">BP</span>
              </div>
              <div className="w-5 h-5 rounded-full bg-white/10" />
            </div>

            {/* Mock content */}
            <div className="flex-1 space-y-2.5 px-2 overflow-hidden">
              {/* Welcome text */}
              <div className="space-y-1">
                <div className="h-2.5 w-16 bg-white/10 rounded" />
                <div className="h-4 w-32 bg-white/15 rounded" />
              </div>

              {/* Stats cards */}
              <div className="grid grid-cols-2 gap-2">
                <div className="rounded-xl bg-white/5 p-2.5 space-y-1.5">
                  <div className="h-2 w-6 bg-primary/40 rounded" />
                  <div className="h-5 w-10 bg-white/20 rounded" />
                </div>
                <div className="rounded-xl bg-white/5 p-2.5 space-y-1.5">
                  <div className="h-2 w-6 bg-primary/40 rounded" />
                  <div className="h-5 w-10 bg-white/20 rounded" />
                </div>
              </div>

              {/* Main card */}
              <div className="rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 p-3 space-y-2 border border-primary/10">
                <div className="h-3 w-28 bg-white/20 rounded" />
                <div className="h-2.5 w-full bg-white/10 rounded" />
                <div className="h-2.5 w-3/4 bg-white/10 rounded" />
                <div className="h-7 w-20 bg-primary/30 rounded-md" />
              </div>

              {/* List items */}
              {Array.from({ length: 4 }).map((_, i) => (
                <div
                  key={i}
                  className="flex items-center gap-2.5 rounded-xl bg-white/5 p-2.5"
                >
                  <div className="w-8 h-8 rounded-lg bg-white/10 shrink-0" />
                  <div className="flex-1 space-y-1">
                    <div className="h-2.5 w-20 bg-white/15 rounded" />
                    <div className="h-2 w-14 bg-white/10 rounded" />
                  </div>
                </div>
              ))}
            </div>

            {/* Bottom nav */}
            <div className="flex items-center justify-around py-2.5 px-2 mt-auto">
              <div className="w-4 h-4 rounded bg-primary/40" />
              <div className="w-4 h-4 rounded bg-white/10" />
              <div className="w-4 h-4 rounded bg-white/10" />
              <div className="w-4 h-4 rounded bg-white/10" />
            </div>
          </div>
        </div>
      </div>

      {/* Glow effect behind phone */}
      <div className="absolute -inset-6 bg-primary/5 rounded-full blur-3xl -z-10" />
    </div>
  );
}
