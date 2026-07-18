import { getImageUrl } from "./shopImages";

export type SiteCustomization = {
  logoUrl: string;
  bannerUrl: string;
};

export const emptySiteCustomization: SiteCustomization = {
  logoUrl: "",
  bannerUrl: "",
};

export const fetchSiteCustomization = async () => {
  const response = await fetch(`/api/site/customization?ts=${Date.now()}`, {
    cache: "no-store",
  });
  const data = await response.json().catch(() => ({}));
  const customization =
    data?.customization ?? data?.data ?? data ?? {};

  return {
    logoUrl: getImageUrl(
      customization.logoUrl,
      customization.logo,
      customization.siteLogo,
      customization.profilePhoto,
      customization.profilePhotoUrl,
      customization.profileImage,
      customization.profileImageUrl,
      customization.avatar,
      customization.avatarUrl,
      customization.image,
      customization.imageUrl
    ),
    bannerUrl: getImageUrl(
      customization.bannerUrl,
      customization.banner,
      customization.siteBanner,
      customization.coverPhoto,
      customization.coverPhotoUrl,
      customization.coverImage,
      customization.coverImageUrl,
      customization.coverBanner,
      customization.coverBannerUrl
    ),
  };
};
