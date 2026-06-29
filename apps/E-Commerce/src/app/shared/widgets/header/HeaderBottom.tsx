"use client";
import { useState } from "react";
import { FiChevronDown, FiMenu } from "react-icons/fi";
import Link from "next/link";

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

export default function HeaderBottom() {
  const [open, setOpen] = useState(false);

  return (
    <div className="w-[80%] mx-auto py-3 flex items-center gap-8">
      <div className="relative">
        <button
          onClick={() => setOpen((prev) => !prev)}
          className="bg-[#1a71eb] text-white flex items-center gap-3 px-5 py-2.5 rounded-sm cursor-pointer"
        >
          <FiMenu className="text-xl" />
          <span className="font-medium text-sm">All Departments</span>
          <FiChevronDown
            className={`text-lg transition-transform duration-200 ${open ? "rotate-180" : ""}`}
          />
        </button>

        {open && (
          <div className="absolute top-full left-0 mt-1 w-56 bg-white border border-gray-200 shadow-lg z-50 rounded-sm">
            {departments.map((dept) => (
              <Link
                key={dept.href}
                href={dept.href}
                onClick={() => setOpen(false)}
                className="block px-5 py-2.5 text-sm text-gray-700 hover:bg-[#1a71eb] hover:text-white transition-colors duration-150"
              >
                {dept.label}
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
