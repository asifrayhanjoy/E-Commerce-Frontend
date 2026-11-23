import { Mail } from "lucide-react";
import Link from "next/link";
import BrandLogo from "@/components/brand/BrandLogo";
import { navItems } from "@/config/constants";

const accountLinks = [
  { label: "Track Orders", href: "/profile?active=My%20Orders" },
  { label: "Wishlist", href: "/wishlist" },
  { label: "My Account", href: "/profile" },
];

const informationLinks = [
  { label: "Home", href: "/" },
  { label: "Products", href: "/products" },
  { label: "Shops", href: "/shops" },
  { label: "Current Offers", href: "/offers" },
  {
    label: "Become a Seller",
    href:
      navItems.find((item) => item.title === "Become A Seller")?.href ||
      "/become-a-seller",
  },
];

export default function Footer() {
  return (
    <footer className="mt-14 bg-[#070b14] sm:mt-20">
      <div className="mx-auto grid w-[90%] max-w-[1320px] gap-9 py-10 lg:w-[88%] lg:grid-cols-[1.4fr_1fr_1fr_1.2fr] lg:gap-12 lg:py-12">
        <div>
          <BrandLogo />
          <p className="mt-4 max-w-[300px] text-sm font-medium leading-6 text-slate-400">
            A trusted marketplace for thoughtful finds and independent sellers.
          </p>
        </div>

        <div>
          <h2 className="text-base font-bold text-slate-100">My Account</h2>
          <div className="mt-4 space-y-3 text-sm font-semibold text-slate-400">
            {accountLinks.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                className="block transition-colors duration-200 hover:text-sky-300"
              >
                {item.label}
              </Link>
            ))}
          </div>
        </div>

        <div>
          <h2 className="text-base font-bold text-slate-100">Explore</h2>
          <div className="mt-4 space-y-3 text-sm font-semibold text-slate-400">
            {informationLinks.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                className="block transition-colors duration-200 hover:text-sky-300"
              >
                {item.label}
              </Link>
            ))}
          </div>
        </div>

        <div>
          <h2 className="text-base font-bold text-slate-100">Contact</h2>
          <p className="mt-4 text-sm leading-6 text-slate-400">
            Questions? Send our team a message.
          </p>
          <a
            href="mailto:support@eshop.com"
            className="mt-3 inline-flex items-center gap-2 text-sm font-semibold text-slate-200 transition-colors hover:text-sky-300"
          >
            <Mail size={17} />
            support@eshop.com
          </a>
        </div>
      </div>

      <div className="mx-auto w-[90%] max-w-[1320px] py-5 text-sm font-medium text-slate-500 lg:w-[88%]">
        <p>Copyright 2026 ARJ GROUP. All rights reserved.</p>
      </div>
    </footer>
  );
}
