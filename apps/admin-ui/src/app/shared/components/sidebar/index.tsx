"use client";

import Logo from "@/assets/svgs/logo";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

type StoredAdmin = {
  name?: string;
  email?: string;
};

type MenuIcon =
  | "grid"
  | "orders"
  | "payments"
  | "products"
  | "events"
  | "users"
  | "sellers"
  | "loggers"
  | "management"
  | "notifications"
  | "customization"
  | "logout";

type MenuItem = {
  label: string;
  href: string;
  icon: MenuIcon;
};

const defaultAdmin = {
  name: "Shahriar Sajeeb",
  email: "support@becodemy.com",
};

const mainMenuItems: MenuItem[] = [
  { label: "Orders", href: "/dashboard/orders", icon: "orders" },
  { label: "Payments", href: "/dashboard/payments", icon: "payments" },
  { label: "Products", href: "/dashboard/products", icon: "products" },
  { label: "Events", href: "/dashboard/events", icon: "events" },
  { label: "Users", href: "/dashboard/users", icon: "users" },
  { label: "Sellers", href: "/dashboard/sellers", icon: "sellers" },
];

const controllerItems: MenuItem[] = [
  { label: "Loggers", href: "/dashboard/loggers", icon: "loggers" },
  { label: "Management", href: "/dashboard/management", icon: "management" },
  {
    label: "Notifications",
    href: "/dashboard/notifications",
    icon: "notifications",
  },
];

const customizationItems: MenuItem[] = [
  {
    label: "All Customization",
    href: "/dashboard/customization",
    icon: "customization",
  },
];

const iconPath = {
  orders: "M8 6h13M8 12h13M8 18h13M3.5 6h.01M3.5 12h.01M3.5 18h.01",
  payments: "M3 8h18M5 5h14a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2Zm11 10h2",
  products: "M12 3 4 7.5l8 4.5 8-4.5L12 3Zm-8 4.5v9L12 21l8-4.5v-9M12 12v9",
  events: "M6 9a6 6 0 0 1 12 0c0 7 2 7 2 9H4c0-2 2-2 2-9Zm4 12h4M18 4v5h4",
  users: "M8.5 11a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7ZM2.5 20c.7-4.2 3-6.2 6-6.2s5.3 2 6 6.2M16 11a3 3 0 1 0 0-6M15.5 14c2.6.2 4.6 2.2 5.2 6",
  sellers: "M4 10h16l-1 10H5L4 10Zm3 0V7a5 5 0 0 1 10 0v3M4 10l2-5h12l2 5",
  loggers: "M7 4h8l4 4v12H7V4Zm8 0v5h5M10 13h6M10 17h6",
  management: "M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8ZM4 12h2M18 12h2M12 4v2M12 18v2M6.3 6.3l1.4 1.4M16.3 16.3l1.4 1.4M17.7 6.3l-1.4 1.4M7.7 16.3l-1.4 1.4",
  notifications: "M6 9a6 6 0 0 1 12 0c0 7 2 7 2 9H4c0-2 2-2 2-9Zm4 12h4",
  customization: "m4 20 4.5-4.5M14 6l4-4 4 4-4 4-4-4ZM3 7l4-4 4 4-4 4-4-4ZM13 17l4-4 4 4-4 4-4-4Z",
  logout: "M15 17l5-5-5-5M20 12H8M11 20H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h6",
};

const Icon = ({ name }: { name: MenuIcon }) => {
  if (name === "grid") {
    return (
      <svg
        width="17"
        height="17"
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="shrink-0"
      >
        <rect x="3" y="3" width="7" height="7" rx="1.5" fill="#3b82f6" />
        <rect x="14" y="3" width="7" height="7" rx="1.5" fill="#60a5fa" />
        <rect x="3" y="14" width="7" height="7" rx="1.5" fill="#60a5fa" />
        <rect x="14" y="14" width="7" height="7" rx="1.5" fill="#3b82f6" />
      </svg>
    );
  }

  return (
    <svg
      width="17"
      height="17"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="shrink-0 text-[#a7a8ad]"
    >
      <path
        d={iconPath[name]}
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};

const MenuLink = ({ item }: { item: MenuItem }) => {
  const pathname = usePathname();
  const isActive = pathname === item.href;

  return (
    <Link
      href={item.href}
      className={`flex h-9 items-center gap-3 rounded-md px-3 text-[14px] font-semibold transition-colors ${
        isActive
          ? "bg-[#092f63] text-[#dbeafe] shadow-[inset_0_0_0_1px_rgba(59,130,246,0.18)]"
          : "text-[#b0b1b6] hover:bg-[#08090d] hover:text-[#e7e8ea]"
      }`}
    >
      <Icon name={item.icon} />
      <span>{item.label}</span>
    </Link>
  );
};

const MenuSection = ({
  title,
  items,
}: {
  title?: string;
  items: MenuItem[];
}) => {
  return (
    <section className="space-y-2">
      {title && (
        <h4 className="px-1 text-[11px] font-semibold text-[#a9aaaf]">
          {title}
        </h4>
      )}

      <div className="space-y-2">
        {items.map((item) => (
          <MenuLink key={item.href} item={item} />
        ))}
      </div>
    </section>
  );
};

const SidebarMenu = () => {
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await fetch("/api/admin/logout", {
        method: "POST",
        credentials: "include",
      });
    } catch {
    }

    window.localStorage.removeItem("admin");
    router.push("/");
  };

  return (
    <nav className="mt-6 space-y-4">
      <MenuSection
        items={[{ label: "Dashboard", href: "/dashboard", icon: "grid" }]}
      />
      <MenuSection title="Main Menu" items={mainMenuItems} />
      <MenuSection title="Controllers" items={controllerItems} />
      <MenuSection title="Customization" items={customizationItems} />

      <section className="space-y-2">
        <h4 className="px-1 text-[11px] font-semibold text-[#a9aaaf]">
          Extras
        </h4>
        <button
          type="button"
          onClick={handleLogout}
          className="flex h-9 w-full items-center gap-3 rounded-md px-3 text-left text-[14px] font-semibold text-[#b0b1b6] transition-colors hover:bg-[#08090d] hover:text-[#e7e8ea]"
        >
          <Icon name="logout" />
          <span>Logout</span>
        </button>
      </section>
    </nav>
  );
};

const SidebarWrapper = () => {
  const [admin, setAdmin] = useState<StoredAdmin>(defaultAdmin);

  useEffect(() => {
    const storedAdmin = window.localStorage.getItem("admin");

    if (!storedAdmin) {
      return;
    }

    try {
      const parsedAdmin = JSON.parse(storedAdmin) as StoredAdmin;

      setAdmin({
        name: parsedAdmin.name || defaultAdmin.name,
        email: parsedAdmin.email || defaultAdmin.email,
      });
    } catch {
      setAdmin(defaultAdmin);
    }
  }, []);

  return (
    <div>
      <div className="flex cursor-pointer items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-slate-800 bg-[#08090d] shadow-[0_0_0_1px_rgba(255,255,255,0.02)]">
          <Logo />
        </div>

        <div className="min-w-0 pt-0.5">
          <h3 className="truncate text-[15px] font-semibold leading-5 text-[#e7e8ea]">
            {admin.name}
          </h3>
          <p className="mt-0.5 truncate text-[11px] font-semibold leading-4 text-[#a6a7ac]">
            {admin.email}
          </p>
        </div>
      </div>

      <SidebarMenu />
    </div>
  );
};

export default SidebarWrapper;
