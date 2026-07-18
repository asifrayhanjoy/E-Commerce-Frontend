"use client";

import axiosInstance from "@/utils/axiosInstance";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  CalendarPlus,
  ChevronRight,
  ImagePlus,
  Loader2,
  UploadCloud,
  X,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { ChangeEvent, FormEvent, ReactNode } from "react";
import { useMemo, useState } from "react";
import toast from "react-hot-toast";

type UploadedImage = {
  fileId: string;
  file_url: string;
};

type Category =
  | string
  | {
      _id?: string;
      id?: string;
      name?: string;
      title?: string;
      slug?: string;
    };

type CategoriesResponse = {
  categories?: Category[];
  subCategories?: Record<string, unknown>;
};

type EventFormState = {
  title: string;
  slug: string;
  category: string;
  subCategory: string;
  shortDescription: string;
  detailedDescription: string;
  startingDate: string;
  endingDate: string;
  regularPrice: string;
  salePrice: string;
  stock: string;
  tags: string;
  warranty: string;
  image: UploadedImage | null;
};

const emptyCategories: CategoriesResponse = {
  categories: [],
  subCategories: {},
};

const initialFormState: EventFormState = {
  title: "",
  slug: "",
  category: "",
  subCategory: "",
  shortDescription: "",
  detailedDescription: "",
  startingDate: "",
  endingDate: "",
  regularPrice: "",
  salePrice: "",
  stock: "0",
  tags: "",
  warranty: "",
  image: null,
};

const getCategoryValue = (category: Category, index: number) => {
  if (typeof category === "string") return category;

  return category._id ?? category.id ?? category.slug ?? category.name ?? String(index);
};

const getCategoryLabel = (category: Category) => {
  if (typeof category === "string") return category;

  return category.name ?? category.title ?? category.slug ?? category._id ?? category.id ?? "Untitled";
};

const getSubCategories = (
  subCategories: Record<string, unknown> | undefined,
  selectedCategory: string
) => {
  if (!subCategories || !selectedCategory) return [];

  const value = subCategories[selectedCategory];

  return Array.isArray(value) ? (value as Category[]) : [];
};

const toSlug = (value: string) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const convertFileToBase64 = (file: File) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader();

    reader.readAsDataURL(file);
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = reject;
  });

const inputClassName =
  "w-full rounded-md border border-slate-700 bg-slate-950 px-4 py-3 text-sm font-semibold text-white outline-none transition placeholder:text-gray-500 focus:border-blue-500";

function CreateEventPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [form, setForm] = useState<EventFormState>(initialFormState);
  const [imagePreview, setImagePreview] = useState("");
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data = emptyCategories, isLoading: isLoadingCategories } =
    useQuery<CategoriesResponse>({
      queryKey: ["categories"],
      queryFn: async () => {
        const response = await axiosInstance.get<CategoriesResponse>(
          "/api/v1/products/get-categories"
        );

        return response.data ?? emptyCategories;
      },
      staleTime: 1000 * 60 * 5,
    });

  const categories = data.categories ?? [];
  const subCategories = useMemo(
    () => getSubCategories(data.subCategories, form.category),
    [data.subCategories, form.category]
  );

  const updateField = (field: keyof EventFormState, value: string) => {
    setForm((current) => {
      const next = { ...current, [field]: value };

      if (field === "title" && !current.slug) {
        next.slug = toSlug(value);
      }

      if (field === "category") {
        next.subCategory = "";
      }

      return next;
    });
  };

  const handleImageChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    if (!file) return;

    setIsUploadingImage(true);

    try {
      const fileName = await convertFileToBase64(file);
      const response = await axiosInstance.post("/api/v1/products/upload-product-image", {
        fileName,
      });
      const uploadedImage = {
        fileId: response.data.fileId,
        file_url: response.data.file_url,
      };

      setForm((current) => ({
        ...current,
        image: uploadedImage,
      }));
      setImagePreview(uploadedImage.file_url);
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Failed to upload event image.");
    } finally {
      setIsUploadingImage(false);
      event.target.value = "";
    }
  };

  const removeImage = async () => {
    const image = form.image;

    setForm((current) => ({ ...current, image: null }));
    setImagePreview("");

    if (!image?.fileId) return;

    try {
      await axiosInstance.delete("/api/v1/products/delete-product-image", {
        data: { fileId: image.fileId },
      });
    } catch {
      toast.error("Image was removed from the form but not deleted from storage.");
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!form.image) {
      toast.error("Please upload an event image.");
      return;
    }

    if (!form.category || !form.subCategory) {
      toast.error("Please add the event category and sub category.");
      return;
    }

    const slug = form.slug || toSlug(form.title);

    if (!slug) {
      toast.error("Please add a valid event title.");
      return;
    }

    setIsSubmitting(true);

    try {
      const payload = {
        title: form.title,
        slug,
        category: form.category,
        subCategory: form.subCategory,
        short_description: form.shortDescription,
        detailed_description: form.detailedDescription,
        starting_date: form.startingDate,
        ending_date: form.endingDate,
        regular_price: form.regularPrice,
        sale_price: form.salePrice,
        stock: form.stock,
        tags: form.tags || form.title,
        warranty: form.warranty,
        cash_on_delivery: "yes",
        images: [form.image],
        colors: [],
        sizes: [],
        discountCodes: [],
        custom_specifications: {},
        customProperties: {},
      };

      try {
        await axiosInstance.post("/api/v1/products/create-event", payload);
      } catch (error: any) {
        if (error?.response?.status !== 404) {
          throw error;
        }

        await axiosInstance.post("/api/v1/products/create-product", payload);
      }

      toast.success("Event created successfully.");
      queryClient.invalidateQueries({ queryKey: ["shop-events"] });
      queryClient.invalidateQueries({ queryKey: ["shop-products"] });
      router.push("/dashboard/events");
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Failed to create event.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const isBusy = isUploadingImage || isSubmitting;

  return (
    <div className="min-h-screen w-full p-6 text-white md:p-12">
      <div className="mb-2 flex items-center justify-between">
        <h2 className="font-Poppins text-2xl font-semibold text-white">
          Create Event
        </h2>
        <Link
          href="/dashboard/events"
          className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-500"
        >
          All Events
        </Link>
      </div>

      <div className="flex items-center text-sm text-white">
        <Link href="/dashboard" className="cursor-pointer text-[#80Deea]">
          Dashboard
        </Link>
        <ChevronRight size={20} className="opacity-[.8]" />
        <span>Create Event</span>
      </div>

      <form
        onSubmit={handleSubmit}
        className="mt-8 grid gap-6 rounded-lg border border-slate-800 bg-gray-950 p-6 xl:grid-cols-[360px_1fr]"
      >
        <section className="rounded-lg border border-slate-800 bg-black p-4">
          <label
            htmlFor="event-image"
            className="flex min-h-[340px] cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed border-slate-700 bg-slate-950 text-center transition hover:border-blue-500"
          >
            {imagePreview ? (
              <img
                src={imagePreview}
                alt="Event preview"
                className="h-full max-h-[340px] w-full rounded-lg object-cover"
              />
            ) : (
              <div className="flex flex-col items-center gap-3 px-6 text-gray-400">
                <ImagePlus size={42} className="text-blue-400" />
                <span className="text-base font-semibold text-gray-200">
                  Upload Event Image
                </span>
                <span className="text-sm">Select an image from your PC</span>
              </div>
            )}
          </label>
          <input
            id="event-image"
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleImageChange}
            disabled={isBusy}
          />
          <div className="mt-4 flex gap-3">
            <label
              htmlFor="event-image"
              className="flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-md border border-slate-700 px-4 py-3 text-sm font-semibold text-white transition hover:border-blue-500"
            >
              {isUploadingImage ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                <UploadCloud size={18} />
              )}
              Upload Image
            </label>
            {form.image && (
              <button
                type="button"
                onClick={removeImage}
                className="rounded-md border border-red-500/40 px-4 py-3 text-red-300 transition hover:bg-red-950/40"
                disabled={isBusy}
              >
                <X size={18} />
              </button>
            )}
          </div>
        </section>

        <section className="grid gap-5">
          <div className="grid gap-5 lg:grid-cols-2">
            <FormField label="Event Title *">
              <input
                value={form.title}
                onChange={(event) => updateField("title", event.target.value)}
                required
                className={inputClassName}
                placeholder="Enter event title"
              />
            </FormField>

            <FormField label="Slug *">
              <input
                value={form.slug}
                onChange={(event) => updateField("slug", toSlug(event.target.value))}
                required
                className={inputClassName}
                placeholder="event-slug"
              />
            </FormField>

            <FormField label="Category *">
              {categories.length ? (
                <select
                  value={form.category}
                  onChange={(event) => updateField("category", event.target.value)}
                  required
                  className={inputClassName}
                >
                  <option value="">
                    {isLoadingCategories ? "Loading categories..." : "Select category"}
                  </option>
                  {categories.map((category, index) => {
                    const value = getCategoryValue(category, index);

                    return (
                      <option key={value} value={value}>
                        {getCategoryLabel(category)}
                      </option>
                    );
                  })}
                </select>
              ) : (
                <input
                  value={form.category}
                  onChange={(event) => updateField("category", event.target.value)}
                  required
                  className={inputClassName}
                  placeholder="Enter category"
                />
              )}
            </FormField>

            <FormField label="Sub Category *">
              {subCategories.length ? (
                <select
                  value={form.subCategory}
                  onChange={(event) => updateField("subCategory", event.target.value)}
                  required
                  className={inputClassName}
                >
                  <option value="">Select sub category</option>
                  {subCategories.map((subCategory, index) => {
                    const value = getCategoryValue(subCategory, index);

                    return (
                      <option key={value} value={value}>
                        {getCategoryLabel(subCategory)}
                      </option>
                    );
                  })}
                </select>
              ) : (
                <input
                  value={form.subCategory}
                  onChange={(event) => updateField("subCategory", event.target.value)}
                  required
                  className={inputClassName}
                  placeholder="Enter sub category"
                />
              )}
            </FormField>

            <FormField label="Starting Date *">
              <input
                type="datetime-local"
                value={form.startingDate}
                onChange={(event) => updateField("startingDate", event.target.value)}
                required
                className={inputClassName}
              />
            </FormField>

            <FormField label="Ending Date *">
              <input
                type="datetime-local"
                value={form.endingDate}
                onChange={(event) => updateField("endingDate", event.target.value)}
                required
                className={inputClassName}
              />
            </FormField>

            <FormField label="Regular Price *">
              <input
                type="number"
                min="0"
                value={form.regularPrice}
                onChange={(event) => updateField("regularPrice", event.target.value)}
                required
                className={inputClassName}
                placeholder="0"
              />
            </FormField>

            <FormField label="Sale Price *">
              <input
                type="number"
                min="0"
                value={form.salePrice}
                onChange={(event) => updateField("salePrice", event.target.value)}
                required
                className={inputClassName}
                placeholder="0"
              />
            </FormField>

            <FormField label="Stock *">
              <input
                type="number"
                min="0"
                value={form.stock}
                onChange={(event) => updateField("stock", event.target.value)}
                required
                className={inputClassName}
                placeholder="0"
              />
            </FormField>

            <FormField label="Tags *">
              <input
                value={form.tags}
                onChange={(event) => updateField("tags", event.target.value)}
                required
                className={inputClassName}
                placeholder="event, offer, sale"
              />
            </FormField>
          </div>

          <FormField label="Short Description *">
            <textarea
              value={form.shortDescription}
              onChange={(event) => updateField("shortDescription", event.target.value)}
              required
              className={`${inputClassName} min-h-[110px] resize-y`}
              placeholder="Write a short event summary"
            />
          </FormField>

          <FormField label="Detailed Description *">
            <textarea
              value={form.detailedDescription}
              onChange={(event) => updateField("detailedDescription", event.target.value)}
              required
              className={`${inputClassName} min-h-[150px] resize-y`}
              placeholder="Write full event details"
            />
          </FormField>

          <FormField label="Warranty / Note">
            <input
              value={form.warranty}
              onChange={(event) => updateField("warranty", event.target.value)}
              className={inputClassName}
              placeholder="Optional note"
            />
          </FormField>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={isBusy}
              className="flex items-center gap-2 rounded-lg bg-blue-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                <CalendarPlus size={18} />
              )}
              Create Event
            </button>
          </div>
        </section>
      </form>
    </div>
  );
}

function FormField({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-semibold text-gray-300">{label}</span>
      {children}
    </label>
  );
}

export default CreateEventPage;
