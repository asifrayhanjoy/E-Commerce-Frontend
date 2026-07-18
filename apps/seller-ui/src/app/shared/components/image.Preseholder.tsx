"use client";

import { useRef, useState } from "react";
import type { ChangeEvent } from "react";

type ImagePlaceHolderProps = {
  index: number;
  size?: string;
  small?: boolean;
  setOpenImageModal?: (
    open: boolean,
    imageUrl?: string | null,
    imageIndex?: number,
    onApplyImage?: (imageUrl: string) => void
  ) => void;
  onImageChange?: (file: File | null, index: number) => void | Promise<void>;
  onRemove?: (index: number) => void | Promise<void>;
};

const ImagePlaceHolder = ({
  index,
  size = "Upload image",
  small = false,
  setOpenImageModal,
  onImageChange,
  onRemove,
}: ImagePlaceHolderProps) => {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const handleSelectImage = () => {
    inputRef.current?.click();
  };

  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null;

    if (!file) {
      return;
    }

    const nextPreviewUrl = URL.createObjectURL(file);
    setPreviewUrl(nextPreviewUrl);
    await onImageChange?.(file, index);
    event.target.value = "";
  };

  const handleRemove = async () => {
    setPreviewUrl(null);
    await onRemove?.(index);
  };

  const handleOpenEditor = () => {
    if (!previewUrl) {
      return;
    }

    setOpenImageModal?.(true, previewUrl, index, setPreviewUrl);
  };

  return (
    <div
      className={`relative flex w-full flex-col items-center justify-center rounded-lg border border-dashed border-[#26324a] bg-[#080d18] p-4 text-center text-white ${
        small ? "min-h-[180px]" : "min-h-[320px]"
      }`}
    >
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
      />

      {previewUrl ? (
        <>
          <img
            src={previewUrl}
            alt="Product preview"
            className="h-full max-h-[280px] w-full rounded-md object-contain"
          />
          <div className="mt-4 flex flex-wrap justify-center gap-2">
            <button
              type="button"
              onClick={handleSelectImage}
              className="rounded-md bg-[#1d4ed8] px-4 py-2 text-sm font-semibold text-white transition duration-150 hover:bg-[#2563eb]"
            >
              Change
            </button>
            <button
              type="button"
              onClick={handleOpenEditor}
              className="rounded-md bg-[#111827] px-4 py-2 text-sm font-semibold text-[#dbe3f5] transition duration-150 hover:bg-[#1f2937]"
            >
              Edit
            </button>
            <button
              type="button"
              onClick={handleRemove}
              className="rounded-md bg-[#351217] px-4 py-2 text-sm font-semibold text-[#ff8a93] transition duration-150 hover:bg-[#451820]"
            >
              Remove
            </button>
          </div>
        </>
      ) : (
        <button
          type="button"
          onClick={handleSelectImage}
          className="flex h-full min-h-[220px] w-full flex-col items-center justify-center rounded-md border border-[#17213a] bg-[#0b1120] px-4 transition duration-150 hover:border-[#315aa7] hover:bg-[#10182d]"
        >
          <span className="text-[32px] font-light text-[#7f8ba3]">+</span>
          <span className="mt-2 text-[14px] font-semibold text-[#c3cada]">
            Upload Image
          </span>
          <span className="mt-1 text-[12px] font-semibold text-[#747d92]">
            {size}
          </span>
        </button>
      )}
    </div>
  );
};

export default ImagePlaceHolder;
