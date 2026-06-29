"use client";
import Link from "next/link";
import ProfileIcon from "../../../assete/svgs/profile.icon";
import HeartIcon from "../../../assete/svgs/heard.icon";
import CartIcon from "../../../assete/svgs/card.icon";

export default function HeaderUser() {
  const wishlistCount = 0;
  const cartCount = 0;

  return (
    <div className="flex items-center gap-6">
      {/* Profile */}
      <Link href="/login" className="flex items-center gap-3">
        <div className="w-11 h-11 rounded-full bg-gray-100 flex items-center justify-center">
          <ProfileIcon size={24} color="#333" />
        </div>
        <div className="flex flex-col leading-tight">
          <span className="text-sm text-gray-500">Hello,</span>
          <span className="text-sm font-semibold text-gray-800">Sign In</span>
        </div>
      </Link>

      <div className="flex items-center gap-5">
        {/* Wishlist */}
        <Link href="/wishlist" className="relative">
          <HeartIcon size={26} color="#555" />
          <div className="w-6 h-6 border-2 border-white bg-red-500 rounded-full absolute -top-2 -right-3 flex items-center justify-center">
            <span className="text-white font-medium text-sm">{wishlistCount}</span>
          </div>
        </Link>

        {/* Cart */}
        <Link href="/cart" className="relative">
          <CartIcon size={26} color="#555" />
          <div className="w-6 h-6 border-2 border-white bg-red-500 rounded-full absolute -top-2 -right-3 flex items-center justify-center">
            <span className="text-white font-medium text-sm">{cartCount > 9 ? "9+" : cartCount}</span>
          </div>
        </Link>
      </div>
    </div>
  );
}
