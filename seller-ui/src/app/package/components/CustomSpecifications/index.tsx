import React from "react";
import { Controller, useFieldArray, FieldValues } from "react-hook-form";

import Input from "..";
import { PlusCircle, Trash2 } from "lucide-react";

const CustomSpecifications = ({ control, errors }: any) => {
  const { fields, append, remove } = useFieldArray({
    control,
    name: "custom_specifications",
  });

  return (
    <div>
      <label className="block font-semibold text-gray-300 mb-1">
        Custom
      </label>

      {fields.map((field: FieldValues, index: number) => (
        <div key={field.id} className="space-y-2 mb-4">
          <Controller
            control={control}
            name={`custom_specifications.${index}.name`}
            rules={{ required: "Specification name is required" }}
            defaultValue={field.name ?? ""}
            render={({ field }) => (
              <Input
                label="Specification Name"
                placeholder="e.g., Battery Life, Weight, Material"
                {...field}
              />
            )}
          />

          <Controller
            control={control}
            name={`custom_specifications.${index}.value`}
            rules={{ required: "Value is required" }}
            defaultValue={field.value ?? ""}
            render={({ field }) => (
              <Input
                label="Value"
                placeholder="e.g., 4000mAh, 1.5kg, Plastic"
                {...field}
              />
            )}
          />

          <button
            type="button"
            className="text-red-500 hover:text-red-700"
            onClick={() => remove(index)}
          >
            <Trash2 size={20} />
          </button>
        </div>
      ))}

      <button
        type="button"
        className="flex items-center gap-2 text-blue-500 hover:text-blue-600"
        onClick={() => append({ name: "", value: "" })}
      >
        <PlusCircle size={20} /> Add Specification
      </button>

      {errors?.custom_specifications && (
        <p className="text-red-500 text-xs mt-1">
          {errors.custom_specifications.message as string}
        </p>
      )}
    </div>
  );
};

export default CustomSpecifications;