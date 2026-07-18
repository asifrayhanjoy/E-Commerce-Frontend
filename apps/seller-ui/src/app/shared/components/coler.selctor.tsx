"use client";

import { Controller } from "react-hook-form";

const colorOptions = [
  "#000000",
  "#ffffff",
  "#ef4444",
  "#f97316",
  "#facc15",
  "#22c55e",
  "#06b6d4",
  "#2563eb",
  "#7c3aed",
  "#ec4899",
];

const ColorSelector = ({ control, errors }: any) => {
  return (
    <div className="mt-2">
      <label className="mb-1 block font-semibold text-gray-300">Colors</label>

      <Controller
        name="colors"
        control={control}
        render={({ field }) => {
          const selectedColors = Array.isArray(field.value) ? field.value : [];

          return (
            <div className="flex flex-wrap gap-2">
              {colorOptions.map((color) => {
                const isSelected = selectedColors.includes(color);

                return (
                  <button
                    key={color}
                    type="button"
                    onClick={() =>
                      field.onChange(
                        isSelected
                          ? selectedColors.filter((item: string) => item !== color)
                          : [...selectedColors, color]
                      )
                    }
                    className={`h-9 w-9 rounded-full border transition duration-150 ${
                      isSelected
                        ? "border-white ring-2 ring-[#60a5fa]"
                        : "border-[#ffffff38]"
                    }`}
                    style={{ backgroundColor: color }}
                    aria-label={`Select ${color}`}
                  />
                );
              })}
            </div>
          );
        }}
      />

      {errors?.colors?.message && (
        <p className="mt-2 text-sm text-red-400">{errors.colors.message}</p>
      )}
    </div>
  );
};

export default ColorSelector;
