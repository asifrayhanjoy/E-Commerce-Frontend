import React from "react";

const sellerAppUrl =
    process.env.NEXT_PUBLIC_SELLER_APP_URL ||
    (process.env.NODE_ENV === "development" ? "http://localhost:6002" : "");

export type NavItemsTypes = {
    title: string
    href: string
    icon?: React.ReactNode
}

export const navItems: NavItemsTypes[] = [
    {
        title: "Home",
        href: "/"
    },
    {
        title: "Products",
        href: "/products"
    },
    {
        title: "Shops",
        href: "/shops"
    },
    {
        title: "Offers",
        href: "/offers"
    },
    {
        title: "Become A Seller",
        href: sellerAppUrl ? `${sellerAppUrl}/register` : "/become-a-seller"
    }
]
