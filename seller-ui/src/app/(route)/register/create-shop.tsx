"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";

const shopCategories = [
  "Electronics",
  "Fashion",
  "Grocery",
  "Health & Beauty",
  "Home & Garden",
  "Sports & Outdoors",
  "Toys & Games",
  "Books & Media",
  "Automotive",
  "Jewelry & Accessories",
  "Pet Supplies",
  "Baby & Kids",
  "Furniture",
  "Office Supplies",
  "Arts & Crafts",
  "Music & Instruments",
  "Food & Beverages",
  "Mobile & Accessories",
  "Computers & Laptops",
  "Other",
];

type ShopFormData = {
  name: string;
  bio: string;
  address: string;
  opening_hours: string;
  website?: string;
  category: string;
};

const CreateShop = ({
  sellerId,
  setActiveStep,
}: {
  sellerId: string;
  setActiveStep: (step: number) => void;
}) => {
  const [serverError, setServerError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ShopFormData>();

  const onSubmit = async (data: ShopFormData) => {
    setServerError(null);
    setLoading(true);
    try {
      const res = await fetch("http://localhost:8080/api/v1/auth/create-shop", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          name: data.name,
          bio: data.bio,
          address: data.address,
          opening_hours: data.opening_hours,
          website: data.website,
          category: data.category,
          sellerId,
        }),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.message || "Failed to create shop");
      setActiveStep(3);
    } catch (err: unknown) {
      setServerError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <form onSubmit={handleSubmit(onSubmit)}>
        <h3 className="text-2xl font-semibold text-center mb-4">
          Setup new shop
        </h3>

        {serverError && (
          <p className="text-red-500 text-sm text-center mb-3">{serverError}</p>
        )}

        <label className="block text-gray-700 mb-1">Shop Name</label>
        <input
          type="text"
          placeholder="Enter your shop name"
          className="w-full px-4 py-3 bg-blue-50 border border-blue-100 rounded-lg outline-none focus:border-blue-400 transition-colors text-gray-800 mb-1"
          {...register("name", {
            required: "Shop name is required",
            minLength: { value: 2, message: "Shop name must be at least 2 characters" },
          })}
        />
        {errors.name && (
          <p className="text-red-500 text-sm mb-2">{String(errors.name.message)}</p>
        )}

        <label className="block text-gray-700 mt-3 mb-1">Bio</label>
        <input
          type="text"
          placeholder="Tell customers about your shop"
          className="w-full px-4 py-3 bg-blue-50 border border-blue-100 rounded-lg outline-none focus:border-blue-400 transition-colors text-gray-800 mb-1"
          {...register("bio", {
            required: "Bio is required",
          })}
        />
        {errors.bio && (
          <p className="text-red-500 text-sm mb-2">{String(errors.bio.message)}</p>
        )}

        <label className="block text-gray-700 mt-3 mb-1">Address</label>
        <input
          type="text"
          placeholder="Enter your shop address"
          className="w-full px-4 py-3 bg-blue-50 border border-blue-100 rounded-lg outline-none focus:border-blue-400 transition-colors text-gray-800 mb-1"
          {...register("address", {
            required: "Address is required",
          })}
        />
        {errors.address && (
          <p className="text-red-500 text-sm mb-2">{String(errors.address.message)}</p>
        )}

        <label className="block text-gray-700 mt-3 mb-1">Opening Hours</label>
        <input
          type="text"
          placeholder="e.g. Mon-Sat 9am - 8pm"
          className="w-full px-4 py-3 bg-blue-50 border border-blue-100 rounded-lg outline-none focus:border-blue-400 transition-colors text-gray-800 mb-1"
          {...register("opening_hours", {
            required: "Opening hours are required",
          })}
        />
        {errors.opening_hours && (
          <p className="text-red-500 text-sm mb-2">{String(errors.opening_hours.message)}</p>
        )}

        <label className="block text-gray-700 mt-3 mb-1">Website (optional)</label>
        <input
          type="text"
          placeholder="https://yourshop.com"
          className="w-full px-4 py-3 bg-blue-50 border border-blue-100 rounded-lg outline-none focus:border-blue-400 transition-colors text-gray-800 mb-1"
          {...register("website")}
        />

        <label className="block text-gray-700 mt-3 mb-1">Category</label>
        <select
          defaultValue=""
          className="w-full px-4 py-3 bg-blue-50 border border-blue-100 rounded-lg outline-none focus:border-blue-400 transition-colors text-gray-800 mb-1"
          {...register("category", {
            required: "Category is required",
          })}
        >
          <option value="" disabled>
            Select a category
          </option>
          {shopCategories.map((category) => (
            <option key={category} value={category}>
              {category}
            </option>
          ))}
        </select>
        {errors.category && (
          <p className="text-red-500 text-sm mb-2">{String(errors.category.message)}</p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-black text-white py-3 rounded-lg text-lg mt-5 cursor-pointer hover:bg-gray-900 transition-colors disabled:opacity-60"
        >
          {loading ? "Creating Shop..." : "Create Shop"}
        </button>
      </form>
    </div>
  );
};

export default CreateShop;
