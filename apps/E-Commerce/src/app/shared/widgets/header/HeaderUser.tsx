"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import ProfileIcon from "../../../assete/svgs/profile.icon";
import HeartIcon from "../../../assete/svgs/heard.icon";
import CartIcon from "../../../assete/svgs/card.icon";
import useUser from "@/hooks/use.User";
import { useCart } from "@/contexts/CartContext";
import { useWishlist } from "@/contexts/WishlistContext";
import { getImageUrl } from "@/utils/shopImages";
import {
  emptySiteCustomization,
  fetchSiteCustomization,
} from "@/utils/siteCustomization";

const getUserAvatarUrl = (user: any) =>
  getImageUrl(
    user?.avatar,
    user?.avatarUrl,
    user?.profilePhoto,
    user?.profilePhotoUrl,
    user?.profileImage,
    user?.profileImageUrl,
    user?.image,
    user?.imageUrl,
    user?.picture,
    user?.photo
  );

export default function HeaderUser() {
  const { cartCount } = useCart();
  const { wishlistCount } = useWishlist();
  const { user, isLoading } = useUser();
  const [failedAvatarUrl, setFailedAvatarUrl] = useState("");
  const { data: siteCustomization = emptySiteCustomization } = useQuery({
    queryKey: ["site-customization", "admin-images-v3"],
    queryFn: fetchSiteCustomization,
    staleTime: 0,
  });
  const accountAvatarUrl = getUserAvatarUrl(user);
  const userAvatarUrl =
    [accountAvatarUrl, siteCustomization.logoUrl].find(
      (url) => url && url !== failedAvatarUrl
    ) || "";
  const displayCartCount = user ? cartCount : 0;
  const displayWishlistCount = user ? wishlistCount : 0;

  useEffect(() => {
    setFailedAvatarUrl("");
  }, [accountAvatarUrl, siteCustomization.logoUrl]);

  return (
    <div className="flex items-center gap-4 sm:gap-6">
      <div className="flex items-center gap-2.5">
        {!isLoading && user ? (
          <>
            <Link
              href="/profile"
              aria-label="Open your profile"
              className="grid size-10 shrink-0 place-items-center rounded-full border border-white/10 bg-[#111827] p-0.5 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-sky-300/50 hover:shadow-md"
            >
              {userAvatarUrl ? (
                <img
                  src={userAvatarUrl}
                  alt={user?.name || "Profile"}
                  className="h-full w-full rounded-full object-cover"
                  onError={() => setFailedAvatarUrl(userAvatarUrl)}
                />
              ) : (
                <ProfileIcon size={24} color="#38bdf8" />
              )}
            </Link>
            <Link href="/profile" className="hidden leading-tight sm:block">
              <span className="block text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-400">
                Welcome back
              </span>
              <span className="mt-1 block max-w-28 truncate text-sm font-bold text-slate-100 transition-colors hover:text-sky-300">
                {user?.name || "My account"}
              </span>
            </Link>
          </>
        ) : (
          <>
            <Link
              href="/login"
              aria-label="Sign in"
              className="grid size-10 shrink-0 place-items-center rounded-full border border-white/10 bg-[#111827] text-slate-300 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-sky-300/50 hover:text-sky-300 hover:shadow-md"
            >
              <ProfileIcon size={22} color="currentColor" />
            </Link>
            <Link href="/login" className="hidden leading-tight sm:block">
              <span className="block text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-400">
                Welcome
              </span>
              <span className="mt-1 block text-sm font-bold text-slate-100 transition-colors hover:text-sky-300">
                Sign in
              </span>
            </Link>
          </>
        )}
      </div>

      <div className="flex items-center gap-1">
        <Link
          href="/wishlist"
          aria-label={`Wishlist, ${displayWishlistCount} items`}
          className="group relative grid size-11 place-items-center rounded-full text-slate-200 transition duration-200 hover:bg-emerald-950/60 hover:text-emerald-300"
        >
          <HeartIcon size={28} color="currentColor" />
          <span className="badge-pop absolute -right-1 -top-1 grid min-h-5 min-w-5 place-items-center rounded-full border-2 border-[#070b14] bg-amber-400 px-1 text-[10px] font-extrabold leading-none text-[#111827] shadow-md transition-transform duration-200 group-hover:scale-110">
            {displayWishlistCount > 9 ? "9+" : displayWishlistCount}
          </span>
        </Link>

        <Link
          href="/cart"
          aria-label={`Cart, ${displayCartCount} items`}
          className="group relative grid size-11 place-items-center rounded-full text-slate-200 transition duration-200 hover:bg-blue-950/60 hover:text-sky-300"
        >
          <CartIcon size={28} color="currentColor" />
          <span className="badge-pop absolute -right-1 -top-1 grid min-h-5 min-w-5 place-items-center rounded-full border-2 border-[#070b14] bg-sky-300 px-1 text-[10px] font-extrabold leading-none text-[#07111f] shadow-md transition-transform duration-200 group-hover:scale-110">
            {displayCartCount > 9 ? "9+" : displayCartCount}
          </span>
        </Link>
      </div>
    </div>
  );
}
