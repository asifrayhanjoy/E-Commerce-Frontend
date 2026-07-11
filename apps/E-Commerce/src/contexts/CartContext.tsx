"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

export type CartProduct = {
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

const getProductKey = (product: CartProduct) => product.id || product.slug;

const getProductPrice = (product: CartProduct) => {
  const price = Number(product.sale_price ?? product.price ?? 0);
  return Number.isFinite(price) ? price : 0;
};

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);

  useEffect(() => {
    try {
      const savedCart = window.localStorage.getItem(STORAGE_KEY);
      if (savedCart) {
        setCartItems(JSON.parse(savedCart));
      }
    } catch {
      setCartItems([]);
    }
  }, []);

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(cartItems));
  }, [cartItems]);

  const addToCart = useCallback((product: CartProduct, quantity = 1) => {
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
  }, []);

  const removeFromCart = useCallback((product: CartProduct) => {
    const productKey = getProductKey(product);

    if (!productKey) {
      return;
    }

    setCartItems((currentItems) =>
      currentItems.filter((item) => getProductKey(item.product) !== productKey)
    );
  }, []);

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
    },
    [removeFromCart]
  );

  const clearCart = useCallback(() => {
    setCartItems([]);
  }, []);

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
