"use client";
import { FiSearch, FiShoppingCart } from "react-icons/fi";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
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
    <div className="w-full bg-white shadow-sm">
      <div className="w-[80%] mx-auto py-5 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 cursor-pointer">
          <span className="relative flex h-10 w-10 items-center justify-center rounded-full bg-[#f8bd24] text-white shadow-sm">
            <span className="absolute -bottom-1 left-1/2 h-4 w-4 -translate-x-1/2 rotate-45 rounded-[3px] bg-[#f8bd24]" />
            <FiShoppingCart className="relative z-10 text-lg stroke-[3]" />
          </span>
          <span className="text-[34px] font-black leading-none tracking-tight">
            <span className="text-[#f8bd24]">E-</span>
            <span className="text-[#1f2328]">Shop</span>
          </span>
        </Link>

        <form className="w-[50%] flex items-stretch" onSubmit={handleSearchSubmit}>
          <input
            type="text"
            value={searchText}
            onChange={(event) => setSearchText(event.target.value)}
            placeholder="Search for products ..."
            className="w-full px-4 py-3 font-medium bg-gray-100 border-[2.5px] border-[#1a71eb] border-r-0 outline-none"
          />
          <button
            type="submit"
            className="bg-[#1a71eb] px-4 flex items-center justify-center cursor-pointer"
          >
            <FiSearch className="text-white text-xl" />
          </button>
        </form>

        <HeaderUser />
      </div>

      <div className="border-b border-b-[#99999938]">
        <HeaderBottom  />
      </div>
    </div>
  );
}
