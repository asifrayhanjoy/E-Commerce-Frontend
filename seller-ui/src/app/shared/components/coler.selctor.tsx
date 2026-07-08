import { useState } from "react";
import { Controller } from "react-hook-form";
import { Plus } from "lucide-react";

const defaultColors = [
  "#000000", // Black
  "#ffffff", // White
  "#ff0000", // Red
  "#00ff00", // Green
  "#0000ff", // Blue
  "#ffff00", // Yellow
  "#ff00ff", // Magenta
  "#00ffff", // Cyan
];

const normalizeColor = (color: string) => color.toLowerCase();

const ColorSelector = ({ control, errors }: any) => {
  const [customColors, setCustomColors] = useState<string[]>([]);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [newColor, setNewColor] = useState("#ffffff");

  return (
    <div className="mt-2">
      <label className="block font-semibold text-gray-300 mb-1">
        Colors
      </label>

      <Controller
        name="colors"
        control={control}
        defaultValue={[]}
        render={({ field }) => (
          <div className="flex gap-3 flex-wrap">
            {Array.from(
              new Set([...defaultColors, ...customColors].map(normalizeColor))
            ).map((color) => {
              const selectedColors = Array.isArray(field.value)
                ? field.value.map(normalizeColor)
                : [];
              const isSelected = selectedColors.includes(color);

              const isLightColor = ["#fff", "#ffffff"].includes(
                normalizeColor(color)
              );

              return (
                <button
                  type="button"
                  key={color}
                  onClick={() =>
                    field.onChange(
                      isSelected
                        ? selectedColors.filter((c: string) => c !== color)
                        : [...selectedColors, color]
                    )
                  }
                  className={`w-7 h-7 p-2 rounded-md my-1 flex items-center justify-center border-2 transition
                    ${
                      isSelected
                        ? "scale-110 border-white"
                        : "border-transparent"
                    }
                    ${isLightColor ? "border-gray-600" : ""}
                  `}
                  style={{ backgroundColor: color }}
                />
              );
            })}

            {/* Add Color Button */}
            <button
              type="button"
              onClick={() => setShowColorPicker(!showColorPicker)}
              className="w-8 h-8 flex items-center justify-center rounded-full border-2 border-dashed border-gray-500"
            >
              <Plus size={16} color="white" />
            </button>

            {/* Color Picker */}
            {showColorPicker && (
              <div className="relative flex items-center gap-2">
                <input
                  type="color"
                  value={newColor}
                  onChange={(e) => setNewColor(e.target.value)}
                  className="w-10 h-10 p-0 border-none cursor-pointer"
                />

                <button
                  type="button"
                  onClick={() => {
                    const normalizedColor = normalizeColor(newColor);

                    setCustomColors((colors) => {
                      const existingColors = new Set(
                        [...defaultColors, ...colors].map(normalizeColor)
                      );

                      return existingColors.has(normalizedColor)
                        ? colors
                        : [...colors, normalizedColor];
                    });
                    setShowColorPicker(false);
                  }}
                  className="px-3 py-1 bg-gray-700 text-white rounded-md text-sm"
                >
                  Add
                </button>
              </div>
            )}
          </div>
        )}
      />

      {errors?.colors && (
        <p className="text-red-500 text-sm mt-1">
          {errors.colors.message}
        </p>
      )}
    </div>
  );
};

export default ColorSelector;
