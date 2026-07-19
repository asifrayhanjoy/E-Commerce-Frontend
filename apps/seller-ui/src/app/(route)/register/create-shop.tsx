"use client";

import React, { ChangeEvent, useState } from "react";
import { useForm } from "react-hook-form";

const shopCategories = [
  "Electronics",
  "Fashion",
  "Grocery",
  "Health & Beauty",
  "Home & Garden",
  "Sports & Outdoors",
  "Toys & Games",
  "Books & Media",
  "Automotive",
  "Jewelry & Accessories",
  "Pet Supplies",
  "Baby & Kids",
  "Furniture",
  "Office Supplies",
  "Arts & Crafts",
  "Music & Instruments",
  "Food & Beverages",
  "Mobile & Accessories",
  "Computers & Laptops",
  "Other",
];

type ShopFormData = {
  name: string;
  bio: string;
  address: string;
  opening_hours: string;
  website?: string;
  category: string;
};

type ImageUploadState = {
  fileData: string;
  fileName: string;
};

const MAX_SHOP_IMAGE_SIZE_BYTES = 5 * 1024 * 1024;

const createImageUpload = (): ImageUploadState => ({
  fileData: "",
  fileName: "",
});

const readShopImageFile = (file: File) =>
  new Promise<string>((resolve, reject) => {
    if (!file.type.startsWith("image/")) {
      reject(new Error("Please choose a valid image file."));
      return;
    }

    if (file.size > MAX_SHOP_IMAGE_SIZE_BYTES) {
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

const CreateShop = ({
  sellerId,
  setActiveStep,
}: {
  sellerId: string;
  setActiveStep: (step: number) => void;
}) => {
  const [serverError, setServerError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [profileImage, setProfileImage] = useState<ImageUploadState>(
    createImageUpload
  );
  const [coverImage, setCoverImage] = useState<ImageUploadState>(
    createImageUpload
  );
  const [galleryImages, setGalleryImages] = useState<ImageUploadState[]>([
    createImageUpload(),
    createImageUpload(),
    createImageUpload(),
  ]);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ShopFormData>();

  const handleSingleImageChange = async (
    event: ChangeEvent<HTMLInputElement>,
    setter: React.Dispatch<React.SetStateAction<ImageUploadState>>
  ) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    try {
      const image = await readShopImageFile(file);
      setter({
        fileData: image,
        fileName: file.name,
      });
      setServerError(null);
    } catch (err: unknown) {
      event.target.value = "";
      setServerError(err instanceof Error ? err.message : "Image could not be selected.");
    }
  };

  const handleGalleryImageChange = async (
    index: number,
    event: ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    try {
      const image = await readShopImageFile(file);
      setGalleryImages((currentImages) =>
        currentImages.map((currentImage, imageIndex) =>
          imageIndex === index
            ? {
                ...currentImage,
                fileData: image,
                fileName: file.name,
              }
            : currentImage
        )
      );
      setServerError(null);
    } catch (err: unknown) {
      event.target.value = "";
      setServerError(err instanceof Error ? err.message : "Gallery image could not be selected.");
    }
  };

  const onSubmit = async (data: ShopFormData) => {
    setServerError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/v1/auth/create-shop", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          name: data.name,
          bio: data.bio,
          address: data.address,
          opening_hours: data.opening_hours,
          website: data.website,
          category: data.category,
          sellerId,
          profileImage: profileImage.fileData || undefined,
          coverImage: coverImage.fileData || undefined,
          galleryImages: galleryImages
            .map((image) => image.fileData)
            .filter(Boolean),
        }),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.message || "Failed to create shop");
      setActiveStep(3);
    } catch (err: unknown) {
      setServerError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <form onSubmit={handleSubmit(onSubmit)}>
        <h3 className="text-2xl font-semibold text-center mb-4">
          Setup new shop
        </h3>

        {serverError && (
          <p className="text-red-500 text-sm text-center mb-3">{serverError}</p>
        )}

        <label className="block text-gray-700 mb-1">Shop Name</label>
        <input
          type="text"
          placeholder="Enter your shop name"
          className="w-full px-4 py-3 bg-blue-50 border border-blue-100 rounded-lg outline-none focus:border-blue-400 transition-colors text-gray-800 mb-1"
          {...register("name", {
            required: "Shop name is required",
            minLength: { value: 2, message: "Shop name must be at least 2 characters" },
          })}
        />
        {errors.name && (
          <p className="text-red-500 text-sm mb-2">{String(errors.name.message)}</p>
        )}

        <label className="block text-gray-700 mt-3 mb-1">Bio</label>
        <input
          type="text"
          placeholder="Tell customers about your shop"
          className="w-full px-4 py-3 bg-blue-50 border border-blue-100 rounded-lg outline-none focus:border-blue-400 transition-colors text-gray-800 mb-1"
          {...register("bio", {
            required: "Bio is required",
          })}
        />
        {errors.bio && (
          <p className="text-red-500 text-sm mb-2">{String(errors.bio.message)}</p>
        )}

        <label className="block text-gray-700 mt-3 mb-1">Address</label>
        <input
          type="text"
          placeholder="Enter your shop address"
          className="w-full px-4 py-3 bg-blue-50 border border-blue-100 rounded-lg outline-none focus:border-blue-400 transition-colors text-gray-800 mb-1"
          {...register("address", {
            required: "Address is required",
          })}
        />
        {errors.address && (
          <p className="text-red-500 text-sm mb-2">{String(errors.address.message)}</p>
        )}

        <label className="block text-gray-700 mt-3 mb-1">Opening Hours</label>
        <input
          type="text"
          placeholder="e.g. Mon-Sat 9am - 8pm"
          className="w-full px-4 py-3 bg-blue-50 border border-blue-100 rounded-lg outline-none focus:border-blue-400 transition-colors text-gray-800 mb-1"
          {...register("opening_hours", {
            required: "Opening hours are required",
          })}
        />
        {errors.opening_hours && (
          <p className="text-red-500 text-sm mb-2">{String(errors.opening_hours.message)}</p>
        )}

        <label className="block text-gray-700 mt-3 mb-1">Website (optional)</label>
        <input
          type="text"
          placeholder="https://yourshop.com"
          className="w-full px-4 py-3 bg-blue-50 border border-blue-100 rounded-lg outline-none focus:border-blue-400 transition-colors text-gray-800 mb-1"
          {...register("website")}
        />

        <label className="block text-gray-700 mt-3 mb-1">Category</label>
        <select
          defaultValue=""
          className="w-full px-4 py-3 bg-blue-50 border border-blue-100 rounded-lg outline-none focus:border-blue-400 transition-colors text-gray-800 mb-1"
          {...register("category", {
            required: "Category is required",
          })}
        >
          <option value="" disabled>
            Select a category
          </option>
          {shopCategories.map((category) => (
            <option key={category} value={category}>
              {category}
            </option>
          ))}
        </select>
        {errors.category && (
          <p className="text-red-500 text-sm mb-2">{String(errors.category.message)}</p>
        )}

        <div className="mt-4 grid gap-4">
          <div>
            <label className="block text-gray-700 mb-1">Shop Profile Photo</label>
            <div className="flex items-center gap-4 rounded-lg border border-blue-100 bg-blue-50 p-3">
              <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-full border border-blue-200 bg-white text-2xl font-semibold text-blue-500">
                {profileImage.fileData ? (
                  <img
                    src={profileImage.fileData}
                    alt="Shop profile preview"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  "S"
                )}
              </div>
              <div className="min-w-0 flex-1">
                <input
                  type="file"
                  accept="image/*"
                  className="w-full text-sm text-gray-700 file:mr-3 file:rounded-md file:border-0 file:bg-black file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white"
                  onChange={(event) =>
                    handleSingleImageChange(event, setProfileImage)
                  }
                />
                {profileImage.fileName && (
                  <p className="mt-2 truncate text-xs text-gray-500">
                    {profileImage.fileName}
                  </p>
                )}
              </div>
            </div>
          </div>

          <div>
            <label className="block text-gray-700 mb-1">Shop Cover Photo</label>
            <div className="rounded-lg border border-blue-100 bg-blue-50 p-3">
              <div className="mb-3 flex h-28 items-center justify-center overflow-hidden rounded-md border border-blue-200 bg-white text-sm font-semibold text-blue-500">
                {coverImage.fileData ? (
                  <img
                    src={coverImage.fileData}
                    alt="Shop cover preview"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  "Cover preview"
                )}
              </div>
              <input
                type="file"
                accept="image/*"
                className="w-full text-sm text-gray-700 file:mr-3 file:rounded-md file:border-0 file:bg-black file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white"
                onChange={(event) => handleSingleImageChange(event, setCoverImage)}
              />
              {coverImage.fileName && (
                <p className="mt-2 truncate text-xs text-gray-500">
                  {coverImage.fileName}
                </p>
              )}
            </div>
          </div>

          <div>
            <label className="block text-gray-700 mb-1">
              Shop Gallery Images (up to 3)
            </label>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              {galleryImages.map((image, index) => (
                <div
                  key={index}
                  className="rounded-lg border border-blue-100 bg-blue-50 p-3"
                >
                  <div className="mb-3 flex h-24 items-center justify-center overflow-hidden rounded-md border border-blue-200 bg-white text-sm font-semibold text-blue-500">
                    {image.fileData ? (
                      <img
                        src={image.fileData}
                        alt={`Shop gallery preview ${index + 1}`}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      `Image ${index + 1}`
                    )}
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    className="w-full text-xs text-gray-700 file:mb-2 file:rounded-md file:border-0 file:bg-black file:px-3 file:py-2 file:text-xs file:font-semibold file:text-white"
                    onChange={(event) => handleGalleryImageChange(index, event)}
                  />
                  {image.fileName && (
                    <p className="truncate text-xs text-gray-500">
                      {image.fileName}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-black text-white py-3 rounded-lg text-lg mt-5 cursor-pointer hover:bg-gray-900 transition-colors disabled:opacity-60"
        >
          {loading ? "Creating Shop..." : "Create Shop"}
        </button>
      </form>
    </div>
  );
};

export default CreateShop;
