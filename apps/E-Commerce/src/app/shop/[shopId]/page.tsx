import ShopDetails from "@/components/shops/ShopDetails";

type ShopDetailsPageProps = {
  params?: Promise<{
    shopId?: string;
  }>;
};

export default async function ShopDetailsPage({
  params,
}: ShopDetailsPageProps) {
  const resolvedParams = await params;

  return <ShopDetails shopId={resolvedParams?.shopId || ""} />;
}
