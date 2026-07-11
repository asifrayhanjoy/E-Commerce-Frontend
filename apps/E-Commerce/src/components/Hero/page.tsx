"use client";

import { MoveRight } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import React from "react";

const Hero = () => {
  const router = useRouter();

  return (
    <div className="bg-[#115061] h-[85vh] min-h-[560px] flex items-center">
      <div className="w-[90%] max-w-[1240px] mx-auto grid grid-cols-1 md:grid-cols-2 items-center gap-14 md:gap-20">
        <div className="w-full pl-3 md:pl-5 md:-translate-y-8">
          <p
            className="font-Roboto font-semibold text-white pb-4"
            style={{ fontSize: "clamp(18px, 1.55vw, 24px)", lineHeight: 1.15 }}
          >
            Starting from $499
          </p>

          <h1
            className="text-white font-extrabold font-Roboto"
            style={{ fontSize: "clamp(52px, 4.6vw, 72px)", lineHeight: 1.02 }}
          >
            The best Samsung <br />
            Collection 2025
          </h1>

          <p
            className="font-Oregano pt-6 text-white"
            style={{ fontSize: "clamp(27px, 2.3vw, 35px)", lineHeight: 1.2 }}
          >
            Exclusive offer{" "}
            <span className="text-yellow-400">10%</span> off this week
          </p>

          <button
            onClick={() => router.push("/products")}
            className="mt-7 w-[132px] h-[42px] flex items-center justify-center gap-2 text-base font-semibold bg-white text-black rounded-[4px] hover:text-white hover:bg-black transition-all"
          >
            Shop Now
            <MoveRight size={18} />
          </button>
        </div>

        <div className="w-full flex justify-center md:justify-end">
          <Image
            src="/Main.png"
            alt="Samsung phone collection"
            width={600}
            height={600}
            priority
            className="w-full max-w-[480px] xl:max-w-[550px] h-auto object-contain"
          />
        </div>
      </div>
    </div>
  );
};

export default Hero;
