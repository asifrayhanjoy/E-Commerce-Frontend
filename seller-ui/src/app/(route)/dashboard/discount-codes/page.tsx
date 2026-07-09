"use client";

import axiosInstance from "@/utils/axiosInstance";
import { toast } from "react-hot-toast";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ChevronRight, Plus, Trash, X } from "lucide-react";
import Link from "next/link";
import React, { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import Input from "@/app/package/components";
import { AxiosError } from "axios";

const Page = () => {
  const [showModal, setShowModal] = useState(false);
  const [discountToDelete, setDiscountToDelete] = useState<any>(null);
  const [isDeletingDiscount, setIsDeletingDiscount] = useState(false);
  const queryClient = useQueryClient();

  const { data: discountCodes = [], isLoading } = useQuery({
  queryKey: ["shop-discounts"],
  queryFn: async () => {
    const res = await axiosInstance.get("/api/v1/products/get-discount-codes");
    return res?.data?.discount_codes || [];
  },
});

const {
  register,
  handleSubmit,
  control,
  reset,
  formState: { errors },
} = useForm({
  defaultValues: {
    public_name: "",
    discountType: "percentage",
    discountValue: "",
    discountCode: "",
  },
});

// Creates a new discount code from the modal form.
const createDiscountCodeMutation = useMutation({
  mutationFn: async (data) => {
    await axiosInstance.post("/api/v1/products/create-discount-code", data);
  },

  onSuccess: () => {
    queryClient.invalidateQueries({
      queryKey: ["shop-discounts"],
    });
    reset();
    setShowModal(false);
  },
});

// Opens the delete confirmation card for the selected discount code.
const handleDeleteClick = (discount:any) => {
  if (!discount?.id) return;

  setDiscountToDelete(discount);
};

const handleCancelDelete = () => {
  setDiscountToDelete(null);
};

// Deletes the selected discount code only after the seller confirms.
const handleConfirmDelete = async () => {
  if (!discountToDelete?.id) return;

  setIsDeletingDiscount(true);
  try {
    await axiosInstance.delete(`/api/v1/products/delete-discount-code/${discountToDelete.id}`);
    queryClient.invalidateQueries({
      queryKey: ["shop-discounts"],
    });
    setDiscountToDelete(null);
  } catch (error) {
    toast.error(
      (error as AxiosError<{ message: string }>)?.response?.data?.message ||
        "Failed to delete discount code."
    );
  } finally {
    setIsDeletingDiscount(false);
  }
};

const onSubmit = (data: any) => {
  if (discountCodes.length >= 8) {
    toast.error("You can only create up to 8 discount codes.");
    return;
  }
  createDiscountCodeMutation.mutate(data)
};

  return (
    <div className="w-full min-h-screen p-12">
      <div className="flex justify-between items-center mb-2">
        <h2 className="text-2xl font-bold text-white"> Discount Codes </h2>

        <button
          className="text-[#80Deea] text-white px-4 py-2 cursor-pointer hover:text-amber-100 bg-blue-600 transition rounded-lg flex items-center gap-2"
          onClick={() => setShowModal(true)}
        >
          <Plus size={20} />
          Create Discount
        </button>
      </div>
      <div className="flex items-center text-white">
        <Link href={"/"} className="text-[#80Deea] cursor-pointer">Dashboard</Link>
        <ChevronRight size={20} className="opacity-[.8]" />
        <span>Discount Codes</span>
      </div>

      <div className="mt-8 bg-gray-900 p-6 rounded-lg shadow-lg">
  <h3 className="text-lg font-semibold text-white mb-4">
    Your Discount Codes
  </h3>
  {isLoading ? (
  <p className="text-gray-400 text-center">
    Loading discounts...
  </p>
) : (
  <table className="w-full table-fixed text-white">
    <thead>
      <tr className="border-b border-gray-800">
  <th className="p-3 text-left">Title</th>
  <th className="p-3 text-left">Type</th>
  <th className="p-3 text-left">Value</th>
  <th className="p-3 text-left">Code</th>
  <th className="p-3 text-left">Actions</th>
</tr>
    </thead>
    <tbody>
  {discountCodes?.length === 0 ? (
    <tr>
      <td
        colSpan={5}
        className="p-4 text-center align-middle text-gray-400"
      >
        No Discount Codes Available!
      </td>
    </tr>
  ) : (
    discountCodes?.map((discount: any) => (
      <tr
        key={discount?.id}
        className="border-b border-gray-800 hover:bg-gray-800 transition"
      >
        <td className="p-3">{discount?.public_name}</td>
        <td className="p-3 capitalize">
          {discount.discountType === "percentage"
            ? "Percentage (%)"
            : "Flat ($)"}
        </td>
        <td className="p-3">{discount.discountValue}</td>
        <td className="p-3">{discount.discountCode}</td>
        <td className="p-3">
          <button
            onClick={() => handleDeleteClick(discount)}
            className="text-red-400 hover:text-red-300 transition"
          >
            <Trash size={18} />
          </button>
        </td>
      </tr>
    ))
  )}
</tbody>
  </table>
)}
</div>

{/* Create Discount modal */}
{showModal && (
  <div className="fixed top-0 left-0 w-full h-full bg-black bg-opacity-50 flex items-center justify-center z-50">
    <div className="bg-gray-800 p-6 rounded-lg w-[450px] shadow-lg">
      <div className="flex justify-between items-center border-b border-gray-700 pb-3">
        <h3 className="text-xl font-semibold  text-white">
          Create Discount Code
        </h3>

        <button
          onClick={() => setShowModal(false)}
          className="text-gray-400 hover:text-white transition"
        >
          <X size={22} />
        </button>
      </div>
      <form
  onSubmit={handleSubmit(onSubmit)}
  className="mt-4"
>

  <div>
{/* Title */}
<Input label="Title (Public Name)"
  {...register("public_name", {
    required: "Title is required",
  })}
/>

{errors.public_name && (
  <p className="text-red-500 text-xs mt-1">
    {errors.public_name.message}
  </p>
)}
</div>

<div className="mt-2 border-amber-50">
  <label className="block border-amber-50 font-semibold text-gray-300 mb-1">
    Discount Type
  </label>

  <Controller
    control={control}
    name="discountType"
    render={({ field }) => (
      <select
        {...field}
        className="w-full border outline-none border-amber-50 text-gray-300 bg-transparent rounded-lg p-3"
      >
        <option value="percentage">Percentage (%)</option>
        <option value="flat">Flat Amount ($)</option>
      </select>
    )}
  />
</div>

{/* Discount Value */}
<div className="mt-2">
  <Input
    label="Discount Value"
    type="number"
    min={1}
    {...register("discountValue", {
      required: "Value is required",
    })}
  />
</div>

<div className="mt-2">
  {/* Discount Code */}
  <Input
    label="Discount Code"
    {...register("discountCode", {
      required: "Discount Code is required",
    })}
  />
</div>

<button
  type="submit"
  disabled={createDiscountCodeMutation.isPending}
  className="mt-6 w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg flex items-center justify-center gap-2 transition cursor-pointer"
>
  <Plus size={18} />
  {createDiscountCodeMutation?.isPending ? "Create..." : "Create"}
</button>

{createDiscountCodeMutation.isError && (
  <p className="text-red-500 text-sm mt-2">
    {(
      createDiscountCodeMutation.error as AxiosError<{
        message: string;
      }>
    )?.response?.data?.message || "Something went wrong"}
  </p>
)}

</form>
    </div>
  </div>
)}

{/* Delete Discount confirmation modal */}
{discountToDelete && (
  <div className="fixed top-0 left-0 w-full h-full bg-black bg-opacity-50 flex items-center justify-center z-50">
    <div className="bg-gray-800 p-6 rounded-lg w-[450px] shadow-lg">
      <div className="flex justify-between items-center border-b border-gray-700 pb-3">
        <h3 className="text-xl font-semibold text-white">
          Delete Discount Code
        </h3>

        <button
          type="button"
          onClick={handleCancelDelete}
          disabled={isDeletingDiscount}
          className="text-gray-400 hover:text-white transition disabled:opacity-50"
        >
          <X size={22} />
        </button>
      </div>

      <p className="text-gray-300 mt-6 text-base leading-7">
        Are you sure you want to delete{" "}
        <span className="font-semibold text-white">
          {discountToDelete?.public_name || discountToDelete?.discountCode}
        </span>
        ? This action cannot be undone.
      </p>

      <div className="flex justify-end gap-4 mt-8">
        <button
          type="button"
          onClick={handleCancelDelete}
          disabled={isDeletingDiscount}
          className="px-6 py-2 rounded-lg bg-gray-700 hover:bg-gray-600 text-white transition disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={handleConfirmDelete}
          disabled={isDeletingDiscount}
          className="px-6 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white transition disabled:opacity-50"
        >
          {isDeletingDiscount ? "Deleting..." : "Delete"}
        </button>
      </div>
    </div>
  </div>
)}
    </div>
  );
};

export default Page;
