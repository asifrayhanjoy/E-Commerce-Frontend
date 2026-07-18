
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
  import { ChevronRight, WandSparkles, X } from "lucide-react";
  import React, { useRef, useState } from "react";
  import { useRouter } from "next/navigation";
  import { useForm, Controller } from "react-hook-form";
import toast from "react-hot-toast";

  type ProductFormData = {
    title: string;
    shortDescription: string;
    tags: string;
    warranty: string;
    slug: string;
    brand?: string;
    cash_on_delivery?: string;
    colors: string[];
    images: (string | null | UploadedImage)[];
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

  interface UploadedImage {
  fileId: string;
  file_url: string;
}

  type ApplyEnhancedImage = (imageUrl: string) => void;

  const isUploadedImage = (
    image: ProductFormData["images"][number]
  ): image is UploadedImage => {
    return (
      !!image &&
      typeof image === "object" &&
      !!image.fileId &&
      !!image.file_url
    );
  };

  const normalizeSlugValue = (value?: string) =>
    (value || "")
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");

  const getUniqueRetrySlug = (slug: string, title: string) => {
    const baseSlug = normalizeSlugValue(slug) || normalizeSlugValue(title) || "product";

    return `${baseSlug}-${Date.now()}`;
  };

  const isDuplicateSlugError = (error: any) =>
    String(error?.response?.data?.message || "")
      .toLowerCase()
      .includes("slug already");

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

  type EnhancementAction = "remove-bg" | "drop-shadow" | "retouch" | "upscale";

  const enhancementOptions: { label: string; value: EnhancementAction }[] = [
    { label: "Remove BG", value: "remove-bg" },
    { label: "Drop Shadow", value: "drop-shadow" },
    { label: "Retouch", value: "retouch" },
    { label: "Upscale", value: "upscale" },
  ];

  const loadImage = (imageUrl: string) => {
    return new Promise<HTMLImageElement>((resolve, reject) => {
      const image = new Image();

      if (!imageUrl.startsWith("blob:") && !imageUrl.startsWith("data:")) {
        image.crossOrigin = "anonymous";
      }

      image.onload = () => resolve(image);
      image.onerror = () => reject(new Error("Could not load image"));
      image.src = imageUrl;
    });
  };

  const createImageCanvas = async (imageUrl: string) => {
    const image = await loadImage(imageUrl);
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");

    if (!context) {
      throw new Error("Could not create image editor");
    }

    canvas.width = image.naturalWidth || image.width;
    canvas.height = image.naturalHeight || image.height;
    context.drawImage(image, 0, 0);

    return { canvas, context, image };
  };

  const removeLightBackground = async (imageUrl: string) => {
    const { canvas, context } = await createImageCanvas(imageUrl);
    const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
    const pixels = imageData.data;
    const width = canvas.width;
    const height = canvas.height;
    const cornerPixelIndexes = [
      0,
      (width - 1) * 4,
      ((height - 1) * width) * 4,
      ((height - 1) * width + width - 1) * 4,
    ];
    const visibleCornerPixels = cornerPixelIndexes.filter(
      (index) => pixels[index + 3] > 20
    );
    const backgroundColor = visibleCornerPixels.length
      ? visibleCornerPixels.reduce(
          (total, index) => ({
            red: total.red + pixels[index],
            green: total.green + pixels[index + 1],
            blue: total.blue + pixels[index + 2],
          }),
          { red: 0, green: 0, blue: 0 }
        )
      : { red: 255, green: 255, blue: 255 };

    backgroundColor.red = backgroundColor.red / Math.max(1, visibleCornerPixels.length);
    backgroundColor.green = backgroundColor.green / Math.max(1, visibleCornerPixels.length);
    backgroundColor.blue = backgroundColor.blue / Math.max(1, visibleCornerPixels.length);

    const isBackgroundPixel = (pixelIndex: number) => {
      const index = pixelIndex * 4;
      const red = pixels[index];
      const green = pixels[index + 1];
      const blue = pixels[index + 2];
      const distanceFromBackground = Math.hypot(
        red - backgroundColor.red,
        green - backgroundColor.green,
        blue - backgroundColor.blue
      );

      return distanceFromBackground < 80 || pixels[index + 3] < 20;
    };

    const visitedPixels = new Uint8Array(width * height);
    const backgroundPixels: number[] = [];
    const queue: number[] = [];

    const addPixelToQueue = (pixelIndex: number) => {
      if (visitedPixels[pixelIndex] || !isBackgroundPixel(pixelIndex)) return;

      visitedPixels[pixelIndex] = 1;
      queue.push(pixelIndex);
    };

    for (let x = 0; x < width; x += 1) {
      addPixelToQueue(x);
      addPixelToQueue((height - 1) * width + x);
    }

    for (let y = 0; y < height; y += 1) {
      addPixelToQueue(y * width);
      addPixelToQueue(y * width + width - 1);
    }

    for (let queueIndex = 0; queueIndex < queue.length; queueIndex += 1) {
      const pixelIndex = queue[queueIndex];
      const x = pixelIndex % width;
      const y = Math.floor(pixelIndex / width);

      backgroundPixels.push(pixelIndex);

      if (x > 0) addPixelToQueue(pixelIndex - 1);
      if (x < width - 1) addPixelToQueue(pixelIndex + 1);
      if (y > 0) addPixelToQueue(pixelIndex - width);
      if (y < height - 1) addPixelToQueue(pixelIndex + width);
    }

    for (const pixelIndex of backgroundPixels) {
      const alphaIndex = pixelIndex * 4 + 3;
      pixels[alphaIndex] = 0;
    }

    for (const pixelIndex of backgroundPixels) {
      const x = pixelIndex % width;
      const y = Math.floor(pixelIndex / width);
      const neighbors = [
        x > 0 ? pixelIndex - 1 : null,
        x < width - 1 ? pixelIndex + 1 : null,
        y > 0 ? pixelIndex - width : null,
        y < height - 1 ? pixelIndex + width : null,
      ];

      if (neighbors.some((neighbor) => neighbor !== null && !visitedPixels[neighbor])) {
        pixels[pixelIndex * 4 + 3] = 80;
      }
    }

    context.putImageData(imageData, 0, 0);
    return canvas.toDataURL("image/png");
  };

  const addDropShadow = async (imageUrl: string) => {
    const imageWithoutBackground = await removeLightBackground(imageUrl);
    const image = await loadImage(imageWithoutBackground);
    const imageWidth = image.naturalWidth || image.width;
    const imageHeight = image.naturalHeight || image.height;
    const padding = Math.max(40, Math.round(Math.max(imageWidth, imageHeight) * 0.08));
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");

    if (!context) {
      throw new Error("Could not create image editor");
    }

    canvas.width = imageWidth + padding * 2;
    canvas.height = imageHeight + padding * 2;
    context.shadowColor = "rgba(0, 0, 0, 0.35)";
    context.shadowBlur = padding * 0.7;
    context.shadowOffsetY = padding * 0.35;
    context.drawImage(image, padding, padding, imageWidth, imageHeight);

    return canvas.toDataURL("image/png");
  };

  const retouchImage = async (imageUrl: string) => {
    const image = await loadImage(imageUrl);
    const imageWidth = image.naturalWidth || image.width;
    const imageHeight = image.naturalHeight || image.height;
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");

    if (!context) {
      throw new Error("Could not create image editor");
    }

    canvas.width = imageWidth;
    canvas.height = imageHeight;
    context.filter = "brightness(1.06) contrast(1.08) saturate(1.14)";
    context.drawImage(image, 0, 0, imageWidth, imageHeight);

    return canvas.toDataURL("image/png");
  };

  const upscaleImage = async (imageUrl: string) => {
    const image = await loadImage(imageUrl);
    const imageWidth = image.naturalWidth || image.width;
    const imageHeight = image.naturalHeight || image.height;
    const maxSize = 2400;
    const scale = Math.max(1, Math.min(2, maxSize / Math.max(imageWidth, imageHeight)));
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");

    if (!context) {
      throw new Error("Could not create image editor");
    }

    canvas.width = Math.round(imageWidth * scale);
    canvas.height = Math.round(imageHeight * scale);
    context.imageSmoothingEnabled = true;
    context.imageSmoothingQuality = "high";
    context.drawImage(image, 0, 0, canvas.width, canvas.height);

    return canvas.toDataURL("image/png");
  };

  const applyImageEnhancement = (
    enhancement: EnhancementAction,
    imageUrl: string
  ) => {
    if (enhancement === "remove-bg") return removeLightBackground(imageUrl);
    if (enhancement === "drop-shadow") return addDropShadow(imageUrl);
    if (enhancement === "retouch") return retouchImage(imageUrl);

    return upscaleImage(imageUrl);
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
    const { register, control, setValue, handleSubmit, formState: { errors }, watch } = useForm<ProductFormData>({
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

    const router = useRouter();
    const [isChanged, ] = useState(true);
    const [openImageModal, setOpenImageModal] = useState(false);
    const [images, setImages] = useState<(string | null | UploadedImage)[]>([null]);
    const [selectedImage, setSelectedImage] = useState<string | null>(null);
    const [previewImage, setPreviewImage] = useState<string | null>(null);
    const [activeImageIndex, setActiveImageIndex] = useState<number | null>(null);
    const [selectedEnhancement, setSelectedEnhancement] = useState<EnhancementAction | null>(null);
    const [isEnhancing, setIsEnhancing] = useState(false);
    const [isApplyingEnhancement, setIsApplyingEnhancement] = useState(false);
    const [enhancementError, setEnhancementError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const applyEnhancedImageRef = useRef<ApplyEnhancedImage | null>(null);
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

  const onSubmit = async (data: ProductFormData) => {
  try {
    setLoading(true);

    const payload = {
      ...data,
      images: data.images.filter(isUploadedImage),
      short_description: data.shortDescription,
    };

    try {
      await axiosInstance.post("/api/v1/products/create-product", payload);
    } catch (error: any) {
      if (!isDuplicateSlugError(error)) {
        throw error;
      }

      await axiosInstance.post("/api/v1/products/create-product", {
        ...payload,
        slug: getUniqueRetrySlug(data.slug, data.title),
      });
    }

    router.push("/dashboard/all-products");
  } catch (error: any) {
    toast.error(error?.response?.data?.message || "Failed to create product");
  } finally {
    setLoading(false);
  }
};

    const handleSaveDraft = () => {
    };

    const handleOpenImageModal = (
      openImageModal: boolean,
      imageUrl?: string | null,
      imageIndex?: number,
      onApplyImage?: ApplyEnhancedImage
    ) => {
      setOpenImageModal(openImageModal);
      setSelectedImage(openImageModal ? imageUrl ?? null : null);
      setPreviewImage(openImageModal ? imageUrl ?? null : null);
      setActiveImageIndex(openImageModal ? imageIndex ?? null : null);
      setSelectedEnhancement(null);
      setEnhancementError(null);
      setIsEnhancing(false);
      setIsApplyingEnhancement(false);
      applyEnhancedImageRef.current = openImageModal ? onApplyImage ?? null : null;
    };

    const handleCloseImageModal = () => {
      setOpenImageModal(false);
      setSelectedImage(null);
      setPreviewImage(null);
      setActiveImageIndex(null);
      setSelectedEnhancement(null);
      setEnhancementError(null);
      setIsApplyingEnhancement(false);
      applyEnhancedImageRef.current = null;
    };

    const handleEnhancementClick = async (enhancement: EnhancementAction) => {
      if (!previewImage) return;

      setSelectedEnhancement(enhancement);
      setIsEnhancing(true);
      setEnhancementError(null);

      try {
        const enhancedImage = await applyImageEnhancement(
          enhancement,
          previewImage
        );
        setPreviewImage(enhancedImage);
      } catch (error) {
        console.log(error);
        setEnhancementError("This image could not be edited. Try another image.");
      } finally {
        setIsEnhancing(false);
      }
    };

    const handleResetEnhancement = () => {
      setPreviewImage(selectedImage);
      setSelectedEnhancement(null);
      setEnhancementError(null);
    };

    const handleApplyEnhancedImage = async () => {
      if (!previewImage || activeImageIndex === null) return;

      setIsApplyingEnhancement(true);
      setEnhancementError(null);

      try {
        const response = await axiosInstance.post(
          "/api/v1/products/upload-product-image",
          { fileName: previewImage }
        );
        const uploadedImage: UploadedImage = {
          fileId: response.data.fileId,
          file_url: response.data.file_url,
        };
        const updatedImages = [...images];
        const oldImage = updatedImages[activeImageIndex];

        updatedImages[activeImageIndex] = uploadedImage;

        setImages(updatedImages);
        setValue("images", updatedImages.filter(isUploadedImage));
        applyEnhancedImageRef.current?.(previewImage);

        if (oldImage && typeof oldImage === "object") {
          try {
            await axiosInstance.delete("/api/v1/products/delete-product-image", {
              data: {
                fileId: oldImage.fileId,
              },
            });
          } catch (error) {
            console.log(error);
          }
        }

        handleCloseImageModal();
      } catch (error) {
        console.log(error);
        setEnhancementError("The edited image could not be saved. Please try again.");
      } finally {
        setIsApplyingEnhancement(false);
      }
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

        const uploadedImage: UploadedImage = {
         fileId: response.data.fileId,
         file_url: response.data.file_url,
         };
        const updatedImages = [...images];
        updatedImages[index] = uploadedImage;

        if (index === images.length - 1 && updatedImages.length < 8) {
          updatedImages.push(null);
        }

        setImages(updatedImages);
        setValue("images", updatedImages.filter(isUploadedImage));
        } catch (error) {
        console.log(error);
        }};

    const handleRemoveImage = async (index: number) => {
      try {
    const updatedImages = [...images];
    const imageToDelete = updatedImages[index];

    if (imageToDelete && typeof imageToDelete === "object") {
      await axiosInstance.delete("/api/v1/products/delete-product-image", {
  data: {
    fileId: imageToDelete.fileId!,
    },
    });
    }

    updatedImages.splice(index, 1);

    // Add null placeholder
    if (!updatedImages.includes(null) && updatedImages.length < 8) {
    updatedImages.push(null);
    }

  setImages(updatedImages);
  setValue("images", updatedImages.filter(isUploadedImage));
}  catch (error) {
        console.log(error)
      }
    };

    return (
      <>
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
              setOpenImageModal={handleOpenImageModal}
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
                label="Short Description * (5-50 characters)"
                placeholder="Enter 5 to 50 characters"
                className="min-h-[120px] resize-y"
                {...register("shortDescription", {
                  required: "Short description is required",
                  validate: (value) => {
                    const length = String(value).trim().length;

                    if (length < 5) {
                      return "Short description must be at least 5 characters";
                    }

                    if (length > 50) {
                      return "Short description must be 50 characters or less";
                    }

                    return true;
                  },
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

         <Controller name="category" control={control} rules={{
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
    Detailed Description * <span className="text-blue-400">(Min 20 Characters)</span>
  </label>

  <Controller name="detailed_description"
    control={control}
    rules={{
      required: "Detailed description is required!",
      validate: (value) => {
        const text = String(value ?? "")
          .replace(/<[^>]*>/g, "")
          .replace(/&nbsp;/g, " ")
          .trim();

        return (
          text.length >= 20 ||
          "Description must be at least 20 characters!"
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
    disabled={isLoading || loading}
  >
    {isLoading || loading ? "Creating..." : "Create"}
</button>
</div>
      </form>
      {openImageModal && previewImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
          onClick={handleCloseImageModal}
        >
          <div
            className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-lg border border-slate-700 bg-slate-900 p-6 text-white shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mb-5 flex items-center justify-between">
              <h3 className="text-2xl font-semibold">
                Enhance Product Image
              </h3>

              <button
                type="button"
                onClick={handleCloseImageModal}
                className="rounded p-1 text-slate-300 transition-colors hover:bg-slate-800 hover:text-white"
                aria-label="Close image preview"
              >
                <X size={28} />
              </button>
            </div>

            <div className="flex h-[260px] items-center justify-center overflow-hidden rounded-md border border-slate-700 bg-slate-950 sm:h-[340px]">
              <img
                src={previewImage}
                alt="Selected product"
                className="h-full w-full object-contain"
              />
            </div>

            <div className="mt-6">
              <h4 className="mb-3 text-lg font-semibold">
                AI Enhancements
              </h4>

              {enhancementError && (
                <p className="mb-3 text-sm text-red-300">
                  {enhancementError}
                </p>
              )}

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {enhancementOptions.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => handleEnhancementClick(option.value)}
                    disabled={isEnhancing || isApplyingEnhancement}
                    className={`flex items-center gap-3 rounded-md px-4 py-4 text-left text-lg font-semibold transition-colors ${
                      selectedEnhancement === option.value
                        ? "bg-blue-600 text-white"
                        : "bg-slate-700 text-slate-100 hover:bg-slate-600"
                    } ${
                      isEnhancing || isApplyingEnhancement
                        ? "cursor-not-allowed opacity-60"
                        : ""
                    }`}
                  >
                    <WandSparkles size={22} />
                    <span>
                      {isEnhancing && selectedEnhancement === option.value
                        ? "Working..."
                        : option.label}
                    </span>
                  </button>
                ))}
              </div>

              <button
                type="button"
                onClick={handleResetEnhancement}
                disabled={
                  isEnhancing ||
                  isApplyingEnhancement ||
                  previewImage === selectedImage
                }
                className="mt-4 rounded-md bg-slate-800 px-4 py-2 text-sm font-semibold text-slate-200 transition-colors hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Reset Image
              </button>

              <button
                type="button"
                onClick={handleApplyEnhancedImage}
                disabled={
                  isEnhancing ||
                  isApplyingEnhancement ||
                  previewImage === selectedImage
                }
                className="ml-3 mt-4 rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isApplyingEnhancement ? "Applying..." : "Apply Image"}
              </button>
            </div>
          </div>
        </div>
      )}
      </>
    );
  };

  export default Page;
