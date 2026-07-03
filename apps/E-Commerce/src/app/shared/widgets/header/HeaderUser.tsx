"use client";
import Link from "next/link";
import ProfileIcon from "../../../assete/svgs/profile.icon";
import HeartIcon from "../../../assete/svgs/heard.icon";
import CartIcon from "../../../assete/svgs/card.icon";
import useUser from "@/hooks/use.User";

export default function HeaderUser() {
  const wishlistCount = 0;
  const cartCount = 0;


      const { user, isLoading } = useUser();


  return (
    <>
      <div className="flex items-center gap-2">
        {/* Profile */}
        {!isLoading && user ? (
          <>
            <Link href="/profile" className="border-2 w-[50px] h-[50px] flex items-center justify-center rounded-full">
              <ProfileIcon size={24} color="#333" />
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
    </>
  );
}
