import Link from "next/link";

type BrandLogoProps = {
  className?: string;
  compact?: boolean;
  tone?: "dark" | "light";
};

export default function BrandLogo({
  className = "",
  compact = false,
  tone = "dark",
}: BrandLogoProps) {
  const wordmarkColor = tone === "light" ? "text-white" : "text-slate-950";
  const groupColor = tone === "light" ? "text-slate-300" : "text-slate-400";

  return (
    <Link
      href="/"
      aria-label="ARJ Group home"
      className={`brand-mark-enter group inline-flex shrink-0 items-center ${
        compact ? "gap-2.5" : "gap-3"
      } ${className}`}
    >
      <span
        className={`brand-emblem relative grid ${
          compact ? "size-10 rounded-xl text-[9px]" : "size-12 rounded-[16px] text-[10px]"
        } place-items-center overflow-hidden bg-[#111827] font-black tracking-[0.1em] text-sky-300 shadow-lg shadow-black/40 ring-1 ring-white/10 transition duration-500 group-hover:rotate-[8deg] group-hover:scale-105 group-hover:shadow-[0_10px_30px_rgba(56,189,248,0.25)]`}
      >
        <span
          aria-hidden="true"
          className={`absolute ${
            compact ? "size-6 rounded-[4px]" : "size-7 rounded-[5px]"
          } rotate-45 border border-sky-300/45 transition duration-500 group-hover:rotate-[55deg] group-hover:scale-110 group-hover:border-emerald-300/80`}
        />
        <span className="brand-emblem-monogram relative transition-colors duration-300 group-hover:text-white">
          ARJ
        </span>
      </span>
      <span className="flex flex-col leading-none">
        <span
          className={`${compact ? "text-[17px]" : "text-[19px]"} font-black tracking-[0.13em] transition-all duration-300 group-hover:tracking-[0.19em] group-hover:text-sky-300 ${wordmarkColor}`}
        >
          ARJ
        </span>
        <span
          className={`mt-1 text-[9px] font-bold tracking-[0.34em] transition-all duration-300 group-hover:tracking-[0.42em] group-hover:text-emerald-300 ${groupColor}`}
        >
          GROUP
        </span>
      </span>
      <span className="sr-only">ARJ GROUP</span>
    </Link>
  );
}
