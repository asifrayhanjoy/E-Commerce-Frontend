"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { navItems, type NavItemsTypes } from "@/config/constants";

const HeaderBottom = () => {
  const [isMounted, setIsMounted] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    setIsMounted(true);
  }, []);

  return (
    <nav
      aria-label="Main navigation"
      className="w-full border-t border-white/10 bg-[#070b14]/95"
    >
      <div className="mx-auto flex max-w-[1320px] items-center justify-start gap-1 overflow-x-auto px-3 py-2 sm:justify-center sm:px-6 md:gap-4 lg:px-8">
        {navItems.map((item: NavItemsTypes) => {
          const isActive =
            isMounted &&
            (item.href === "/"
              ? pathname === "/"
              : pathname === item.href || pathname?.startsWith(`${item.href}/`));

          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={isActive ? "page" : undefined}
              className={`nav-underline group relative shrink-0 rounded-lg px-3 py-2 text-xs font-semibold tracking-wide transition duration-200 hover:bg-slate-800/65 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400/35 sm:px-4 ${
                isActive
                  ? "text-white"
                  : "text-slate-400"
              }`}
            >
              {item.title}
            </Link>
          );
        })}
      </div>
    </nav>
  );
};

export default HeaderBottom;
