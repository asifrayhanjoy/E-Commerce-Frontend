"use client";

import { MoveRight, ShieldCheck, Sparkles, Store } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  emptySiteCustomization,
  fetchSiteCustomization,
} from "@/utils/siteCustomization";

const Hero = () => {
  const router = useRouter();
  const [bannerImageFailed, setBannerImageFailed] = useState(false);
  const { data: siteCustomization = emptySiteCustomization } = useQuery({
    queryKey: ["site-customization", "admin-images-v3"],
    queryFn: fetchSiteCustomization,
    staleTime: 0,
  });
  const bannerUrl = siteCustomization.bannerUrl;

  useEffect(() => {
    setBannerImageFailed(false);
  }, [bannerUrl]);

  return (
    <section className="relative isolate flex min-h-[620px] items-center overflow-hidden bg-[#0b0f19] py-16 text-white sm:min-h-[680px] lg:min-h-[740px]">
      <div
        aria-hidden="true"
        className="glow-pulse pointer-events-none absolute -left-36 top-0 size-[28rem] rounded-full bg-blue-600/20 blur-[100px]"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_80%_48%,rgba(255,255,255,0.07),transparent_35%),linear-gradient(115deg,transparent_45%,rgba(255,255,255,0.035)_45.2%,transparent_45.6%)]"
      />

      <div className="relative mx-auto grid w-[92%] max-w-[1320px] grid-cols-1 items-center gap-12 md:grid-cols-2 lg:gap-16">
        <div className="fade-up relative z-10 py-5 md:py-12">
          <p className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.06] px-4 py-2 text-[11px] font-bold uppercase tracking-[0.2em] text-emerald-300 backdrop-blur">
            <span className="size-1.5 rounded-full bg-emerald-300 shadow-[0_0_12px_#34d399]" />
            ARJ GROUP · THE CONSIDERED MARKETPLACE
          </p>

          <h1 className="max-w-2xl text-5xl font-semibold leading-[1.03] tracking-[-0.055em] text-white sm:text-6xl lg:text-7xl">
            Find the pieces
            <span className="mt-2 block bg-gradient-to-r from-blue-300 via-white to-emerald-300 bg-clip-text text-transparent">
              that make life feel exceptional.
            </span>
          </h1>

          <p className="mt-7 max-w-lg text-lg leading-8 text-slate-300 sm:text-xl">
            Discover thoughtful essentials, distinctive collections, and
            independent sellers in one elevated marketplace.
          </p>

          <div className="mt-9 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => router.push("/products")}
              className="cta-shine group relative inline-flex min-h-14 items-center justify-center gap-3 overflow-hidden rounded-2xl bg-sky-400 px-7 text-sm font-extrabold tracking-wide text-[#07111f] shadow-[0_14px_36px_rgba(0,0,0,0.2)] transition duration-300 hover:-translate-y-1 hover:bg-sky-300 hover:shadow-[0_20px_44px_rgba(56,189,248,0.24)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-sky-300/40 active:translate-y-0"
            >
              <span className="relative">Explore the collection</span>
              <MoveRight
                size={18}
                className="relative transition-transform duration-300 group-hover:translate-x-1"
              />
            </button>
            <button
              type="button"
              onClick={() => router.push("/shops")}
              className="inline-flex min-h-14 items-center justify-center rounded-2xl border border-white/20 bg-white/[0.06] px-6 text-sm font-bold text-white transition duration-300 hover:border-white/40 hover:bg-white/10 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-white/20"
            >
              Meet the sellers
            </button>
          </div>

          <div className="mt-9 grid max-w-xl grid-cols-3 gap-3 border-t border-white/10 pt-5">
            {[
              { icon: Sparkles, label: "Curated finds" },
              { icon: Store, label: "Independent shops" },
              { icon: ShieldCheck, label: "Secure checkout" },
            ].map(({ icon: Icon, label }) => (
              <div
                key={label}
                className="flex items-center gap-2 text-xs font-semibold text-slate-300"
              >
                <Icon className="size-4 shrink-0 text-emerald-300" />
                <span>{label}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="relative mx-auto flex min-h-[330px] w-full max-w-[610px] items-center justify-center md:min-h-[480px]">
          <div
            aria-hidden="true"
            className="glow-pulse absolute left-1/2 top-1/2 aspect-square w-[75%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-emerald-500/15 blur-[85px]"
          />
          <div
            aria-hidden="true"
            className="absolute left-1/2 top-1/2 aspect-square w-[84%] -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/10"
          />
          {bannerUrl && !bannerImageFailed ? (
            <img
              src={bannerUrl}
              alt="Store cover"
              className="float-slow relative z-10 max-h-[440px] w-full max-w-[550px] object-contain drop-shadow-[0_35px_45px_rgba(0,0,0,0.38)]"
              onError={() => setBannerImageFailed(true)}
            />
          ) : (
            <div className="float-slow relative z-10 grid size-64 place-items-center rounded-[42%] border border-white/10 bg-gradient-to-br from-white/10 via-white/[0.035] to-blue-500/10 shadow-[inset_0_1px_0_rgba(255,255,255,0.14),0_32px_70px_rgba(0,0,0,0.24)] backdrop-blur sm:size-80">
              <span className="grid size-44 place-items-center rounded-full border border-blue-300/30 bg-slate-950/70 text-center shadow-[0_0_80px_rgba(37,99,235,0.13)] sm:size-52">
                <span>
                  <span className="block text-5xl font-black tracking-[0.12em] text-blue-200 sm:text-6xl">
                    ARJ
                  </span>
                  <span className="mt-2 block text-[10px] font-bold tracking-[0.45em] text-emerald-200">
                    GROUP
                  </span>
                </span>
              </span>
            </div>
          )}

          <button
            type="button"
            onClick={() => router.push("/offers")}
            className="float-slow absolute bottom-5 right-0 z-20 rounded-2xl border border-white/15 bg-slate-900/80 px-4 py-3 text-left shadow-2xl backdrop-blur-xl transition hover:border-emerald-300/50 sm:bottom-10 sm:right-2"
          >
            <span className="block text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">
              Discover
            </span>
            <span className="mt-1 block text-lg font-bold text-emerald-300">
              Current offers
            </span>
          </button>
        </div>
      </div>
    </section>
  );
};

export default Hero;
