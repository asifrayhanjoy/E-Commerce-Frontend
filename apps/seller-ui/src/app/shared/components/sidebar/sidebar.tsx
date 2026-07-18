"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Bell,
  CalendarPlus,
  Grid2X2,
  Inbox,
  List,
  LogOut,
  PackageOpen,
  PlusSquare,
  Settings,
  TicketPercent,
  WalletCards,
  Zap,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import useSeller from "@/hooks/useSeller";

type SidebarItem = {
  label: string;
  href: string;
  icon: LucideIcon;
};

type SidebarSection = {
  title?: string;
  items: SidebarItem[];
};

const sidebarSections: SidebarSection[] = [
  {
    items: [{ label: "Dashboard", href: "/dashboard", icon: Grid2X2 }],
  },
  {
    title: "Main Menu",
    items: [
      { label: "Orders", href: "/dashboard/orders", icon: List },
      { label: "Payments", href: "/dashboard/payments", icon: WalletCards },
    ],
  },
  {
    title: "Products",
    items: [
      { label: "Create Product", href: "/dashboard/create-product", icon: PlusSquare },
      { label: "All Products", href: "/dashboard/all-products", icon: PackageOpen },
    ],
  },
  {
    title: "Events",
    items: [
      { label: "Create Event", href: "/dashboard/create-event", icon: CalendarPlus },
      { label: "All Events", href: "/dashboard/events", icon: Bell },
    ],
  },
  {
    title: "Controllers",
    items: [
      { label: "Inbox", href: "/dashboard/inbox", icon: Inbox },
      { label: "Settings", href: "/dashboard/settings", icon: Settings },
      { label: "Notifications", href: "/dashboard/notifications", icon: Bell },
    ],
  },
  {
    title: "Extras",
    items: [
      { label: "Discount Codes", href: "/dashboard/discount-codes", icon: TicketPercent },
      { label: "Logout", href: "/login", icon: LogOut },
    ],
  },
];

const isActivePath = (pathname: string, href: string) => {
  if (href === "/dashboard") {
    return pathname === href;
  }

  return pathname === href || pathname.startsWith(`${href}/`);
};

const SidebarLink = ({ item }: { item: SidebarItem }) => {
  const pathname = usePathname();
  const isActive = isActivePath(pathname, item.href);
  const Icon = item.icon;

  return (
    <Link
      href={item.href}
      className={`flex h-10 items-center gap-3 rounded-md px-3 text-[16px] font-semibold transition duration-150 ${
        isActive
          ? "bg-[#123c73] text-white shadow-[0_0_0_1px_rgba(59,130,246,0.24)]"
          : "text-[#b7bbc4] hover:bg-[#111827] hover:text-white"
      }`}
    >
      <Icon
        size={20}
        strokeWidth={2.3}
        className={isActive ? "text-[#4f8dff]" : "text-[#aeb3bd]"}
      />
      <span>{item.label}</span>
    </Link>
  );
};

const SellerIdentity = () => {
  const { seller } = useSeller();
  const shopName = seller?.shop?.name || seller?.name || "Seller Panel";
  const shopAddress = seller?.shop?.address || seller?.email || "Manage your shop";

  return (
    <div className="flex items-center gap-4">
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-[#10182c] bg-[#03050a] text-[#d6dae4]">
        <Grid2X2 size={20} strokeWidth={2.4} />
      </div>
      <div className="min-w-0">
        <p className="truncate text-[18px] font-bold leading-6 text-[#f1f2f5]">
          {shopName}
        </p>
        <p className="mt-0.5 truncate text-[13px] font-semibold text-[#a4a9b5]">
          {shopAddress}
        </p>
      </div>
    </div>
  );
};

const SidebarBarWrapper = ({ children }: { children?: ReactNode }) => {
  return (
    <div className="flex min-h-screen flex-col bg-black text-white">
      <div className="px-1 pt-1">
        <SellerIdentity />
      </div>

      <nav className="mt-7 grid gap-5">
        {sidebarSections.map((section, sectionIndex) => (
          <div key={section.title || sectionIndex}>
            {section.title && (
              <p className="mb-2 px-2 text-[13px] font-bold text-[#b3b7c1]">
                {section.title}
              </p>
            )}

            <div className="grid gap-2">
              {section.items.map((item) => (
                <SidebarLink key={`${section.title || "root"}-${item.href}`} item={item} />
              ))}
            </div>
          </div>
        ))}
      </nav>

      <div className="mt-auto px-1 pb-3 pt-10">
        <div className="flex h-10 w-10 items-center justify-center rounded-full border border-[#1c2538] bg-[#171b25] text-white shadow-[0_0_0_1px_rgba(255,255,255,0.04)]">
          <Zap size={20} strokeWidth={2.4} />
        </div>
      </div>

      {children}
    </div>
  );
};

export default SidebarBarWrapper;
