"use client";

import { ChangeEvent, FormEvent, ReactNode, useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Calendar,
  Clock,
  Globe2,
  ImagePlus,
  MapPin,
  Pencil,
  Plus,
  Star,
  Users,
  X,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import axiosInstance from "@/utils/axiosInstance";
import {
  storefrontData,
  type StorefrontData,
  type StorefrontProduct,
} from "./storefront-data";

type ActiveDialog =
  | "cover"
  | "avatar"
  | "profile"
  | "product"
  | "productDetails"
  | null;
type ActiveTab = "Products" | "Offers" | "Reviews";

type ImageSlot = {
  url: string;
  fileData: string;
  fileName: string;
};

type CoverDraft = {
  images: ImageSlot[];
  description: string;
  tags: string;
  buttonLabel: string;
  buttonUrl: string;
  buyNowPrice: string;
};

type ProfileDraft = {
  name: string;
  description: string;
  openingHours: string;
  address: string;
  website: string;
  youtube: string;
  x: string;
};

type ProductDraft = {
  id: string;
  image: ImageSlot;
  title: string;
  description: string;
  price: string;
  buttonLabel: string;
  buttonUrl: string;
};

const formatPrice = (value: number) => `$${value}`;
const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024;

const readImageFile = (file: File) =>
  new Promise<string>((resolve, reject) => {
    if (!file.type.startsWith("image/")) {
      reject(new Error("Please choose a valid image file."));
      return;
    }

    if (file.size > MAX_IMAGE_SIZE_BYTES) {
      reject(new Error("Image must be 5MB or smaller."));
      return;
    }

    const reader = new FileReader();

    reader.onload = () => {
      if (typeof reader.result === "string") {
        resolve(reader.result);
        return;
      }

      reject(new Error("Image file could not be read."));
    };
    reader.onerror = () => reject(new Error("Image file could not be read."));
    reader.readAsDataURL(file);
  });

const getSocialUrl = (data: StorefrontData, label: string) =>
  data.shop.socialLinks?.find(
    (link) => link.label.toLowerCase() === label.toLowerCase()
  )?.url || "";

const getProductImage = (product: StorefrontProduct, index: number) =>
  product.image || storefrontData.products[index % storefrontData.products.length].image;

const createImageSlot = (url = ""): ImageSlot => ({
  url,
  fileData: "",
  fileName: "",
});

const getImagePreview = (slot: ImageSlot) => slot.fileData || slot.url;

const getCoverImageSlots = (images: string[]) =>
  [...images, ...storefrontData.cover.images].slice(0, 4);

const createCoverDraft = (source: StorefrontData): CoverDraft => ({
  images: getCoverImageSlots(source.cover.images).map(createImageSlot),
  description: source.cover.description || "",
  tags: source.cover.tags.join(", "),
  buttonLabel:
    source.cover.buttonLabel || `Buy now ${formatPrice(source.cover.buyNowPrice)}`,
  buttonUrl: source.cover.buttonUrl || "",
  buyNowPrice: String(source.cover.buyNowPrice || 0),
});

const createProductDraft = (product?: StorefrontProduct): ProductDraft => ({
  id: product?.id || "",
  image: createImageSlot(product?.image || ""),
  title: product?.title || "",
  description: product?.description || "",
  price: String(product?.price ?? 0),
  buttonLabel: product?.buttonLabel || "View Product",
  buttonUrl: product?.buttonUrl || "",
});

function StorefrontPage() {
  const [data, setData] = useState<StorefrontData>(storefrontData);
  const [activeDialog, setActiveDialog] = useState<ActiveDialog>(null);
  const [activeTab, setActiveTab] = useState<ActiveTab>("Products");
  const [activeCoverImageIndex, setActiveCoverImageIndex] = useState(0);
  const [coverDraft, setCoverDraft] = useState<CoverDraft>(
    createCoverDraft(storefrontData)
  );
  const [avatarImage, setAvatarImage] = useState<ImageSlot>(
    createImageSlot(storefrontData.shop.avatar)
  );
  const [productDraft, setProductDraft] =
    useState<ProductDraft>(createProductDraft);
  const [productZoom, setProductZoom] = useState(1);
  const [profileDraft, setProfileDraft] = useState<ProfileDraft>({
    name: storefrontData.shop.name,
    description: storefrontData.shop.tagline,
    openingHours: storefrontData.shop.hours,
    address: storefrontData.shop.address,
    website: storefrontData.shop.website,
    youtube: getSocialUrl(storefrontData, "YT"),
    x: getSocialUrl(storefrontData, "X"),
  });
  const [isSaving, setIsSaving] = useState(false);
  const [formError, setFormError] = useState("");

  useEffect(() => {
    axiosInstance
      .get("/api/v1/auth/seller-storefront")
      .then((response) => {
        if (response.data?.storefront) {
          setData(response.data.storefront);
          setActiveCoverImageIndex(0);
        }
      })
      .catch(() => {
        setData(storefrontData);
        setActiveCoverImageIndex(0);
      });
  }, []);

  const openCoverDialog = () => {
    setCoverDraft(createCoverDraft(data));
    setFormError("");
    setActiveDialog("cover");
  };

  const openAvatarDialog = () => {
    setAvatarImage(createImageSlot(data.shop.avatar || ""));
    setFormError("");
    setActiveDialog("avatar");
  };

  const openProductDialog = () => {
    setProductDraft(createProductDraft());
    setFormError("");
    setActiveDialog("product");
  };

  const openProductDetailsDialog = (product: StorefrontProduct) => {
    setProductDraft(createProductDraft(product));
    setProductZoom(1);
    setActiveDialog("productDetails");
  };

  const openProfileDialog = () => {
    setProfileDraft({
      name: data.shop.name || "",
      description: data.shop.tagline || "",
      openingHours: data.shop.hours || "",
      address: data.shop.address || "",
      website: data.shop.website || "",
      youtube: getSocialUrl(data, "YT"),
      x: getSocialUrl(data, "X"),
    });
    setFormError("");
    setActiveDialog("profile");
  };

  const saveStorefront = async (payload: Record<string, unknown>) => {
    setIsSaving(true);
    setFormError("");

    try {
      const response = await axiosInstance.put(
        "/api/v1/auth/seller-storefront",
        payload
      );

      if (response.data?.storefront) {
        setData(response.data.storefront);
        setActiveCoverImageIndex(0);
      }

      setActiveDialog(null);
    } catch (error: any) {
      setFormError(
        error?.response?.data?.message || "Storefront could not be saved."
      );
    } finally {
      setIsSaving(false);
    }
  };

  const saveCover = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const [mainImage, ...galleryImages] = coverDraft.images;

    saveStorefront({
      coverImage: getImagePreview(mainImage),
      galleryImages: galleryImages.map(getImagePreview),
      coverDescription: coverDraft.description,
      tags: coverDraft.tags
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean),
      buttonLabel: coverDraft.buttonLabel,
      buttonUrl: coverDraft.buttonUrl,
      buyNowPrice: Number(coverDraft.buyNowPrice || 0),
    });
  };

  const saveAvatar = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    saveStorefront({ avatarImage: getImagePreview(avatarImage) });
  };

  const saveProduct = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSaving(true);
    setFormError("");

    try {
      const response = await axiosInstance.post(
        "/api/v1/auth/seller-storefront/products",
        {
          imageFile: getImagePreview(productDraft.image),
          title: productDraft.title,
          description: productDraft.description,
          price: Number(productDraft.price || 0),
          buttonLabel: productDraft.buttonLabel,
          buttonUrl: productDraft.buttonUrl,
        }
      );

      if (response.data?.storefront) {
        setData(response.data.storefront);
      }

      setActiveDialog(null);
    } catch (error: any) {
      setFormError(
        error?.response?.data?.message || "Product could not be added."
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleCoverFileChange = async (
    index: number,
    event: ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    try {
      const image = await readImageFile(file);
      setCoverDraft((current) => ({
        ...current,
        images: current.images.map((slot, slotIndex) =>
          slotIndex === index
            ? { ...slot, fileData: image, fileName: file.name }
            : slot
        ),
      }));
      setFormError("");
    } catch (error: any) {
      event.target.value = "";
      setFormError(error?.message || "Cover photo could not be selected.");
    }
  };

  const handleAvatarFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    try {
      const image = await readImageFile(file);
      setAvatarImage((current) => ({
        ...current,
        fileData: image,
        fileName: file.name,
      }));
      setFormError("");
    } catch (error: any) {
      event.target.value = "";
      setFormError(error?.message || "Profile photo could not be selected.");
    }
  };

  const handleProductFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    try {
      const image = await readImageFile(file);
      setProductDraft((current) => ({
        ...current,
        image: {
          ...current.image,
          fileData: image,
          fileName: file.name,
        },
      }));
      setFormError("");
    } catch (error: any) {
      event.target.value = "";
      setFormError(error?.message || "Product image could not be selected.");
    }
  };

  const saveProfile = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    saveStorefront({
      name: profileDraft.name,
      description: profileDraft.description,
      openingHours: profileDraft.openingHours,
      address: profileDraft.address,
      website: profileDraft.website,
      socialLinks: [
        profileDraft.youtube
          ? {
              label: "YT",
              url: profileDraft.youtube,
            }
          : null,
        profileDraft.x
          ? {
              label: "X",
              url: profileDraft.x,
            }
          : null,
      ].filter(Boolean),
    });
  };

  const coverImages = getCoverImageSlots(data.cover.images);
  const selectedCoverImageIndex = Math.min(
    activeCoverImageIndex,
    coverImages.length - 1
  );
  const mainImage =
    coverImages[selectedCoverImageIndex] || storefrontData.cover.images[0];
  const galleryImages = coverImages
    .map((image, index) => ({ image, index }))
    .filter(({ index }) => index !== selectedCoverImageIndex)
    .slice(0, 3);
  const products = data.products.length > 0 ? data.products : storefrontData.products;
  const coverButtonLabel =
    data.cover.buttonLabel || `Buy now ${formatPrice(data.cover.buyNowPrice)}`;

  return (
    <main className="min-h-screen bg-[#0e1524] text-white">
      <header className="sticky top-0 z-30 flex h-14 items-center border-b border-[#182132] bg-[#101827] px-5 shadow-[0_8px_30px_rgba(0,0,0,0.28)]">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-3 text-sm font-semibold text-gray-200 transition hover:text-white"
        >
          <ArrowLeft size={20} />
          Back to Dashboard
        </Link>
      </header>

      <section className="relative bg-[#07040d]">
        <button
          type="button"
          onClick={openCoverDialog}
          className="absolute right-4 top-5 z-20 inline-flex h-12 items-center gap-2 rounded-md bg-[#2d3748] px-5 text-sm font-semibold text-gray-100 shadow-[0_10px_28px_rgba(0,0,0,0.35)] transition hover:bg-[#39465a]"
        >
          <Pencil size={19} />
          Edit Cover
        </button>

        <div className="mx-auto grid max-w-[1500px] gap-6 px-6 pb-36 pt-0 lg:grid-cols-[minmax(0,1.05fr)_minmax(430px,0.95fr)] xl:px-0">
          <div className="space-y-8">
            <img
              src={mainImage}
              alt="Store cover"
              className="h-[270px] w-full object-cover object-top"
            />

            <div className="grid grid-cols-3 gap-4">
              {galleryImages.map(({ image, index }) => (
                <button
                  key={`${image}-${index}`}
                  type="button"
                  onClick={() => setActiveCoverImageIndex(index)}
                  className="group h-[124px] overflow-hidden border border-transparent outline-none transition hover:border-blue-500 focus-visible:border-blue-500"
                >
                  <img
                    src={image}
                    alt={`Store gallery ${index + 1}`}
                    className="h-full w-full object-cover object-top transition duration-200 group-hover:scale-105"
                  />
                </button>
              ))}
            </div>
          </div>

          <div className="px-1 pt-11">
            <p className="max-w-[780px] text-sm font-semibold leading-7 text-gray-400">
              {data.cover.description}
            </p>

            <h2 className="mt-7 text-xl font-semibold text-white">Tags</h2>
            <div className="mt-4 flex flex-wrap gap-3">
              {data.cover.tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-full bg-[#222033] px-4 py-2 text-sm font-semibold text-gray-100"
                >
                  {tag}
                </span>
              ))}
            </div>

            {data.cover.buttonUrl ? (
              <a
                href={data.cover.buttonUrl}
                className="mt-9 inline-flex h-12 items-center rounded-md bg-[#72f24e] px-6 text-sm font-bold text-[#17320f] shadow-[0_12px_34px_rgba(114,242,78,0.18)] transition hover:bg-[#83ff63]"
              >
                {coverButtonLabel}
              </a>
            ) : (
              <button
                type="button"
                className="mt-9 h-12 rounded-md bg-[#72f24e] px-6 text-sm font-bold text-[#17320f] shadow-[0_12px_34px_rgba(114,242,78,0.18)] transition hover:bg-[#83ff63]"
              >
                {coverButtonLabel}
              </button>
            )}
          </div>
        </div>
      </section>

      <section className="relative -mt-24">
        <div className="mx-auto grid max-w-[1110px] gap-7 px-6 lg:grid-cols-[minmax(0,2fr)_410px] xl:px-0">
          <div className="relative rounded-md bg-[#202938] p-8 shadow-[0_18px_60px_rgba(0,0,0,0.35)]">
            <button
              type="button"
              onClick={openProfileDialog}
              className="absolute right-8 top-8 inline-flex h-11 items-center gap-2 rounded-md bg-[#354052] px-5 text-sm font-semibold text-gray-100 transition hover:bg-[#414d61]"
            >
              <Pencil size={18} />
              Edit Profile
            </button>

            <div className="flex flex-col gap-8 pr-0 sm:flex-row md:pr-48">
              <div className="relative h-[112px] w-[112px] shrink-0 rounded-full bg-[#a855f7] p-2">
                <img
                  src={data.shop.avatar}
                  alt={`${data.shop.name} avatar`}
                  className="h-full w-full rounded-full object-cover"
                />
                <button
                  type="button"
                  onClick={openAvatarDialog}
                  title="Edit profile photo"
                  className="absolute bottom-1 right-0 flex h-9 w-9 items-center justify-center rounded-full bg-[#30394b] text-white ring-4 ring-[#202938] transition hover:bg-[#3d485c]"
                >
                  <Pencil size={16} />
                </button>
              </div>

              <div className="min-w-0 pt-1">
                <h1 className="text-2xl font-semibold text-white">{data.shop.name}</h1>
                <p className="mt-2 text-sm font-semibold text-gray-400">
                  {data.shop.tagline}
                </p>

                <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-3 text-sm font-semibold text-gray-400">
                  <span className="inline-flex items-center gap-2 text-yellow-300">
                    <Star size={18} fill="#facc15" />
                    {data.shop.rating}
                  </span>
                  <span className="inline-flex items-center gap-2">
                    <Users size={18} />
                    {data.shop.followers} Followers
                  </span>
                  <span className="inline-flex items-center gap-2">
                    <Clock size={18} />
                    {data.shop.hours}
                  </span>
                  <span className="inline-flex items-center gap-2">
                    <MapPin size={18} />
                    {data.shop.address}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <aside className="rounded-md bg-[#202938] p-8 shadow-[0_18px_60px_rgba(0,0,0,0.35)]">
            <h2 className="text-xl font-semibold text-white">Shop Details</h2>

            <div className="mt-6 space-y-5 text-sm font-semibold text-gray-400">
              <p className="flex items-center gap-4">
                <Calendar size={20} />
                Joined At: {data.shop.joinedAt}
              </p>
              {data.shop.website && (
                <a
                  href={data.shop.website}
                  className="flex items-center gap-4 text-blue-400 transition hover:text-blue-300"
                >
                  <Globe2 size={20} />
                  {data.shop.website}
                </a>
              )}
            </div>

            <h3 className="mt-6 text-lg font-semibold text-white">Follow Us:</h3>
            <div className="mt-4 flex gap-4">
              {(data.shop.socialLinks?.length
                ? data.shop.socialLinks
                : storefrontData.shop.socialLinks || []
              ).map((link) => (
                <a
                  key={`${link.label}-${link.url}`}
                  href={link.url}
                  className="flex h-8 min-w-8 items-center justify-center rounded-md bg-white px-2 text-xs font-bold text-[#202938] transition hover:bg-blue-100"
                >
                  {link.label}
                </a>
              ))}
            </div>
          </aside>
        </div>
      </section>

      <section className="mx-auto mt-14 max-w-[1110px] px-6 pb-16 xl:px-0">
        <div className="flex items-end justify-between gap-4 border-b border-[#303848]">
          <div className="flex gap-14">
            {(["Products", "Offers", "Reviews"] as const).map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveTab(tab)}
                className={`relative pb-5 text-base font-semibold transition ${
                  activeTab === tab ? "text-white" : "text-gray-500 hover:text-gray-300"
                }`}
              >
                {tab}
                {activeTab === tab && (
                  <span className="absolute bottom-[-1px] left-0 h-[3px] w-full rounded-full bg-blue-600" />
                )}
              </button>
            ))}
          </div>
          {activeTab === "Products" && (
            <button
              type="button"
              onClick={openProductDialog}
              className="mb-4 inline-flex h-10 items-center gap-2 rounded-md bg-blue-600 px-4 text-sm font-semibold text-white transition hover:bg-blue-500"
            >
              <Plus size={17} />
              Add
            </button>
          )}
        </div>

        {activeTab === "Products" && (
          <div className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {products.map((product, index) => (
              <article key={product.id} className="rounded-md bg-[#202938] p-4">
                <div className="flex aspect-[1.08/1] items-center justify-center overflow-hidden rounded-md bg-white">
                  <img
                    src={getProductImage(product, index)}
                    alt={product.title}
                    className="h-full w-full object-cover"
                  />
                </div>
                <h3 className="mt-4 truncate text-sm font-semibold text-white">
                  {product.title}
                </h3>
                <p className="mt-2 min-h-10 overflow-hidden text-sm leading-5 text-gray-400">
                  {product.description}
                </p>
                <button
                  type="button"
                  onClick={() => openProductDetailsDialog(product)}
                  className="mt-4 h-9 rounded-md bg-[#72f24e] px-4 text-xs font-bold text-[#17320f] transition hover:bg-[#83ff63]"
                >
                  {product.buttonLabel}
                </button>
              </article>
            ))}
          </div>
        )}

        {activeTab === "Offers" && (
          <EmptyTabPanel
            actionHref="/dashboard/discount-codes"
            actionText="Add Offer"
            title="No offers published yet."
          />
        )}

        {activeTab === "Reviews" && (
          <EmptyTabPanel
            actionHref="/dashboard/settings"
            actionText="Manage Reviews"
            title="No reviews published yet."
          />
        )}
      </section>

      {activeDialog === "cover" && (
        <StorefrontDialog title="Edit Cover" onClose={() => setActiveDialog(null)}>
          <form onSubmit={saveCover} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              {coverDraft.images.map((slot, index) => (
                <ImageFileField
                  key={index === 0 ? "main-cover" : `gallery-${index}`}
                  label={index === 0 ? "Main cover photo" : `Gallery image ${index}`}
                  fileName={slot.fileName}
                  previewUrl={getImagePreview(slot)}
                  onChange={(event) => handleCoverFileChange(index, event)}
                />
              ))}
            </div>
            <TextareaField
              label="Cover description"
              value={coverDraft.description}
              onChange={(value) =>
                setCoverDraft((current) => ({ ...current, description: value }))
              }
            />
            <InputField
              label="Tags"
              value={coverDraft.tags}
              onChange={(value) =>
                setCoverDraft((current) => ({ ...current, tags: value }))
              }
            />
            <InputField
              label="Button text"
              value={coverDraft.buttonLabel}
              onChange={(value) =>
                setCoverDraft((current) => ({ ...current, buttonLabel: value }))
              }
            />
            <InputField
              label="Button link"
              value={coverDraft.buttonUrl}
              onChange={(value) =>
                setCoverDraft((current) => ({ ...current, buttonUrl: value }))
              }
            />
            <InputField
              label="Button price"
              value={coverDraft.buyNowPrice}
              onChange={(value) =>
                setCoverDraft((current) => ({ ...current, buyNowPrice: value }))
              }
            />
            <DialogActions isSaving={isSaving} error={formError} />
          </form>
        </StorefrontDialog>
      )}

      {activeDialog === "avatar" && (
        <StorefrontDialog
          title="Edit Profile Photo"
          onClose={() => setActiveDialog(null)}
        >
          <form onSubmit={saveAvatar} className="space-y-4">
            <ImageFileField
              label="Upload profile photo"
              fileName={avatarImage.fileName}
              previewUrl={getImagePreview(avatarImage)}
              onChange={handleAvatarFileChange}
            />
            <DialogActions isSaving={isSaving} error={formError} />
          </form>
        </StorefrontDialog>
      )}

      {activeDialog === "profile" && (
        <StorefrontDialog title="Edit Profile" onClose={() => setActiveDialog(null)}>
          <form onSubmit={saveProfile} className="space-y-4">
            <InputField
              label="Profile name"
              value={profileDraft.name}
              onChange={(value) =>
                setProfileDraft((current) => ({ ...current, name: value }))
              }
            />
            <TextareaField
              label="Description"
              value={profileDraft.description}
              onChange={(value) =>
                setProfileDraft((current) => ({ ...current, description: value }))
              }
            />
            <InputField
              label="Opening hours"
              value={profileDraft.openingHours}
              onChange={(value) =>
                setProfileDraft((current) => ({ ...current, openingHours: value }))
              }
            />
            <InputField
              label="Address"
              value={profileDraft.address}
              onChange={(value) =>
                setProfileDraft((current) => ({ ...current, address: value }))
              }
            />
            <InputField
              label="Website"
              value={profileDraft.website}
              onChange={(value) =>
                setProfileDraft((current) => ({ ...current, website: value }))
              }
            />
            <InputField
              label="YouTube link"
              value={profileDraft.youtube}
              onChange={(value) =>
                setProfileDraft((current) => ({ ...current, youtube: value }))
              }
            />
            <InputField
              label="X link"
              value={profileDraft.x}
              onChange={(value) =>
                setProfileDraft((current) => ({ ...current, x: value }))
              }
            />
            <DialogActions isSaving={isSaving} error={formError} />
          </form>
        </StorefrontDialog>
      )}

      {activeDialog === "product" && (
        <StorefrontDialog title="Add Product" onClose={() => setActiveDialog(null)}>
          <form onSubmit={saveProduct} className="space-y-4">
            <ImageFileField
              label="Product image"
              fileName={productDraft.image.fileName}
              previewUrl={getImagePreview(productDraft.image)}
              onChange={handleProductFileChange}
            />
            <InputField
              label="Title"
              value={productDraft.title}
              onChange={(value) =>
                setProductDraft((current) => ({ ...current, title: value }))
              }
            />
            <TextareaField
              label="Description"
              value={productDraft.description}
              onChange={(value) =>
                setProductDraft((current) => ({ ...current, description: value }))
              }
            />
            <InputField
              label="Price"
              value={productDraft.price}
              onChange={(value) =>
                setProductDraft((current) => ({ ...current, price: value }))
              }
            />
            <InputField
              label="Button text"
              value={productDraft.buttonLabel}
              onChange={(value) =>
                setProductDraft((current) => ({ ...current, buttonLabel: value }))
              }
            />
            <InputField
              label="Button link"
              value={productDraft.buttonUrl}
              onChange={(value) =>
                setProductDraft((current) => ({ ...current, buttonUrl: value }))
              }
            />
            <DialogActions isSaving={isSaving} error={formError} />
          </form>
        </StorefrontDialog>
      )}

      {activeDialog === "productDetails" && (
        <StorefrontDialog
          title="View Product"
          onClose={() => setActiveDialog(null)}
          wide
        >
          <div className="space-y-5">
            <div className="relative overflow-hidden rounded-md bg-gray-950">
              <img
                src={getImagePreview(productDraft.image)}
                alt={productDraft.title}
                className="h-[360px] w-full object-contain transition-transform duration-200"
                style={{ transform: `scale(${productZoom})` }}
              />
              <div className="absolute right-3 top-3 flex gap-2">
                <button
                  type="button"
                  title="Zoom out"
                  onClick={() =>
                    setProductZoom((current) => Math.max(1, current - 0.25))
                  }
                  className="flex h-9 w-9 items-center justify-center rounded-md bg-black/70 text-white transition hover:bg-black"
                >
                  <ZoomOut size={18} />
                </button>
                <button
                  type="button"
                  title="Zoom in"
                  onClick={() =>
                    setProductZoom((current) => Math.min(3, current + 0.25))
                  }
                  className="flex h-9 w-9 items-center justify-center rounded-md bg-black/70 text-white transition hover:bg-black"
                >
                  <ZoomIn size={18} />
                </button>
              </div>
            </div>

            <div>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <h3 className="text-2xl font-semibold text-white">
                  {productDraft.title}
                </h3>
                <span className="rounded-md bg-[#72f24e] px-3 py-1.5 text-sm font-bold text-[#17320f]">
                  {formatPrice(Number(productDraft.price || 0))}
                </span>
              </div>
              <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-gray-300">
                {productDraft.description}
              </p>
            </div>

            {productDraft.buttonUrl && (
              <a
                href={productDraft.buttonUrl}
                className="inline-flex h-10 items-center rounded-md bg-blue-600 px-4 text-sm font-semibold text-white transition hover:bg-blue-500"
              >
                {productDraft.buttonLabel || "Open"}
              </a>
            )}
          </div>
        </StorefrontDialog>
      )}
    </main>
  );
}

function StorefrontDialog({
  title,
  children,
  onClose,
  wide = false,
}: {
  title: string;
  children: ReactNode;
  onClose: () => void;
  wide?: boolean;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div
        className={`max-h-[90vh] w-full overflow-y-auto rounded-md border border-gray-700 bg-[#202938] p-5 text-white shadow-2xl ${
          wide ? "max-w-3xl" : "max-w-lg"
        }`}
      >
        <div className="mb-5 flex items-center justify-between gap-4">
          <h2 className="text-lg font-semibold">{title}</h2>
          <button
            type="button"
            title="Close"
            onClick={onClose}
            className="text-gray-400 transition hover:text-white"
          >
            <X size={22} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

function InputField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="block">
      <span className="text-xs font-semibold text-gray-300">{label}</span>
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="mt-2 h-11 w-full rounded-md border border-gray-700 bg-gray-950 px-3 text-sm text-white outline-none transition placeholder:text-gray-500 focus:border-blue-500"
      />
    </label>
  );
}

function ImageFileField({
  label,
  fileName,
  previewUrl,
  onChange,
}: {
  label: string;
  fileName: string;
  previewUrl?: string;
  onChange: (event: ChangeEvent<HTMLInputElement>) => void;
}) {
  return (
    <label className="block cursor-pointer">
      <span className="text-xs font-semibold text-gray-300">{label}</span>
      {previewUrl && (
        <span className="mt-2 block overflow-hidden rounded-md border border-gray-700 bg-gray-950">
          <img src={previewUrl} alt="" className="h-28 w-full object-cover" />
        </span>
      )}
      <span className="mt-2 flex min-h-11 items-center gap-3 rounded-md border border-dashed border-gray-600 bg-gray-950 px-3 text-sm text-gray-300 transition hover:border-blue-500">
        <input type="file" accept="image/*" onChange={onChange} className="sr-only" />
        <span className="inline-flex items-center gap-2 rounded-md bg-[#354052] px-3 py-2 text-xs font-semibold text-white">
          <ImagePlus size={15} />
          Choose Image
        </span>
        <span className="min-w-0 truncate">{fileName || "No image selected"}</span>
      </span>
    </label>
  );
}

function TextareaField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="block">
      <span className="text-xs font-semibold text-gray-300">{label}</span>
      <textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="mt-2 min-h-24 w-full resize-y rounded-md border border-gray-700 bg-gray-950 p-3 text-sm text-white outline-none transition placeholder:text-gray-500 focus:border-blue-500"
      />
    </label>
  );
}

function DialogActions({
  isSaving,
  error,
}: {
  isSaving: boolean;
  error: string;
}) {
  return (
    <div className="mt-5">
      {error && <p className="mb-3 text-sm font-semibold text-red-300">{error}</p>}
      <button
        type="submit"
        disabled={isSaving}
        className="h-10 rounded-md bg-blue-600 px-4 text-sm font-semibold text-white transition hover:bg-blue-500 disabled:bg-gray-700"
      >
        {isSaving ? "Saving..." : "Save"}
      </button>
    </div>
  );
}

function EmptyTabPanel({
  title,
  actionHref,
  actionText,
}: {
  title: string;
  actionHref: string;
  actionText: string;
}) {
  return (
    <div className="mt-8 rounded-md bg-[#202938] p-8">
      <h3 className="text-base font-semibold text-white">{title}</h3>
      <Link
        href={actionHref}
        className="mt-4 inline-flex h-10 items-center rounded-md bg-blue-600 px-4 text-sm font-semibold text-white transition hover:bg-blue-500"
      >
        {actionText}
      </Link>
    </div>
  );
}

export default StorefrontPage;
