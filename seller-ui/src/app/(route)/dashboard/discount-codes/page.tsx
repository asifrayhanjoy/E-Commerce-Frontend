"use client";

import { ChevronRight, Plus } from "lucide-react";
import Link from "next/link";
import React, { useState } from "react";

const Page = () => {
  const [, setShowModal] = useState(false);

  return (
    <div className="w-full min-h-screen p-12">
      <div className="flex justify-between items-center mb-2">
        <h2 className="text-2xl font-bold text-white"> Discount Codes </h2>

        <button
          className="text-[#80Deea] text-white px-4 py-2 rounded-lg flex items-center gap-2"
          onClick={() => setShowModal(true)}
        >
          <Plus size={20} />
          Create Discount
        </button>
      </div>
      <div className="flex items-center text-white">
        <Link href={"/"} className="text-[#80Deea] cursor-pointer">Dashboard</Link>
        <ChevronRight size={20} className="opacity-[.8]" />
        <span>Discount Codes</span>
      </div>
    </div>
  );
};

export default Page;
