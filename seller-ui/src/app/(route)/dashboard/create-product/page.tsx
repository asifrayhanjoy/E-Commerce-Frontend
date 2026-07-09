
  "use client";

  import Input from "@/app/package/components";
  import CustomProperties from "@/app/package/components/CustomProperties";
  import CustomSpecifications from "@/app/package/components/CustomSpecifications";
import RichTextEditor from "@/app/package/components/rich-text-editor";
import SizeSelector from "@/app/package/components/size-selector";
  import ColorSelector from "@/app/shared/components/coler.selctor";
  import ImagePlaceHolder from "@/app/shared/components/image.Preseholder";
  import axiosInstance from "@/utils/axiosInstance";
  import { useQuery } from "@tanstack/react-query";
  import { ChevronRight } from "lucide-react";
  import React, { useState } from "react";
  import { useForm, Controller } from "react-hook-form";

  type ProductFormData = {
    title: string;
    shortDescription: string;
    tags: string;
    warranty: string;
    slug: string;
    brand?: string;
    cash_on_delivery?: string;
    colors: string[];
    images: (File | null)[];
    custom_specifications: string;
    detailed_description?: string;
    // optional fields used in the form
    category?: string;
    subCategory?: string;
    regular_price?: number | string;
    sale_price?: number | string;
    video_url?: string;
    discountCodes?: string[];
    stock?: number;
  };

  type Category = string | {
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

  const emptyCategories: CategoriesResponse = {
    categories: [],
    subCategories: {},
  };

  const getCategoryValue = (category: Category, index: number) => {
    if (typeof category === "string") return category;

    return (
      category._id ??
      category.id ??
      category.slug ??
      category.name ??
      String(index)
    );
  };

  const getCategoryLabel = (category: Category) => {
    if (typeof category === "string") return category;

    return (
      category.name ??
      category.title ??
      category.slug ??
      category._id ??
      category.id ??
      "Untitled category"
    );
  };

  const getSubCategories = (
    subCategories: Record<string, unknown> | undefined,
    selectedCategory: string | undefined
  ) => {
    if (!subCategories || !selectedCategory) return [];

    const value = subCategories[selectedCategory];
    return Array.isArray(value) ? (value as Category[]) : [];
  };

  const Page = () => {
    const { register, control, setValue, handleSubmit, formState: { errors, isDirty }, watch } = useForm<ProductFormData>({
      defaultValues: {
        cash_on_delivery: "yes",
        colors: [],
        images: [null],
        custom_specifications: "",
        category: "",
        subCategory: "",
        regular_price: "",
      },
    });

    const [isChanged, ] = useState(true);
    const [, setOpenImageModal] = useState(false);
    const [images, setImages] = useState<(File | null)[]>([null]);
    const regularPrice = watch("regular_price");

   const { data, isLoading } = useQuery<CategoriesResponse>({
    queryKey: ["categories"],
    queryFn: async () => {
      try {
        const res = await axiosInstance.get<CategoriesResponse>("/api/v1/products/get-categories");
        return res.data ?? emptyCategories;
      } catch {
        return emptyCategories;
      }
    },
    staleTime: 1000 * 60 * 5,
    retry: 2,
  });

    const { data: discountCodes = [], isLoading: discountLoading } = useQuery({
  queryKey: ["shop-discounts"],
  queryFn: async () => {
    const res = await axiosInstance.get("/api/v1/products/get-discount-codes");
    return res?.data?.discount_codes || [];
  },
});

  const categories = data?.categories ?? [];
  const selectedCategory = watch("category");
  const subCategories = getSubCategories(data?.subCategories, selectedCategory);

    const onSubmit = (data: ProductFormData) => {
      console.log(data);
    };

    const handleSaveDraft = () => {
    };

const convertFileToBase64 = (file: File) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = (error) => reject(error);
  });
};

    const handleImageChange = async (file: File | null, index: number) => {
      if (!file) return;

      try {
        const fileName = await convertFileToBase64(file);
        const response = await axiosInstance.post("/api/v1/products/upload-product-image",{fileName});

        const updatedImages = [...images];
        updatedImages[index] = response.data.file_url;

        if (index === images.length - 1 && updatedImages.length < 8) {
          updatedImages.push(null);
        }

        setImages(updatedImages);
        setValue("images", updatedImages);
        } catch (error) {
        console.log(error);
        }};

    const handleRemoveImage = (index: number) => {
      try {
    const updatedImages = [...images];
    const imageToDelete = updatedImages[index];

    if (imageToDelete && typeof imageToDelete === "string") {
      // delete our picture
      }

    updatedImages.splice(index, 1);

    // Add null placeholder
    if (!updatedImages.includes(null) && updatedImages.length < 8) {
    updatedImages.push(null);
    }

  setImages(updatedImages);
  setValue("images", updatedImages);
}  catch (error) {
        console.log(error)
      }
    };

    return (
      <form
        className="w-full mx-auto p-8 shadow-md rounded-lg text-white"
        onSubmit={handleSubmit(onSubmit)}
      >
        <h2 className="text-2xl py-2 font-semibold font-Poppins text-white">
          Create Product
        </h2>

        <div className="flex items-center">
          <span className="text-[#80Deea] cursor-pointer">Dashboard</span>
          <ChevronRight size={20} className="opacity-[.8]" />
          <span>Create Product</span>
        </div>

                    {/* {number-01} */}
        <div className="py-4 w-full flex flex-col gap-6 md:flex-row">
          <div className="w-full md:w-1/3">
            <ImagePlaceHolder
              setOpenImageModal={setOpenImageModal}
              size="765 x 850"
              small={false}
              index={0}
              onImageChange={handleImageChange}
              onRemove={handleRemoveImage}
            />
          </div>

                    {/* {number-02} */}
          <div className="w-full md:w-1/3">
            <div className="w-full flex flex-col gap-2">
              <Input label="Product Title *"
                placeholder="Enter product title"
                {...register("title", { required: "Title is required" })}
              />
              {errors.title?.message && (
                <p className="-mt-3 text-sm text-red-400">
                  {errors.title.message as string}
                </p>
              )}

              <Input type="textarea"
                label="Short Description * (Max 150 words)"
                placeholder="Enter product description for quick view"
                className="min-h-[120px] resize-y"
                {...register("shortDescription", {
                  required: "Short description is required",
                  validate: (value) =>
                    String(value).trim().split(/\s+/).filter(Boolean).length <=
                      150 || "Short description must be 150 words or less",
                })}
              />
              {errors.shortDescription?.message && (
                <p className="-mt-3 text-sm text-red-400">
                  {errors.shortDescription.message as string}
                </p>
              )}

              <Input label="Tags *"
                placeholder="apple,flagship"
                {...register("tags", { required: "Tags are required" })}
              />
              {errors.tags?.message && (
                <p className="-mt-3 text-sm text-red-400">
                  {errors.tags.message as string}
                </p>
              )}

              <Input label="Warranty *"
                placeholder="1 Year / No Warranty"
                {...register("warranty", {
                  required: "Warranty is required",
                })}
              />
              {errors.warranty?.message && (
                <p className="-mt-3 text-sm text-red-400">
                  {errors.warranty.message as string}
                </p>
              )}

              <Input label="Slug *"
                placeholder="product_slug"
                {...register("slug", { required: "Slug is required" })}
              />
              {errors.slug?.message && (
                <p className="-mt-3 text-sm text-red-400">
                  {errors.slug.message as string}
                </p>
              )}

              <Input label="Brand"
              placeholder="Apple"
                {...register("brand")}
              />

              <div className="mt-2">
                <ColorSelector control={control} errors={errors} />
              </div>

              <div className="mt-2">
                <CustomSpecifications control={control} errors={errors} />
              </div>

              <div className="mt-2">
                <CustomProperties control={control} errors={errors} />
              </div>

              <div className="mt-2 border-amber-50">
            <label className="block font-semibold text-gray-300 mb-1">
             Cash On Delivery *
           </label>

             <select
            {...register("cash_on_delivery", {
           required: "Cash on Delivery is required",
            })}
           defaultValue="yes"
           className="w-full border outline-none border-amber-700 bg-transparent">
          <option value="yes" className="bg-black">
            Yes
          </option>
          <option value="no" className="bg-black">
            No
         </option>
         </select>
          </div>
            </div>
          </div>

                    {/* {number-03} */}
          <div className="w-full md:w-1/3">
            <div className="w-full flex flex-col gap-2">
              <div className="mt-2">
    <label className="block font-semibold text-gray-300 mb-1">
      Category *
    </label>

  <Controller
    name="category"
    control={control}
    rules={{
      required: "Category is required",
    }}
    render={({ field }) => (
      <select
        {...field}
        className="w-full border border-gray-700 bg-transparent rounded-md p-2 outline-none"
      >
        <option value="" className="bg-black">
          {isLoading ? "Loading categories..." : "Select Category"}
        </option>

        {categories.map((category, index) => (
          <option
            key={getCategoryValue(category, index)}
            value={getCategoryValue(category, index)}
            className="bg-black"
          >
            {getCategoryLabel(category)}
          </option>
        ))}
      </select>
    )}
  />

  {errors.category && (
    <p className="text-red-500 text-sm mt-1">
      {errors.category.message as string}
    </p>
  )}
</div>

<div className="mt-2">
  <label className="block font-semibold text-gray-300 mb-1">
    Sub Category *
  </label>

  <Controller
    name="subCategory"
    control={control}
    rules={{
      required: "Sub category is required",
    }}
    render={({ field }) => (
      <select
        {...field}
        disabled={!selectedCategory}
        className="w-full border border-gray-700 bg-transparent rounded-md p-2 outline-none disabled:cursor-not-allowed disabled:opacity-60"
      >
        <option value="" className="bg-black">
          Select Sub Category
        </option>

        {subCategories.map((subCategory, index) => (
          <option
            key={getCategoryValue(subCategory, index)}
            value={getCategoryValue(subCategory, index)}
            className="bg-black"
          >
            {getCategoryLabel(subCategory)}
          </option>
        ))}
      </select>
    )}
  />

  {errors.subCategory && (
    <p className="text-red-500 text-sm mt-1">
      {errors.subCategory.message as string}
    </p>
  )}
</div>

<div className="mt-2">
  <label className="block font-semibold text-gray-300 mb-1">
    Detailed Description * <span className="text-blue-400">(Min 100 Words)</span>
  </label>

  <Controller name="detailed_description"
    control={control}
    rules={{
      required: "Detailed description is required!",
      validate: (value) => {
        const text = value ?? '';
        const wordCount = text
          .split(/\s+/)
          .filter((word: string) => word).length;

        return (
          wordCount >= 100 ||
          "Description must be at least 100 words!"
        );
      },
    }}
    render={({ field }) => (
      <RichTextEditor
        value={field.value ?? ''}
        onChange={field.onChange}
      />
    )}
  />
  {errors.detailed_description && (
    <p className="text-red-500 text-sm mt-1">
      {errors.detailed_description.message as string}
    </p>
  )}
</div>

<div className="mt-2">
  <Input
    label="Video URL"
    placeholder="https://www.youtube.com/embed/xyz123"
    {...register("video_url", {
      pattern: {
        value:
          /^https:\/\/(www\.)?youtube\.com\/embed\/[a-zA-Z0-9_-]+$/,
        message:
          "Invalid YouTube embed URL! Use format: https://www.youtube.com/embed/VIDEO_ID",
      },
    })}
  />

  {errors.video_url && (
    <p className="text-red-500 text-xs mt-1">
      {errors.video_url.message as string}
    </p>
  )}
</div>

<div className="mt-2">
  <Input
    label="Regular Price"
    placeholder="20$"
    {...register("regular_price", {
      valueAsNumber: true,
      min: {
        value: 1,
        message: "Price must be at least 1",
      },
      validate: (value) =>
        value === undefined || !isNaN(Number(value)) || "Only numbers are allowed",
    })}
  />

  {errors.regular_price && (
    <p className="text-red-500 text-xs mt-1">
      {errors.regular_price.message as string}
    </p>
  )}
</div>

<div className="mt-2">
  <Input
    label="Sale Price *"
    placeholder="15$"
    {...register("sale_price", {
      required: "Sale Price is required",
      valueAsNumber: true,
      min: {
        value: 1,
        message: "Sale Price must be at least 1",
      },
      validate: (value) => {
        if (typeof value === "number" && isNaN(value)) return "Only numbers are allowed";

        if (value !== undefined && regularPrice && value >= regularPrice) {
          return "Sale Price must be less than Regular Price";
        }

        return true;
      },
    })}
  />

  {errors.sale_price && (
    <p className="text-red-500 text-xs mt-1">
      {errors.sale_price.message as string}
    </p>
  )}
</div>

<div className="mt-2">
  <Input
    label="Stock *"
    placeholder="100"
    {...register("stock", {
      required: "Stock is required!",
      valueAsNumber: true,
      min: {
        value: 1,
        message: "Stock must be at least 1",
      },
      max: {
        value: 1000,
        message: "Stock cannot exceed 1,000",
      },
      validate: (value) => {
        if (typeof value !== "number" || isNaN(value)) return "Only numbers are allowed!";
        if (!Number.isInteger(value))
          return "Stock must be a whole number!";

        return true;
      },
    })}
  />

  {errors.stock && (
    <p className="text-red-500 text-xs mt-1">
      {errors.stock.message as string}
    </p>
  )}
</div>

<div className="mt-2">
  <SizeSelector control={control} errors={errors} />
</div>

<div className="mt-3">
  <label className="block font-semibold text-gray-300 mb-1">
    Select Discount Codes (optional)
  </label>
{
  discountLoading ? (
    <p className="text-gray-400">
      Loading discount codes ...
    </p>
  ) : (
    <div className="flex flex-wrap gap-2">
      {discountCodes?.map((code: any) => (
        <button
          key={code.id}
          type="button"
          className={`px-3 py-1 rounded-md text-sm font-semibold border ${
            watch("discountCodes")?.includes(code.id)
              ? "bg-blue-600 text-white border-blue-600"
              : "bg-gray-800 text-gray-300 border-gray-600 hover:bg-gray-700"
          }`}
          onClick={() => {
            const currentSelection = watch("discountCodes") || [];

            const updatedSelection = currentSelection?.includes(code.id)
              ? currentSelection.filter(
                  (id: string) => id !== code.id
                )
              : [...currentSelection, code.id];

            setValue("discountCodes", updatedSelection);
          }}
        >
          {code?.public_name} (
          {code.discountValue}
          {code.discountType === "percentage" ? "%" : "$"})
        </button>
      ))}
    </div>
  )
}
</div>
            </div>
          </div>



        </div>
        <div className="mt-6 flex justify-end gap-3">
  {isChanged && (
    <button
      type="button"
      onClick={handleSaveDraft}
      className="px-4 py-2 bg-gray-700 text-white rounded-md"
    >
      Save Draft
    </button>
  )}
  <button
  type="submit"
  className="px-4 py-2 bg-blue-600 text-white rounded-md"
  disabled={isLoading}
>
  {isLoading ? "Creating..." : "Create"}
</button>
</div>
      </form>
    );
  };

  export default Page;
