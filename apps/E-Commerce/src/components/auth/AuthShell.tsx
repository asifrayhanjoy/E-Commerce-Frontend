import type { ReactNode } from "react";
import BrandLogo from "@/components/brand/BrandLogo";

type AuthShellProps = {
  eyebrow: string;
  title: string;
  description: string;
  children: ReactNode;
};

export default function AuthShell({
  eyebrow,
  title,
  description,
  children,
}: AuthShellProps) {
  return (
    <main className="relative isolate flex min-h-[68vh] items-center justify-center overflow-hidden bg-[#070b14] px-4 py-8 sm:px-6 lg:py-10">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -left-32 top-12 size-80 rounded-full bg-blue-600/20 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-36 -right-20 size-96 rounded-full bg-emerald-500/15 blur-3xl"
      />

      <div className="panel-reveal relative grid w-full max-w-[1040px] overflow-hidden rounded-[26px] border border-white/10 bg-[#111827] shadow-[0_28px_72px_rgba(0,0,0,0.42)] lg:min-h-[560px] lg:grid-cols-[0.88fr_1.12fr]">
        <aside className="relative hidden flex-col justify-between overflow-hidden bg-[#0b0f19] p-8 text-white lg:flex xl:p-10">
          <div
            aria-hidden="true"
            className="glow-pulse pointer-events-none absolute -right-20 top-24 size-72 rounded-full bg-blue-500/20 blur-3xl"
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -bottom-32 -left-24 size-80 rounded-full bg-emerald-500/15 blur-3xl"
          />

          <BrandLogo tone="light" className="relative z-10" />

          <div className="relative z-10 max-w-md py-8">
            <p className="mb-4 text-xs font-bold uppercase tracking-[0.22em] text-emerald-300">
              Considered commerce
            </p>
            <h2 className="text-4xl font-bold leading-[1.08] tracking-[-0.04em] xl:text-5xl">
              A more personal way to discover what matters.
            </h2>
            <p className="mt-6 max-w-sm text-base leading-7 text-slate-300">
              Meet independent sellers, explore thoughtful finds, and shop
              with confidence at every step.
            </p>

            <div className="mt-9 grid gap-3">
              {[
                ["01", "Verified independent sellers"],
                ["02", "Protected checkout experience"],
                ["03", "Delivery updates in one place"],
              ].map(([number, text]) => (
                <div
                  key={number}
                  className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.045] px-4 py-3"
                >
                  <span className="font-display text-xs font-bold tracking-widest text-emerald-300">
                    {number}
                  </span>
                  <span className="text-sm font-semibold text-slate-200">
                    {text}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <p className="relative z-10 text-xs font-semibold tracking-wide text-slate-400">
            A considered marketplace by ARJ GROUP
          </p>
        </aside>

        <section className="flex items-center justify-center px-5 py-7 sm:px-9 sm:py-9 lg:px-10 xl:px-12">
          <div className="w-full max-w-[480px]">
            <div className="mb-8 flex justify-center lg:hidden">
              <BrandLogo />
            </div>
            <p className="arj-eyebrow text-center text-sky-300 lg:text-left">
              {eyebrow}
            </p>
            <h1 className="mt-2 text-center text-2xl font-extrabold tracking-[-0.045em] text-slate-50 sm:text-3xl lg:text-left">
              {title}
            </h1>
            <p className="mx-auto mt-2 max-w-md text-center text-sm leading-6 text-slate-300 lg:mx-0 lg:text-left">
              {description}
            </p>
            <div className="mt-6">{children}</div>
          </div>
        </section>
      </div>
    </main>
  );
}
