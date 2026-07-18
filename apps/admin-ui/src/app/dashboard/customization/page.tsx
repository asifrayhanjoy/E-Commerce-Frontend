"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import axios, { AxiosError } from "axios";
import Link from "next/link";
import { useRef, useState } from "react";
import type { ChangeEvent, FormEvent } from "react";

type Customization = {
  categories: string[];
  subCategories: Record<string, string[]>;
  logoUrl: string;
  bannerUrl: string;
};

type CustomizationResponse = {
  customization: Customization;
};

type UpdatePayload = {
  category?: string;
  deleteCategory?: string;
  addSubCategory?: {
    category: string;
    subCategory: string;
  };
  deleteSubCategory?: {
    category: string;
    subCategory: string;
  };
  logoUrl?: string;
  bannerUrl?: string;
};

type UploadPreview = {
  dataUrl: string;
  name: string;
};

const emptyCustomization: Customization = {
  categories: [],
  subCategories: {},
  logoUrl: "",
  bannerUrl: "",
};

const fetchCustomization = async () => {
  const response = await axios.get<CustomizationResponse>(
    "/api/admin/customization",
    {
      withCredentials: true,
    }
  );

  return response.data.customization;
};

const updateCustomization = async (payload: UpdatePayload) => {
  const response = await axios.patch<CustomizationResponse>(
    "/api/admin/customization",
    payload,
    {
      withCredentials: true,
    }
  );

  return response.data.customization;
};

const getErrorMessage = (error: AxiosError<{ message?: string }>) =>
  error.response?.data?.message ||
  error.message ||
  "Unable to update customization.";

const UploadIcon = () => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M12 16V4m0 0 4 4m-4-4-4 4M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const TrashIcon = () => (
  <svg
    width="17"
    height="17"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M4 7h16M10 11v6M14 11v6M6 7l1 14h10l1-14M9 7V4h6v3"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const readFileAsDataUrl = (file: File) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(new Error("Unable to read selected image."));
    reader.readAsDataURL(file);
  });

const resizeImageFile = (file: File, type: "logo" | "banner") =>
  new Promise<string>((resolve, reject) => {
    if (file.type === "image/svg+xml") {
      readFileAsDataUrl(file).then(resolve).catch(reject);
      return;
    }

    const image = new Image();
    const objectUrl = URL.createObjectURL(file);

    image.onload = () => {
      const maxWidth = type === "logo" ? 800 : 1600;
      const maxHeight = type === "logo" ? 800 : 700;
      const ratio = Math.min(
        maxWidth / image.naturalWidth,
        maxHeight / image.naturalHeight,
        1
      );
      const width = Math.max(1, Math.round(image.naturalWidth * ratio));
      const height = Math.max(1, Math.round(image.naturalHeight * ratio));
      const canvas = document.createElement("canvas");
      const context = canvas.getContext("2d");

      URL.revokeObjectURL(objectUrl);

      if (!context) {
        readFileAsDataUrl(file).then(resolve).catch(reject);
        return;
      }

      canvas.width = width;
      canvas.height = height;
      context.drawImage(image, 0, 0, width, height);
      resolve(canvas.toDataURL("image/webp", 0.82));
    };

    image.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("Unable to read selected image."));
    };

    image.src = objectUrl;
  });

const ImagePlaceholder = ({ label }: { label: string }) => (
  <div className="flex h-full min-h-[156px] items-center justify-center rounded-md border border-dashed border-[#26314e] bg-[#080d19] text-[13px] font-semibold text-[#7f8799]">
    {label}
  </div>
);

const CustomizationPage = () => {
  const queryClient = useQueryClient();
  const logoInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);
  const [newCategory, setNewCategory] = useState("");
  const [subCategoryCategory, setSubCategoryCategory] = useState("");
  const [newSubCategory, setNewSubCategory] = useState("");
  const [logoPreview, setLogoPreview] = useState<UploadPreview | null>(null);
  const [bannerPreview, setBannerPreview] = useState<UploadPreview | null>(null);
  const [serverError, setServerError] = useState<string | null>(null);
  const { data, isLoading } = useQuery({
    queryKey: ["admin-customization"],
    queryFn: fetchCustomization,
  });
  const customization = data || emptyCustomization;
  const selectedSubCategoryCategory =
    subCategoryCategory &&
    customization.categories.includes(subCategoryCategory)
      ? subCategoryCategory
      : customization.categories[0] || "";
  const updateMutation = useMutation({
    mutationFn: updateCustomization,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-customization"] });
      setNewCategory("");
      setNewSubCategory("");
      setLogoPreview(null);
      setBannerPreview(null);
      setServerError(null);
    },
    onError: (error: AxiosError<{ message?: string }>) => {
      setServerError(getErrorMessage(error));
    },
  });

  const handleAddCategory = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const category = newCategory.trim();

    if (!category) {
      return;
    }

    setServerError(null);
    updateMutation.mutate({ category });
  };

  const handleDeleteCategory = (category: string) => {
    setServerError(null);
    updateMutation.mutate({ deleteCategory: category });
  };

  const handleAddSubCategory = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const category = selectedSubCategoryCategory;
    const subCategory = newSubCategory.trim();

    if (!category || !subCategory) {
      return;
    }

    setServerError(null);
    updateMutation.mutate({
      addSubCategory: {
        category,
        subCategory,
      },
    });
  };

  const handleDeleteSubCategory = (category: string, subCategory: string) => {
    setServerError(null);
    updateMutation.mutate({
      deleteSubCategory: {
        category,
        subCategory,
      },
    });
  };

  const handleFileSelect = async (
    event: ChangeEvent<HTMLInputElement>,
    type: "logo" | "banner"
  ) => {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file) {
      return;
    }

    try {
      const dataUrl = await resizeImageFile(file, type);
      const preview = {
        dataUrl,
        name: file.name,
      };

      if (type === "logo") {
        setLogoPreview(preview);
      } else {
        setBannerPreview(preview);
      }

      setServerError(null);
    } catch (error) {
      setServerError(
        error instanceof Error ? error.message : "Unable to read selected image."
      );
    }
  };

  const saveLogo = () => {
    if (!logoPreview) {
      return;
    }

    setServerError(null);
    updateMutation.mutate({ logoUrl: logoPreview.dataUrl });
  };

  const saveBanner = () => {
    if (!bannerPreview) {
      return;
    }

    setServerError(null);
    updateMutation.mutate({ bannerUrl: bannerPreview.dataUrl });
  };

  return (
    <div className="min-h-screen bg-black px-8 py-8 text-white">
      <div className="mb-6">
        <h1 className="text-[22px] font-semibold leading-7 text-[#f1f2f4]">
          All Customization
        </h1>
        <div className="mt-3 flex items-center gap-2 text-[14px] font-semibold">
          <Link href="/dashboard" className="text-[#4f86ee]">
            Dashboard
          </Link>
          <span className="text-[#aeb3c0]">&gt;</span>
          <span className="text-[#d7d9df]">All Customization</span>
        </div>
      </div>

      {serverError && (
        <div className="mb-5 rounded-md border border-[#5f2228] bg-[#21090c] px-4 py-3 text-[13px] font-semibold text-[#ff7a85]">
          {serverError}
        </div>
      )}

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1fr)_420px]">
        <section className="rounded-md border border-[#121a2d] bg-[#070b14] p-5">
          <div className="mb-5 flex items-start justify-between gap-4">
            <div>
              <h2 className="text-[18px] font-semibold text-[#f2f4f8]">
                Categories
              </h2>
              <p className="mt-1 text-[13px] font-semibold text-[#818a9e]">
                Add or delete store categories from backend configuration.
              </p>
            </div>
            <span className="rounded-full bg-[#111a2e] px-3 py-1 text-[12px] font-semibold text-[#d9e3ff]">
              {customization.categories.length} active
            </span>
          </div>

          <form
            onSubmit={handleAddCategory}
            className="mb-5 flex flex-col gap-3 sm:flex-row"
          >
            <input
              value={newCategory}
              onChange={(event) => setNewCategory(event.target.value)}
              placeholder="Add category"
              className="h-11 min-w-0 flex-1 rounded-md border border-[#18223b] bg-[#0b1120] px-3 text-[14px] font-semibold text-white outline-none transition duration-150 placeholder:text-[#697184] focus:border-[#2858ba]"
            />
            <button
              type="submit"
              disabled={updateMutation.isPending}
              className="h-11 rounded-md bg-[#2457df] px-5 text-[14px] font-semibold text-white transition duration-150 hover:bg-[#3266ee] disabled:cursor-not-allowed disabled:opacity-70"
            >
              Add Category
            </button>
          </form>

          <form
            onSubmit={handleAddSubCategory}
            className="mb-5 grid grid-cols-1 gap-3 lg:grid-cols-[240px_minmax(0,1fr)_180px]"
          >
            <select
              value={selectedSubCategoryCategory}
              onChange={(event) => setSubCategoryCategory(event.target.value)}
              disabled={!customization.categories.length}
              className="h-11 rounded-md border border-[#18223b] bg-[#0b1120] px-3 text-[14px] font-semibold text-white outline-none transition duration-150 focus:border-[#2858ba] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {!customization.categories.length && (
                <option value="">Select category</option>
              )}
              {customization.categories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
            <input
              value={newSubCategory}
              onChange={(event) => setNewSubCategory(event.target.value)}
              placeholder="Add sub category"
              disabled={!customization.categories.length}
              className="h-11 min-w-0 rounded-md border border-[#18223b] bg-[#0b1120] px-3 text-[14px] font-semibold text-white outline-none transition duration-150 placeholder:text-[#697184] focus:border-[#2858ba] disabled:cursor-not-allowed disabled:opacity-60"
            />
            <button
              type="submit"
              disabled={
                updateMutation.isPending || !customization.categories.length
              }
              className="h-11 rounded-md bg-[#2457df] px-5 text-[14px] font-semibold text-white transition duration-150 hover:bg-[#3266ee] disabled:cursor-not-allowed disabled:opacity-70"
            >
              Add Sub Category
            </button>
          </form>

          <div className="overflow-hidden rounded-md border border-[#121a2d] bg-black">
            <table className="w-full border-collapse text-left text-[14px] font-semibold">
              <thead>
                <tr className="h-[52px] bg-[#0b1122] text-[#cfd3df]">
                  <th className="px-4">Category</th>
                  <th className="px-4">Sub Categories</th>
                  <th className="w-[120px] px-4 text-center">Action</th>
                </tr>
              </thead>
              <tbody>
                {isLoading && (
                  <tr className="h-[56px] border-t border-[#11172b] text-[#979dad]">
                    <td className="px-4" colSpan={3}>
                      Loading customization...
                    </td>
                  </tr>
                )}

                {!isLoading && customization.categories.length === 0 && (
                  <tr className="h-[56px] border-t border-[#11172b] text-[#979dad]">
                    <td className="px-4" colSpan={3}>
                      No categories found.
                    </td>
                  </tr>
                )}

                {!isLoading &&
                  customization.categories.map((category) => {
                    const subCategories =
                      customization.subCategories?.[category] || [];

                    return (
                      <tr
                        key={category}
                        className="border-t border-[#11172b] text-[#b8bcc8] transition duration-150 hover:bg-[#080d19] hover:text-white"
                      >
                        <td className="px-4 py-4 text-[#e5e7ed]">
                          {category}
                        </td>
                        <td className="px-4 py-4 text-[#8f97ab]">
                          {subCategories.length ? (
                            <div className="flex flex-wrap gap-2">
                              {subCategories.map((subCategory) => (
                                <span
                                  key={`${category}-${subCategory}`}
                                  className="inline-flex min-h-8 items-center gap-2 rounded-md border border-[#18223b] bg-[#0b1120] px-3 py-1 text-[13px] font-semibold text-[#c8cfdf]"
                                >
                                  {subCategory}
                                  <button
                                    type="button"
                                    onClick={() =>
                                      handleDeleteSubCategory(
                                        category,
                                        subCategory
                                      )
                                    }
                                    disabled={updateMutation.isPending}
                                    className="flex h-5 w-5 items-center justify-center rounded text-[#ff7070] transition duration-150 hover:bg-[#2b1117] disabled:cursor-not-allowed disabled:opacity-60"
                                    aria-label={`Delete ${subCategory}`}
                                  >
                                    x
                                  </button>
                                </span>
                              ))}
                            </div>
                          ) : (
                            "None"
                          )}
                        </td>
                        <td className="px-4 py-4">
                          <button
                            type="button"
                            onClick={() => handleDeleteCategory(category)}
                            disabled={updateMutation.isPending}
                            className="mx-auto flex h-9 w-9 items-center justify-center rounded-md text-[#ff7070] transition duration-150 hover:bg-[#2b1117] disabled:cursor-not-allowed disabled:opacity-60"
                            aria-label={`Delete ${category}`}
                          >
                            <TrashIcon />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        </section>

        <aside className="space-y-5">
          <section className="rounded-md border border-[#121a2d] bg-[#070b14] p-5">
            <h2 className="text-[18px] font-semibold text-[#f2f4f8]">
              Logo
            </h2>
            <div className="mt-4 overflow-hidden rounded-md border border-[#121a2d] bg-black p-4">
              <div className="h-[156px]">
                {logoPreview?.dataUrl || customization.logoUrl ? (
                  <img
                    src={logoPreview?.dataUrl || customization.logoUrl}
                    alt="Current logo"
                    className="h-full w-full rounded-md object-contain"
                  />
                ) : (
                  <ImagePlaceholder label="No logo uploaded" />
                )}
              </div>
              {logoPreview && (
                <p className="mt-3 truncate text-[12px] font-semibold text-[#8f97ab]">
                  Selected: {logoPreview.name}
                </p>
              )}
              <input
                ref={logoInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(event) => handleFileSelect(event, "logo")}
              />
              <div className="mt-4 flex gap-3">
                <button
                  type="button"
                  onClick={() => logoInputRef.current?.click()}
                  className="flex h-10 flex-1 items-center justify-center gap-2 rounded-md border border-[#1c2640] text-[13px] font-semibold text-[#c7ccd8] transition duration-150 hover:bg-[#10182d]"
                >
                  <UploadIcon />
                  Upload Logo
                </button>
                <button
                  type="button"
                  onClick={saveLogo}
                  disabled={!logoPreview || updateMutation.isPending}
                  className="h-10 rounded-md bg-[#2457df] px-5 text-[13px] font-semibold text-white transition duration-150 hover:bg-[#3266ee] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Save
                </button>
              </div>
            </div>
          </section>

          <section className="rounded-md border border-[#121a2d] bg-[#070b14] p-5">
            <h2 className="text-[18px] font-semibold text-[#f2f4f8]">
              Banner
            </h2>
            <div className="mt-4 overflow-hidden rounded-md border border-[#121a2d] bg-black p-4">
              <div className="h-[180px]">
                {bannerPreview?.dataUrl || customization.bannerUrl ? (
                  <img
                    src={bannerPreview?.dataUrl || customization.bannerUrl}
                    alt="Current banner"
                    className="h-full w-full rounded-md object-cover"
                  />
                ) : (
                  <ImagePlaceholder label="No banner uploaded" />
                )}
              </div>
              {bannerPreview && (
                <p className="mt-3 truncate text-[12px] font-semibold text-[#8f97ab]">
                  Selected: {bannerPreview.name}
                </p>
              )}
              <input
                ref={bannerInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(event) => handleFileSelect(event, "banner")}
              />
              <div className="mt-4 flex gap-3">
                <button
                  type="button"
                  onClick={() => bannerInputRef.current?.click()}
                  className="flex h-10 flex-1 items-center justify-center gap-2 rounded-md border border-[#1c2640] text-[13px] font-semibold text-[#c7ccd8] transition duration-150 hover:bg-[#10182d]"
                >
                  <UploadIcon />
                  Upload Banner
                </button>
                <button
                  type="button"
                  onClick={saveBanner}
                  disabled={!bannerPreview || updateMutation.isPending}
                  className="h-10 rounded-md bg-[#2457df] px-5 text-[13px] font-semibold text-white transition duration-150 hover:bg-[#3266ee] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Save
                </button>
              </div>
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
};

export default CustomizationPage;
