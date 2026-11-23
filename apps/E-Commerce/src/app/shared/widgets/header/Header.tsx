"use client";
import { FiSearch } from "react-icons/fi";
import { useRouter } from "next/navigation";
import { type FormEvent, useState } from "react";
import BrandLogo from "@/components/brand/BrandLogo";
import HeaderUser from "./HeaderUser";
import HeaderBottom from "./header.bottom";

export default function Header() {
  const router = useRouter();
  const [searchText, setSearchText] = useState("");

  const handleSearchSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const query = searchText.trim();

    if (!query) {
      router.push("/products");
      return;
    }

    router.push(`/products?search=${encodeURIComponent(query)}`);
  };
  return (
    <header className="relative z-30 w-full border-b border-white/10 bg-[#070b14]/95 shadow-[0_8px_30px_rgba(0,0,0,0.25)] backdrop-blur-xl">
      <div className="mx-auto flex w-full max-w-[1320px] flex-wrap items-center justify-between gap-x-6 gap-y-2 px-4 py-2.5 sm:px-6 lg:flex-nowrap lg:px-8">
        <BrandLogo compact />

        <form
          className="group order-3 flex w-full items-stretch transition-all duration-300 focus-within:drop-shadow-[0_10px_18px_rgba(37,99,235,0.12)] lg:order-0 lg:mx-auto lg:max-w-[500px] lg:flex-1"
          onSubmit={handleSearchSubmit}
        >
          <input
            type="text"
            value={searchText}
            onChange={(event) => setSearchText(event.target.value)}
            placeholder="Search for products ..."
            aria-label="Search products"
            className="min-w-0 w-full rounded-l-full border border-r-0 border-slate-700/70 bg-[#111827] px-4 py-2.5 text-sm font-medium text-slate-100 outline-none transition duration-300 placeholder:text-slate-500 hover:bg-[#131c31] focus:border-sky-400 focus:bg-[#131c31] focus:ring-4 focus:ring-sky-400/10 sm:px-5"
          />
          <button
            type="submit"
            aria-label="Submit product search"
            className="flex shrink-0 items-center justify-center rounded-r-full bg-sky-500 px-4 text-slate-950 transition duration-300 hover:bg-sky-300 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-sky-400/25"
          >
            <FiSearch className="text-lg transition-transform duration-200 group-focus-within:scale-110" />
          </button>
        </form>

        <div className="ml-auto">
          <HeaderUser />
        </div>
      </div>

      <HeaderBottom />
    </header>
  );
}
