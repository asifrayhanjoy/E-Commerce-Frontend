"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { AlignLeft, ChevronDown } from "lucide-react";
import { navItems, NavItemsTypes } from "@/config/constants";

const departments = [
  { label: "Electronics", href: "/electronics" },
  { label: "Fashion", href: "/fashion" },
  { label: "Beauty & Health", href: "/beauty" },
  { label: "Sports & Outdoors", href: "/sports" },
  { label: "Home & Garden", href: "/home" },
  { label: "Toys & Games", href: "/toys" },
  { label: "Books", href: "/books" },
  { label: "Automotive", href: "/automotive" },
];

const HeaderBottom = () => {
  const [show, setShow] = useState(false);
  const [isSticky, setIsSticky] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 100) {
        setIsSticky(true);
      } else {
        setIsSticky(false);
      }
    };

    window.addEventListener("scroll", handleScroll);

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  return (
    <div
      className={`w-full transition-all duration-300 ${
        isSticky
          ? "fixed top-0 left-0 z-[100] bg-white shadow-lg"
          : "relative"
      }`}
    >
      <div
        className={`w-[80%] relative m-auto flex items-center justify-between ${
          isSticky ? "pt-3" : "py-0"
        }`}
      >
        {/* All Departments Button */}
        <div
          className={`w-[260px] ${
            isSticky && "-mb-2"
          } cursor-pointer flex items-center justify-between bg-blue-600 px-5 py-3 rounded-md`}
          onClick={() => setShow(!show)}
        >
          <div className="flex items-center gap-2">
            <AlignLeft color="white" size={20} />
            <span className="text-white font-medium">All Departments</span>
          </div>
          <ChevronDown
            color="white"
            size={18}
            className={`transition-transform duration-200 ${show ? "rotate-180" : ""}`}
          />
        </div>

        {/* Departments Dropdown */}
        {show && (
          <div
            className={`absolute left-0 ${
              isSticky ? "top-[70px]" : "top-[50px]"
            } w-[260px] bg-white border border-gray-200 shadow-lg rounded-sm z-50`}
          >
            {departments.map((dept) => (
              <Link
                key={dept.href}
                href={dept.href}
                onClick={() => setShow(false)}
                className="block px-5 py-2.5 text-sm text-gray-700 hover:bg-blue-600 hover:text-white transition-colors duration-150"
              >
                {dept.label}
              </Link>
            ))}
          </div>
        )}

        {/* Right-side Nav Links */}
        <nav className="flex items-center gap-8">
          {navItems.map((item: NavItemsTypes) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-sm font-semibold text-gray-800 hover:text-blue-600 transition-colors"
            >
              {item.title}
            </Link>
          ))}
        </nav>
      </div>
    </div>
  );
};

export default HeaderBottom;
