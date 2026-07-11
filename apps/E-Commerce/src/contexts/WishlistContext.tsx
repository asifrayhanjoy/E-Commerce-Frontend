"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

export type WishlistProduct = {
  id?: string;
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
  Shop?: { name?: string };
  shop?: { name?: string };
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

const getProductKey = (product: WishlistProduct) => product.id || product.slug;

export function WishlistProvider({ children }: { children: React.ReactNode }) {
  const [wishlistItems, setWishlistItems] = useState<WishlistProduct[]>([]);

  useEffect(() => {
    try {
      const savedWishlist = window.localStorage.getItem(STORAGE_KEY);
      if (savedWishlist) {
        setWishlistItems(JSON.parse(savedWishlist));
      }
    } catch {
      setWishlistItems([]);
    }
  }, []);

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(wishlistItems));
  }, [wishlistItems]);

  const isInWishlist = useCallback(
    (product: WishlistProduct) => {
      const productKey = getProductKey(product);
      return wishlistItems.some((item) => getProductKey(item) === productKey);
    },
    [wishlistItems]
  );

  const toggleWishlist = useCallback((product: WishlistProduct) => {
    const productKey = getProductKey(product);
    if (!productKey) {
      return;
    }

    setWishlistItems((currentItems) => {
      const exists = currentItems.some(
        (item) => getProductKey(item) === productKey
      );

      if (exists) {
        return currentItems.filter((item) => getProductKey(item) !== productKey);
      }

      return [...currentItems, product];
    });
  }, []);

  const removeFromWishlist = useCallback((product: WishlistProduct) => {
    const productKey = getProductKey(product);
    if (!productKey) {
      return;
    }

    setWishlistItems((currentItems) =>
      currentItems.filter((item) => getProductKey(item) !== productKey)
    );
  }, []);

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
