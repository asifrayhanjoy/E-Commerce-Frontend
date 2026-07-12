import axiosInstance from "@/utils/axiosinstance";

type TrackableProduct = {
  id?: string;
  _id?: string;
  productId?: string;
  shopId?: string;
  Shop?: {
    id?: string;
    _id?: string;
  };
  shop?: {
    id?: string;
    _id?: string;
  };
};

type CartTrackingAction = "add" | "remove" | "set";
type WishlistTrackingAction = "add" | "remove";

const getProductId = (product: TrackableProduct) =>
  product.id || product._id || product.productId || "";

const getShopId = (product: TrackableProduct) =>
  product.shopId || product.Shop?.id || product.Shop?._id || product.shop?.id || product.shop?._id || "";

const getUserTrackingKey = (user: any) => {
  const userId = user?.id || user?._id || user?.email;
  return userId ? `user:${userId}` : "";
};

export const syncProductCart = async (
  product: TrackableProduct,
  user: any,
  action: CartTrackingAction,
  quantity = 1
) => {
  const productId = getProductId(product);
  const trackingKey = getUserTrackingKey(user);

  if (!productId || !trackingKey) {
    return;
  }

  await axiosInstance.post(`/api/v1/products/${productId}/track-cart`, {
    trackingKey,
    shopId: getShopId(product),
    action,
    quantity: Math.max(1, quantity),
  });
};

export const syncProductWishlist = async (
  product: TrackableProduct,
  user: any,
  action: WishlistTrackingAction
) => {
  const productId = getProductId(product);
  const trackingKey = getUserTrackingKey(user);

  if (!productId || !trackingKey) {
    return;
  }

  await axiosInstance.post(`/api/v1/products/${productId}/track-wishlist`, {
    trackingKey,
    shopId: getShopId(product),
    action,
  });
};
