export const PRODUCT_DETAILS_PATH = "/product/product-details";

const SELECTED_PRODUCT_STORAGE_KEY = "selected-product-details-reference";

export type ProductDetailsReference = {
  id?: string;
  _id?: string;
  productId?: string;
  slug?: string;
};

const getProductDetailsReference = (product: ProductDetailsReference) => ({
  productId: product.id || product._id || product.productId || "",
  slug: product.slug || "",
});

export const saveSelectedProductDetails = (
  product: ProductDetailsReference
) => {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(
      SELECTED_PRODUCT_STORAGE_KEY,
      JSON.stringify(getProductDetailsReference(product))
    );
  } catch {
    window.localStorage.removeItem(SELECTED_PRODUCT_STORAGE_KEY);
  }
};

export const loadSelectedProductDetails = () => {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const savedProduct = window.localStorage.getItem(
      SELECTED_PRODUCT_STORAGE_KEY
    );

    return savedProduct
      ? (JSON.parse(savedProduct) as ReturnType<typeof getProductDetailsReference>)
      : null;
  } catch {
    return null;
  }
};
