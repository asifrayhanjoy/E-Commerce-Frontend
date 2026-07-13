import ShopCatalog from "@/components/shops/ShopCatalog";

type ShopsPageProps = {
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

export default async function ShopsPage({ searchParams }: ShopsPageProps) {
  const resolvedSearchParams = await searchParams;
  const search =
    getFirstParam(resolvedSearchParams?.search) ||
    getFirstParam(resolvedSearchParams?.q);

  return <ShopCatalog initialSearch={search} />;
}
