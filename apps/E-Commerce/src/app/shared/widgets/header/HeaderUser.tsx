"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import ProfileIcon from "../../../assete/svgs/profile.icon";
import HeartIcon from "../../../assete/svgs/heard.icon";
import CartIcon from "../../../assete/svgs/card.icon";
import { MessageCircle } from "lucide-react";
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
    <>
      <div className="flex items-center gap-2">
        {/* Profile */}
        {!isLoading && user ? (
          <>
            <Link href="/profile" className="border-2 w-[50px] h-[50px] flex items-center justify-center rounded-full">
              {userAvatarUrl ? (
                <img
                  src={userAvatarUrl}
                  alt={user?.name || "Profile"}
                  className="h-full w-full rounded-full object-cover"
                  onError={() => setFailedAvatarUrl(userAvatarUrl)}
                />
              ) : (
                <ProfileIcon size={24} color="#333" />
              )}
            </Link>
            <Link href="/profile" className="leading-tight">
              <span className="block text-sm font-medium text-gray-500">
                Hello,
              </span>
              <span className="text-[14px] font-semibold text-gray-800">
                {user?.name}
              </span>
            </Link>
          </>
        )
      :(
        <>
        <Link
          href="/login"
          className="border-2 w-[50px] h-[50px] flex items-center justify-center rounded-full"
        >
          <ProfileIcon size={24} color="#333" />
        </Link>
         <Link href="/login" className="leading-tight">
          <span className="block text-sm font-medium text-gray-500">
            Hello,
          </span>
          <span className="text-[18px] font-semibold text-gray-800">
            Sign In
          </span>
        </Link>
        </>
      )
      }

       
      </div>

      <div className="flex items-center gap-5">
        {user && (
          <Link href="/inbox" className="relative">
            <MessageCircle size={27} color="#555" strokeWidth={2.4} />
          </Link>
        )}

        {/* Wishlist */}
        <Link href="/wishlist" className="relative">
          <HeartIcon size={26} color="#555" />
          <div className="w-6 h-6 border-2 border-white bg-red-500 rounded-full absolute -top-2 -right-3 flex items-center justify-center">
            <span className="text-white font-medium text-sm">
              {displayWishlistCount > 9 ? "9+" : displayWishlistCount}
            </span>
          </div>
        </Link>

        {/* Cart */}
        <Link href="/cart" className="relative">
          <CartIcon size={26} color="#555" />
          <div className="w-6 h-6 border-2 border-white bg-red-500 rounded-full absolute -top-2 -right-3 flex items-center justify-center">
            <span className="text-white font-medium text-sm">
              {displayCartCount > 9 ? "9+" : displayCartCount}
            </span>
          </div>
        </Link>
      </div>
    </>
  );
}
