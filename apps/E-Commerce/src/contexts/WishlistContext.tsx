"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import useUser from "@/hooks/use.User";
import { syncProductWishlist } from "@/utils/productTracking";

export type WishlistProduct = {
  id?: string;
  _id?: string;
  productId?: string;
  shopId?: string;
  slug?: string;
  title?: string;
  name?: string;
  brand?: string;
  images?: { url?: string }[];
  ratings?: number;
  sale_price?: number;
  price?: number;
  regular_price?: number;
  sold?: number;
  totalSold?: number;
  sold_out?: number;
  stock?: number;
  Shop?: { id?: string; _id?: string; name?: string };
  shop?: { id?: string; _id?: string; name?: string };
};

type WishlistContextValue = {
  wishlistItems: WishlistProduct[];
  wishlistCount: number;
  isInWishlist: (product: WishlistProduct) => boolean;
  toggleWishlist: (product: WishlistProduct) => void;
  removeFromWishlist: (product: WishlistProduct) => void;
};

const STORAGE_KEY = "e-shop-wishlist";
const WishlistContext = createContext<WishlistContextValue | undefined>(
  undefined
);

const getProductKey = (product: WishlistProduct) =>
  product.id || product._id || product.productId || product.slug;

const getStorageKey = (user: any) => {
  const userKey = user?.id || user?._id || user?.email || "guest";
  return `${STORAGE_KEY}:${userKey}`;
};

export function WishlistProvider({ children }: { children: React.ReactNode }) {
  const { user } = useUser();
  const storageKey = useMemo(() => getStorageKey(user), [user]);
  const [wishlistItems, setWishlistItems] = useState<WishlistProduct[]>([]);
  const [loadedStorageKey, setLoadedStorageKey] = useState<string | null>(null);

  useEffect(() => {
    let nextItems: WishlistProduct[] = [];

    try {
      const savedWishlist = window.localStorage.getItem(storageKey);
      if (savedWishlist) {
        const parsedItems: unknown = JSON.parse(savedWishlist);
        if (Array.isArray(parsedItems)) {
          nextItems = parsedItems;
        } else {
          console.error("Stored wishlist data is not an array.");
        }
      }
    } catch (error) {
      console.error("Failed to load wishlist from local storage.", error);
    }

    setWishlistItems(nextItems);
    setLoadedStorageKey(storageKey);
  }, [storageKey]);

  useEffect(() => {
    if (loadedStorageKey !== storageKey) {
      return;
    }

    try {
      window.localStorage.setItem(storageKey, JSON.stringify(wishlistItems));
    } catch (error) {
      console.error("Failed to save wishlist to local storage.", error);
    }
  }, [loadedStorageKey, storageKey, wishlistItems]);

  const isInWishlist = useCallback(
    (product: WishlistProduct) => {
      const productKey = getProductKey(product);
      return wishlistItems.some((item) => getProductKey(item) === productKey);
    },
    [wishlistItems]
  );

  const syncWishlistChange = useCallback(
    (product: WishlistProduct, action: "add" | "remove") => {
      void syncProductWishlist(product, user, action).catch((error) => {
        console.log("Failed to sync wishlist with database", error);
      });
    },
    [user]
  );

  const toggleWishlist = useCallback(
    (product: WishlistProduct) => {
      const productKey = getProductKey(product);
      if (!productKey) {
        return;
      }

      const exists = wishlistItems.some(
        (item) => getProductKey(item) === productKey
      );

      setWishlistItems((currentItems) => {
        if (exists) {
          return currentItems.filter(
            (item) => getProductKey(item) !== productKey
          );
        }

        return [...currentItems, product];
      });
      syncWishlistChange(product, exists ? "remove" : "add");
    },
    [syncWishlistChange, wishlistItems]
  );

  const removeFromWishlist = useCallback(
    (product: WishlistProduct) => {
      const productKey = getProductKey(product);
      if (!productKey) {
        return;
      }

      setWishlistItems((currentItems) =>
        currentItems.filter((item) => getProductKey(item) !== productKey)
      );
      syncWishlistChange(product, "remove");
    },
    [syncWishlistChange]
  );

  const value = useMemo(
    () => ({
      wishlistItems,
      wishlistCount: wishlistItems.length,
      isInWishlist,
      toggleWishlist,
      removeFromWishlist,
    }),
    [isInWishlist, removeFromWishlist, toggleWishlist, wishlistItems]
  );

  return (
    <WishlistContext.Provider value={value}>
      {children}
    </WishlistContext.Provider>
  );
}

export function useWishlist() {
  const context = useContext(WishlistContext);

  if (!context) {
    throw new Error("useWishlist must be used within WishlistProvider");
  }

  return context;
}
