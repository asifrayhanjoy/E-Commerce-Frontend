import React from "react";

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
        href: "/become-a-seller"
    }
]
