const getImageUrlFromValue = (value: unknown): string => {
  if (typeof value === "string") {
    return value.trim();
  }

  if (Array.isArray(value)) {
    for (const image of value) {
      const url = getImageUrlFromValue(image);

      if (url) {
        return url;
      }
    }
  }

  if (value && typeof value === "object") {
    const record = value as Record<string, unknown>;

    return getImageUrlFromValue(
      record.url ??
        record.secure_url ??
        record.secureUrl ??
        record.src ??
        record.image ??
        record.imageUrl ??
        record.logo ??
        record.logoUrl ??
        record.siteLogo ??
        record.banner ??
        record.bannerUrl ??
        record.siteBanner ??
        record.avatar ??
        record.avatarUrl ??
        record.profilePhoto ??
        record.profilePhotoUrl ??
        record.profileImage ??
        record.profileImageUrl ??
        record.coverPhoto ??
        record.coverPhotoUrl ??
        record.coverImage ??
        record.coverImageUrl ??
        record.coverBanner ??
        record.coverBannerUrl
    );
  }

  return "";
};

export const getImageUrl = (...values: unknown[]) => {
  for (const value of values) {
    const url = getImageUrlFromValue(value);

    if (url) {
      return url;
    }
  }

  return "";
};

export const getShopAvatarImage = (shop?: any) =>
  getImageUrl(
    shop?.avatarUrl,
    shop?.profilePhotoUrl,
    shop?.profilePhoto,
    shop?.profileImageUrl,
    shop?.profileImage,
    shop?.imageUrl,
    shop?.image,
    shop?.avatar,
    shop?.storefront?.avatarImage,
    shop?.sellers?.avatar,
    shop?.seller?.avatar
  );

export const getShopCoverImage = (shop?: any) =>
  getImageUrl(
    shop?.coverBannerUrl,
    shop?.coverPhotoUrl,
    shop?.coverPhoto,
    shop?.coverImageUrl,
    shop?.coverImage,
    shop?.bannerUrl,
    shop?.banner,
    shop?.siteBanner,
    shop?.coverBanner,
    shop?.storefront?.coverImage,
    shop?.storefront?.cover?.images,
    shop?.products?.find((product: any) => product?.images?.[0]?.url)?.images
  );
