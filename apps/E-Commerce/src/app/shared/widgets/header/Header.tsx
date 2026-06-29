"use client";
import { FiSearch } from "react-icons/fi";
import Link from "next/link";
import HeaderUser from "./HeaderUser";
import HeaderBottom from "./header.bottom";

export default function Header() {
  return (
    <div className="w-full bg-white shadow-sm">
      <div className="w-[80%] mx-auto py-5 flex items-center justify-between">
        <Link href="/">
          <span className="text-2xl font-semibold text-red-500 cursor-pointer">
            Eshop
          </span>
        </Link>

        <div className="w-[50%] flex items-stretch">
          <input
            type="text"
            placeholder="Search for products ..."
            className="w-full px-4 py-3 font-medium bg-gray-100 border-[2.5px] border-[#1a71eb] border-r-0 outline-none"
          />
          <button className="bg-[#1a71eb] px-4 flex items-center justify-center cursor-pointer">
            <FiSearch className="text-white text-xl" />
          </button>
        </div>

        <HeaderUser />
      </div>

      <div className="border-b border-b-[#99999938]">
        <HeaderBottom  />
      </div>
    </div>
  );
}