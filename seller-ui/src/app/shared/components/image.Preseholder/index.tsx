import { Pencil, WandSparkles, X } from "lucide-react";
import React, { useState } from "react";

const ImagePlaceHolder = ({
  size,
  small,
  onImageChange,
  onRemove,
  defaultImage = null,
  index = null,
  setOpenImageModal,
}: {
  size: string;
  small?: boolean;
  onImageChange: (file: File | null, index: number) => void;
  onRemove?: (index: number) => void;
  defaultImage?: string | null;
  setOpenImageModal: (openImageModal: boolean) => void;
  index?: any;
}) => {
  const [imagePreview, setImagePreview] = useState<string | null>(defaultImage);
  const inputId = `image-upload-${index}`;

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    if (file) {
      setImagePreview(URL.createObjectURL(file));
      onImageChange(file, index!);
    }
  };

  return (
    <div
      className={`relative ${
        small ? "h-[180px]" : "h-[450px]"
      } w-full cursor-pointer overflow-hidden rounded-lg border border-gray-600 bg-[#1e1e1e]`}
    >
      <input
        type="file"
        accept="image/*"
        className="hidden"
        id={inputId}
        onChange={handleFileChange}
      />

      {imagePreview ? (
        <>
          <button
            type="button"
            onClick={() => onRemove?.(index)}
            className="absolute right-3 top-3 z-10 bg-red-600 p-2 !rounded shadow-lg transition-all duration-200 hover:bg-red-700"
            aria-label="Remove image"
          >
            <X size={16} />
          </button>

          <button
            type="button"
            onClick={() => setOpenImageModal(true)}
            className="absolute right-[70px] top-3 z-10 bg-blue-500 p-2 !rounded shadow-lg transition-all duration-200 hover:bg-blue-600"
            aria-label="Edit image with AI"
          >
            <WandSparkles size={16} />
          </button>
        </>
      ) : (
        <label
          htmlFor={inputId}
          className="absolute right-3 top-3 z-10 cursor-pointer bg-slate-700 p-2 !rounded shadow-lg transition-all duration-200 hover:bg-slate-600"
          aria-label="Choose image"
        >
          <Pencil size={16} />
        </label>
      )}

      {imagePreview ? (
        <img
          width={400}
          height={300}
          src={imagePreview}
          alt="uploaded"
          className="h-full w-full rounded-lg object-cover"
        />
      ) : (
        <div className="flex h-full w-full flex-col items-center justify-center px-6 text-center">
          <p
            className={`text-gray-400 ${
              small ? "text-xl" : "text-4xl"
            } font-semibold leading-none`}
          >
            {size}
          </p>

          <p
            className={`pt-4 text-gray-500 ${
              small ? "text-sm" : "text-lg"
            } leading-relaxed`}
          >
            Please choose an image <br />
            according to the expected ratio
          </p>
        </div>
      )}
    </div>
  );
};

export default ImagePlaceHolder;
