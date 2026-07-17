"use client";
import { useMemo, useState } from "react";
import { useReactTable,getCoreRowModel,getFilteredRowModel,flexRender,type ColumnDef, } from "@tanstack/react-table";
import { Search, Pencil, Trash, Eye, Plus, BarChart, Star, ChevronRight, } from "lucide-react";
import Link from "next/link";
import axiosInstance from "../../../../utils/axiosInstance";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import DeleteConfirmationModal from "@/app/shared/components/DeleteConfirmationModal/DeleteConfirmationModal";

type ProductImage = {
  url?: string;
  file_url?: string;
};

type Product = {
  id: string;
  title?: string;
  slug?: string;
  image?: string;
  images?: ProductImage[];
  sale_price?: number | string;
  stock?: number;
  ratings?: number;
  isDeleted?: boolean;
};

const fetchProducts = async () => {
  const res = await axiosInstance.get("/api/v1/products/get-shop-products");
  return res?.data?.products || [];
};

const restoreProduct = async (productId: string) => {
  await axiosInstance.put(
    `/api/v1/products/restore-product/${productId}`
  );
};

const getProductImage = (product: Product) =>
  product.images?.[0]?.url || product.images?.[0]?.file_url || product.image || "";


const deleteProduct = async (productId: string) => {
  await axiosInstance.delete(
    `/api/v1/products/delete-product/${productId}`
  );
};

function page() {

const [globalFilter, setGlobalFilter] = useState("");
const [showDeleteModal, setShowDeleteModal] = useState(false);
const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

const {
  data: products = [], isLoading, isError, } = useQuery<Product[]>({
  queryKey: ["shop-products"],
  queryFn: fetchProducts,
  staleTime: 1000 * 60 * 5,
});

// Delete Product Mutation
const queryClient = useQueryClient();
const deleteMutation = useMutation({
  mutationFn: deleteProduct,
  onSuccess: () => {
    queryClient.invalidateQueries({
      queryKey: ["shop-products"],
    });
    setShowDeleteModal(false);
    setSelectedProduct(null);
  },
});

// Restore Product Mutation
const restoreMutation = useMutation({
  mutationFn: restoreProduct,
  onSuccess: () => {
    queryClient.invalidateQueries({
      queryKey: ["shop-products"],
    });
    setShowDeleteModal(false);
    setSelectedProduct(null);
  },
});

const columns = useMemo<ColumnDef<Product>[]>(
  () => [
    {
      id: "image",
      header: "Image",
      enableGlobalFilter: false,
      cell: ({ row }) => {
        const imageUrl = getProductImage(row.original);
        const title = row.original.title || "Product image";

        return imageUrl ? (
          <img
            src={imageUrl}
            alt={title}
            className="h-12 w-12 rounded-md object-cover"
          />
        ) : (
          <div className="flex h-12 w-12 items-center justify-center rounded-md bg-gray-800 text-xs text-gray-400">
            No image
          </div>
        );
      },
    },
{
  accessorKey: "title",
  header: "Product Name",
  cell: ({ row }) => {
    const title = row.original.title || "Untitled Product";
    const truncatedTitle =
      title.length > 25
        ? `${title.substring(0, 25)}...`
        : title;

    return (
      <Link
        href={`${process.env.NEXT_PUBLIC_USER_UI_LINK || ""}/product/${row.original.slug || row.original.id}`}
        className="text-blue-400 hover:underline"
        title={title}
      >
        {truncatedTitle}
      </Link>
    );
  },
},

{
  accessorKey: "sale_price",
  header: "Price",
  cell: ({ row }) => (
    <span>${row.original.sale_price ?? 0}</span>
  ),
},

{
  accessorKey: "stock",
  header: "Stock",
  cell: ({ row }) => (
    <span
      className={(row.original.stock || 0) < 10 ? "text-red-500" : "text-white"}
    >
      {row.original.stock ?? 0} left
    </span>
  ),
},

{
  accessorKey: "ratings",
  header: "Rating",
  cell: ({ row }) => (
    <div className="flex items-center gap-1 text-yellow-400">
      <Star fill="#fde047" size={18} />
      <span className="text-white">
        {row.original.ratings || 5}
      </span>
    </div>
  ),
},
{
  header: "Actions",
  enableGlobalFilter: false,
  cell: ({ row }) => (
    <div className="flex gap-3">
      <Link
        href={`${process.env.NEXT_PUBLIC_USER_UI_LINK || ""}/product/${row.original.slug || row.original.id}`}
        className="text-blue-400 hover:text-blue-300 transition"
        title="View product"
      >
        <Eye size={18} />
      </Link>

      <Link
        href={`/product/edit/${row.original.id}`}
        className="text-yellow-400 hover:text-yellow-300 transition"
        title="Edit product"
      >
        <Pencil size={18} />
      </Link>

      <button
        className="text-green-400 hover:text-green-300 transition"
        title="Product analytics"
      >
        <BarChart size={18} />
      </button>

      <button
        className="text-red-400 hover:text-red-300 transition"
        title="Delete product"
        onClick={() => openDeleteModal(row.original)}
      >
        <Trash size={18} />
      </button>
    </div>
  ),
},
  ],
  [],
);

const table = useReactTable({
  data: products,
  columns,
  getCoreRowModel: getCoreRowModel(),
  getFilteredRowModel: getFilteredRowModel(),
  globalFilterFn: "includesString",
  state: { globalFilter },
  onGlobalFilterChange: setGlobalFilter,
});

const closeDeleteModal = () => {
  setShowDeleteModal(false);
  setSelectedProduct(null);
};

const openDeleteModal = (product: Product) => {
  setSelectedProduct(product);
  setShowDeleteModal(true);
};
  return (
    <div className="w-full min-h-screen p-12 text-white">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-2xl font-semibold font-Poppins text-white">
          All Products
        </h2>

        <Link
          href="/dashboard/create-product"
          className="text-white px-4 py-2 cursor-pointer hover:text-amber-100 bg-blue-600 transition rounded-lg flex items-center gap-2"
        >
          <Plus size={20} />
          Add Product
        </Link>
      </div>

      <div className="flex items-center">
        <Link href={"/"} className="text-[#80Deea] cursor-pointer">
          Dashboard
        </Link>
        <ChevronRight size={20} className="opacity-[.8]" />
        <span>All Products</span>
      </div>

      {/* Search Bar */}
<div className="mb-4 flex items-center mt-4 bg-gray-900 p-2 rounded-md flex-1">
  <Search size={18} className="text-gray-400 mr-2" />

  <input
    type="text"
    placeholder="Search products..."
    className="w-full bg-transparent text-white outline-none"
    value={globalFilter}
    onChange={(e) => setGlobalFilter(e.target.value)}
  />
</div>

{/* Table */}
<div className="overflow-x-auto bg-gray-900 rounded-lg p-4">
  {isLoading ? (
    <p className="text-center text-white">Loading products...</p>
  ) : isError ? (
    <p className="text-center text-red-400">Failed to load products.</p>
  ) : table.getRowModel().rows.length === 0 ? (
    <p className="text-center text-gray-400">No products found.</p>
  ) : (
    <table className="w-full text-white">
      <thead>
        {table.getHeaderGroups().map((headerGroup) => (
          <tr
            key={headerGroup.id}
            className="border-b border-gray-800"
          >
            {headerGroup.headers.map((header) => (
              <th key={header.id} className="p-3 text-left">
                {header.isPlaceholder
                  ? null
                  : flexRender(
                      header.column.columnDef.header,
                      header.getContext()
                    )}
              </th>
            ))}
          </tr>
        ))}
      </thead>

      <tbody>
        {table.getRowModel().rows.map((row) => (
          <tr
            key={row.id}
            className="border-b border-gray-800 hover:bg-gray-900 transition"
          >
            {row.getVisibleCells().map((cell) => (
              <td key={cell.id} className="p-3">
                {flexRender(
                  cell.column.columnDef.cell,
                  cell.getContext()
                )}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  )}
  {showDeleteModal && selectedProduct && (
  <DeleteConfirmationModal 
  product={selectedProduct}
	onClose={closeDeleteModal}
	onConfirm={() => deleteMutation.mutate(selectedProduct.id)}
	onRestore={() => restoreMutation.mutate(selectedProduct.id)}
// 
 />
)}
</div>
    </div>
  );
}

export default page;
