import ProductCatalog from "@/components/products/ProductCatalog";

type ProductsPageProps = {
  searchParams?: Promise<{
    search?: string | string[];
    q?: string | string[];
  }>;
};

const getFirstParam = (value?: string | string[]) => {
  if (Array.isArray(value)) {
    return value[0] || "";
  }

  return value || "";
};

export default async function ProductsPage({ searchParams }: ProductsPageProps) {
  const resolvedSearchParams = await searchParams;
  const search =
    getFirstParam(resolvedSearchParams?.search) ||
    getFirstParam(resolvedSearchParams?.q);

  return <ProductCatalog initialSearch={search} />;
}
