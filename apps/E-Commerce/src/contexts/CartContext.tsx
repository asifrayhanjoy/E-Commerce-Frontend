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
import { syncProductCart } from "@/utils/productTracking";

export type CartProduct = {
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

export type CartItem = {
  product: CartProduct;
  quantity: number;
};

type CartContextValue = {
  cartItems: CartItem[];
  cartCount: number;
  cartTotal: number;
  addToCart: (product: CartProduct, quantity?: number) => void;
  removeFromCart: (product: CartProduct) => void;
  updateCartQuantity: (product: CartProduct, quantity: number) => void;
  clearCart: () => void;
  isInCart: (product: CartProduct) => boolean;
  getCartQuantity: (product: CartProduct) => number;
};

const STORAGE_KEY = "e-shop-cart";
const CartContext = createContext<CartContextValue | undefined>(undefined);

const getProductKey = (product: CartProduct) =>
  product.id || product._id || product.productId || product.slug;

const getStorageKey = (user: any) => {
  const userKey = user?.id || user?._id || user?.email || "guest";
  return `${STORAGE_KEY}:${userKey}`;
};

const getProductPrice = (product: CartProduct) => {
  const price = Number(product.sale_price ?? product.price ?? 0);
  return Number.isFinite(price) ? price : 0;
};

export function CartProvider({ children }: { children: React.ReactNode }) {
  const { user } = useUser();
  const storageKey = useMemo(() => getStorageKey(user), [user]);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);

  useEffect(() => {
    try {
      const savedCart = window.localStorage.getItem(storageKey);
      if (savedCart) {
        setCartItems(JSON.parse(savedCart));
        return;
      }

      setCartItems([]);
    } catch {
      setCartItems([]);
    }
  }, [storageKey]);

  useEffect(() => {
    window.localStorage.setItem(storageKey, JSON.stringify(cartItems));
  }, [cartItems, storageKey]);

  const syncCartChange = useCallback(
    (product: CartProduct, action: "add" | "remove" | "set", quantity = 1) => {
      void syncProductCart(product, user, action, quantity).catch((error) => {
        console.log("Failed to sync cart with database", error);
      });
    },
    [user]
  );

  const addToCart = useCallback(
    (product: CartProduct, quantity = 1) => {
      const productKey = getProductKey(product);
      const nextQuantity = Math.max(1, quantity);

      if (!productKey) {
        return;
      }

      setCartItems((currentItems) => {
        const existingItem = currentItems.find(
          (item) => getProductKey(item.product) === productKey
        );

        if (existingItem) {
          return currentItems.map((item) =>
            getProductKey(item.product) === productKey
              ? { ...item, quantity: item.quantity + nextQuantity }
              : item
          );
        }

        return [...currentItems, { product, quantity: nextQuantity }];
      });
      syncCartChange(product, "add", nextQuantity);
    },
    [syncCartChange]
  );

  const removeFromCart = useCallback(
    (product: CartProduct) => {
      const productKey = getProductKey(product);

      if (!productKey) {
        return;
      }

      setCartItems((currentItems) =>
        currentItems.filter((item) => getProductKey(item.product) !== productKey)
      );
      syncCartChange(product, "remove");
    },
    [syncCartChange]
  );

  const updateCartQuantity = useCallback(
    (product: CartProduct, quantity: number) => {
      const productKey = getProductKey(product);

      if (!productKey) {
        return;
      }

      if (quantity <= 0) {
        removeFromCart(product);
        return;
      }

      setCartItems((currentItems) =>
        currentItems.map((item) =>
          getProductKey(item.product) === productKey
            ? { ...item, quantity }
            : item
        )
      );
      syncCartChange(product, "set", quantity);
    },
    [removeFromCart, syncCartChange]
  );

  const clearCart = useCallback(() => {
    cartItems.forEach((item) => {
      syncCartChange(item.product, "remove");
    });
    setCartItems([]);
  }, [cartItems, syncCartChange]);

  const isInCart = useCallback(
    (product: CartProduct) => {
      const productKey = getProductKey(product);
      return cartItems.some((item) => getProductKey(item.product) === productKey);
    },
    [cartItems]
  );

  const getCartQuantity = useCallback(
    (product: CartProduct) => {
      const productKey = getProductKey(product);
      const item = cartItems.find(
        (cartItem) => getProductKey(cartItem.product) === productKey
      );

      return item?.quantity || 0;
    },
    [cartItems]
  );

  const cartCount = useMemo(
    () => cartItems.reduce((total, item) => total + item.quantity, 0),
    [cartItems]
  );

  const cartTotal = useMemo(
    () =>
      cartItems.reduce(
        (total, item) => total + getProductPrice(item.product) * item.quantity,
        0
      ),
    [cartItems]
  );

  const value = useMemo(
    () => ({
      cartItems,
      cartCount,
      cartTotal,
      addToCart,
      removeFromCart,
      updateCartQuantity,
      clearCart,
      isInCart,
      getCartQuantity,
    }),
    [
      addToCart,
      cartCount,
      cartItems,
      cartTotal,
      clearCart,
      getCartQuantity,
      isInCart,
      removeFromCart,
      updateCartQuantity,
    ]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error("useCart must be used within CartProvider");
  }

  return context;
}
