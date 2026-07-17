import React, { useEffect, useState } from "react";
import { Controller } from "react-hook-form";
import { Plus, X } from "lucide-react";

type Property = {
  label: string;
  values: string[];
};

interface Props {
  control: any;
  errors: any;
}

const CustomProperties = ({ control, errors }: Props) => {
  const [properties, setProperties] = useState<Property[]>([]);
  const [newLabel, setNewLabel] = useState("");
  const [newValue, setNewValue] = useState("");

  const addProperty = () => {
    if (!newLabel.trim()) return;

    setProperties([
      ...properties,
      {
        label: newLabel,
        values: [],
      },
    ]);

    setNewLabel("");
  };

  const addValue = (index: number) => {
    if (!newValue.trim()) return;

    const updated = [...properties];
    updated[index].values.push(newValue);

    setProperties(updated);
    setNewValue("");
  };

  const removeProperty = (index: number) => {
    setProperties(properties.filter((_, i) => i !== index));
  };

  return (
    <div className="mt-4">
      <Controller
        name="customProperties"
        control={control}
        render={({ field }) => {
          useEffect(() => {
            field.onChange(properties);
          }, [properties]);

          return (
            <>
              {properties.map((property, index) => (
                <div
                  key={index}
                  className="border rounded-lg p-4 mb-4 bg-gray-900 border-gray-700"
                >
                  <div className="flex justify-between items-center">
                    <h3 className="text-white font-semibold">
                      {property.label}
                    </h3>

                    <button
                      type="button"
                      onClick={() => removeProperty(index)}
                    >
                      <X size={18} className="text-red-500" />
                    </button>
                  </div>

                  <div className="flex flex-wrap gap-2 mt-3">
                    {property.values.map((value, i) => (
                      <span
                        key={i}
                        className="bg-gray-700 text-white px-2 py-1 rounded"
                      >
                        {value}
                      </span>
                    ))}
                  </div>

                  <div className="flex gap-2 mt-3">
                    <input
                      className="border rounded px-2 py-2 flex-1 bg-gray-800 text-white"
                      placeholder="Enter value..."
                      value={newValue}
                      onChange={(e) => setNewValue(e.target.value)}
                    />

                    <button
                      type="button"
                      onClick={() => addValue(index)}
                      className="bg-blue-600 text-white px-4 rounded"
                    >
                      Add
                    </button>
                  </div>
                </div>
              ))}

              <div className="flex gap-2 mt-4">
                <input
                  className="border rounded px-2 py-2 flex-1 bg-gray-800 text-white"
                  placeholder="Property Name (Material, Warranty...)"
                  value={newLabel}
                  onChange={(e) => setNewLabel(e.target.value)}
                />

                <button
                  type="button"
                  onClick={addProperty}
                  className="bg-blue-600 text-white px-4 rounded flex items-center gap-2"
                >
                  <Plus size={16} />
                  Add
                </button>
              </div>

              {errors?.customProperties && (
                <p className="text-red-500 text-sm mt-2">
                  {errors.customProperties.message}
                </p>
              )}
            </>
          );
        }}
      />
    </div>
  );
};

export default CustomProperties;