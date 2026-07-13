import {
  Headphones,
  Mail,
  MapPin,
  Phone,
  Send,
  ShieldCheck,
  Truck,
} from "lucide-react";
import Link from "next/link";
import { FaFacebookF, FaInstagram, FaTwitter } from "react-icons/fa";

const accountLinks = [
  { label: "Track Orders", href: "#" },
  { label: "Shipping", href: "#" },
  { label: "Wishlist", href: "/wishlist" },
  { label: "My Account", href: "/profile" },
  { label: "Order History", href: "#" },
  { label: "Returns", href: "#" },
];

const informationLinks = [
  { label: "About E-Shop", href: "#" },
  { label: "Careers", href: "#" },
  { label: "Privacy Policy", href: "#" },
  { label: "Terms & Conditions", href: "#" },
  { label: "Latest News", href: "#" },
  { label: "Contact Us", href: "#" },
];

const supportItems = [
  {
    icon: Truck,
    title: "Fast Delivery",
    text: "Reliable shipping on every order",
  },
  {
    icon: ShieldCheck,
    title: "Secure Shopping",
    text: "Protected checkout and account data",
  },
  {
    icon: Headphones,
    title: "Customer Support",
    text: "Help from the E-Shop team",
  },
];

export default function Footer() {
  return (
    <footer className="border-t border-slate-200 bg-white">
      <div className="mx-auto grid w-[90%] max-w-[1500px] gap-8 py-10 lg:w-[80%] lg:grid-cols-3">
        {supportItems.map((item) => {
          const Icon = item.icon;

          return (
            <div
              key={item.title}
              className="flex items-center gap-4 border-b border-slate-100 pb-6 lg:border-b-0 lg:pb-0"
            >
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-md bg-blue-50 text-blue-700">
                <Icon size={24} />
              </span>
              <span>
                <span className="block text-base font-bold text-slate-950">
                  {item.title}
                </span>
                <span className="mt-1 block text-sm font-medium text-slate-500">
                  {item.text}
                </span>
              </span>
            </div>
          );
        })}
      </div>

      <div className="border-t border-slate-100">
        <div className="mx-auto grid w-[90%] max-w-[1500px] gap-10 py-12 lg:w-[80%] lg:grid-cols-[1.35fr_1fr_1fr_1.35fr]">
          <div>
            <Link href="/" className="inline-flex items-center gap-2">
              <span className="flex h-10 w-10 items-center justify-center rounded-md bg-[#f8bd24] text-lg font-black text-white">
                E
              </span>
              <span className="text-3xl font-black leading-none">
                <span className="text-[#f8bd24]">E-</span>
                <span className="text-slate-950">Shop</span>
              </span>
            </Link>
            <p className="mt-5 max-w-[300px] text-sm font-medium leading-6 text-slate-500">
              A complete ecommerce marketplace for discovering products from
              trusted sellers.
            </p>
            <div className="mt-6 flex gap-3">
              {[FaFacebookF, FaTwitter, FaInstagram].map((Icon, index) => (
                <a
                  key={index}
                  href="#"
                  aria-label="Social profile"
                  className="flex h-10 w-10 items-center justify-center rounded-md border border-slate-200 text-slate-500 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
                >
                  <Icon size={18} />
                </a>
              ))}
            </div>
          </div>

          <div>
            <h2 className="text-lg font-bold text-slate-950">My Account</h2>
            <div className="mt-5 space-y-3 text-sm font-semibold text-slate-500">
              {accountLinks.map((item) => (
                <Link
                  key={item.label}
                  href={item.href}
                  className="block transition hover:text-blue-700"
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </div>

          <div>
            <h2 className="text-lg font-bold text-slate-950">Information</h2>
            <div className="mt-5 space-y-3 text-sm font-semibold text-slate-500">
              {informationLinks.map((item) => (
                <Link
                  key={item.label}
                  href={item.href}
                  className="block transition hover:text-blue-700"
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </div>

          <div>
            <h2 className="text-lg font-bold text-slate-950">Talk To Us</h2>
            <p className="mt-5 text-sm font-medium text-slate-500">
              Got Questions? Call us
            </p>
            <p className="mt-2 text-2xl font-black text-slate-950">
              +670 413 90 762
            </p>
            <div className="mt-6 space-y-3 text-sm font-semibold text-slate-500">
              <p className="flex items-center gap-3">
                <Mail size={18} />
                support@eshop.com
              </p>
              <p className="flex items-start gap-3">
                <MapPin size={18} className="mt-0.5 shrink-0" />
                <span>
                  79 Sleepy Hollow St.
                  <br />
                  Jamaica, New York 1432
                </span>
              </p>
              <p className="flex items-center gap-3">
                <Phone size={18} />
                Open daily
              </p>
            </div>
            <form className="mt-6 flex overflow-hidden rounded-md border border-slate-200 bg-slate-50">
              <input
                type="email"
                aria-label="Email address"
                placeholder="Email address"
                className="min-w-0 flex-1 bg-transparent px-4 py-3 text-sm font-semibold text-slate-900 outline-none placeholder:text-slate-400"
              />
              <button
                type="submit"
                aria-label="Subscribe"
                className="flex w-12 items-center justify-center bg-blue-700 text-white transition hover:bg-blue-800"
              >
                <Send size={18} />
              </button>
            </form>
          </div>
        </div>
      </div>

      <div className="border-t border-slate-100 bg-slate-50">
        <div className="mx-auto flex w-[90%] max-w-[1500px] flex-col gap-3 py-5 text-sm font-semibold text-slate-500 lg:w-[80%] lg:flex-row lg:items-center lg:justify-between">
          <p>Copyright 2026 E-Shop. All rights reserved.</p>
          <p>Visa / Mastercard / Stripe / Cash On Delivery</p>
        </div>
      </div>
    </footer>
  );
}
