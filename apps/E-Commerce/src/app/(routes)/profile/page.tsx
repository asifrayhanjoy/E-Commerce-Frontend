"use client";

import QuickActionCard from "@/contexts/QuickActionCard";
import useUser from "@/hooks/use.User";
import axiosInstance from "@/utils/axiosinstance";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  BadgeCheck,
  Bell,
  CheckCircle,
  Clock,
  Gift,
  Inbox,
  Loader2,
  Lock,
  LogOut,
  MapPin,
  Pencil,
  PhoneCall,
  Receipt,
  Settings,
  ShoppingBag,
  Truck,
  User,
  X,
  type LucideIcon,
} from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Suspense,
  useEffect,
  useState,
  type ChangeEvent,
  type FormEvent,
} from "react";

const orderStats = [
  { title: "Total Orders", count: 10, Icon: Clock },
  { title: "Processing Orders", count: 4, Icon: Truck },
  { title: "Completed Orders", count: 5, Icon: CheckCircle },
];

const emptyAddressForm = {
  label: "Home",
  name: "",
  street: "",
  city: "",
  zip: "",
  country: "Bangladesh",
  isDefault: "false",
};

type AddressForm = typeof emptyAddressForm;

type UserAddress = Omit<AddressForm, "isDefault"> & {
  id?: string;
  _id?: string;
  isDefault?: boolean;
};

const getAvatarUrl = (user: any) => {
  if (Array.isArray(user?.avatar)) {
    return user.avatar.find((image: { url?: string }) => image?.url)?.url;
  }

  return user?.avatar?.url;
};

const formatJoinedDate = (value?: string) => {
  if (!value) {
    return "N/A";
  }

  return new Date(value).toLocaleDateString("en-US");
};

const getErrorMessage = (error: any) =>
  error?.response?.data?.message ||
  error?.message ||
  "Something went wrong. Please try again.";

interface NavItemProps {
  label: string;
  Icon: LucideIcon;
  active?: boolean;
  danger?: boolean;
  onClick: () => void;
}

function NavItem({
  label,
  Icon,
  active = false,
  danger = false,
  onClick,
}: NavItemProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex w-full items-center gap-3 rounded-md px-4 py-3 text-left text-sm font-medium transition ${
        danger
          ? "text-red-600 hover:bg-red-50 hover:text-red-900"
          : active
          ? "bg-blue-50 text-blue-700"
          : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
      }`}
    >
      <Icon
        size={18}
        className={danger ? "text-red-500" : "text-blue-500"}
        aria-hidden="true"
      />
      {label}
    </button>
  );
}

function ProfilePageContent() {
  const { user, isLoading } = useUser();
  const searchParams = useSearchParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const queryTab = searchParams.get("active") || "Profile";
  const [activeTab, setActiveTab] = useState(queryTab);
  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);
  const [addressForm, setAddressForm] = useState(emptyAddressForm);

  const {
    data: savedAddresses = [],
    isLoading: isAddressLoading,
    isError: isAddressError,
    error: addressError,
  } = useQuery({
    queryKey: ["user-addresses"],
    enabled: Boolean(user && activeTab === "Shipping Address"),
    queryFn: async () => {
      const response = await axiosInstance.get("/api/v1/auth/addresses");

      return Array.isArray(response.data?.addresses)
        ? (response.data.addresses as UserAddress[])
        : [];
    },
    staleTime: 1000 * 60,
  });

  const createAddressMutation = useMutation({
    mutationFn: async (payload: AddressForm) => {
      const response = await axiosInstance.post("/api/v1/auth/addresses", {
        ...payload,
        isDefault: payload.isDefault === "true",
      });

      return response.data?.address;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["user-addresses"],
      });
      setAddressForm(emptyAddressForm);
      setIsAddressModalOpen(false);
    },
  });

  const openAddressModal = () => {
    createAddressMutation.reset();
    setAddressForm(emptyAddressForm);
    setIsAddressModalOpen(true);
  };

  const closeAddressModal = () => {
    if (createAddressMutation.isPending) {
      return;
    }

    createAddressMutation.reset();
    setAddressForm(emptyAddressForm);
    setIsAddressModalOpen(false);
  };

  useEffect(() => {
    if (activeTab !== queryTab) {
      const newParams = new URLSearchParams(searchParams);
      newParams.set("active", activeTab);
      router.replace(`/profile?${newParams.toString()}`);
    }
  }, [activeTab, queryTab, router, searchParams]);

  const logOutHandler = async () => {
    await axiosInstance.get("/api/logout-user").then(() => {
      queryClient.invalidateQueries({
        queryKey: ["user"],
      });

      router.push("/login");
    });
  };

  const handleAddressChange = (
    event: ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = event.target;

    setAddressForm((current) => ({
      ...current,
      [name]: value,
    }));
  };

  const handleAddressSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    createAddressMutation.mutate(addressForm);
  };

  return (
    <div className="bg-gray-50 p-6 pb-14">
      <div className="mx-auto max-w-[1488px]">
        <div className="mb-[54px] text-center text-2xl font-bold">
          <h1 className="text-[32px] font-bold leading-none text-gray-800">
            Welcome back,{" "}
            <span className="text-blue-600">
              {isLoading ? (
                <Loader2 className="inline h-5 w-5 animate-spin" />
              ) : (
                `${user?.name || "User"}`
              )}
            </span>{" "}
            👋
          </h1>
        </div>

        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 md:grid-cols-3">
          {orderStats.map(({ title, count, Icon }) => (
            <div
              key={title}
              className="flex min-h-[104px] items-center justify-between rounded bg-white px-6 py-6 shadow-sm"
            >
              <div>
                <p className="text-sm font-medium text-gray-400">{title}</p>
                <p className="mt-1 text-2xl font-bold leading-none text-gray-900">
                  {count}
                </p>
              </div>

              <Icon
                size={44}
                strokeWidth={1.8}
                className="text-blue-500"
                aria-hidden="true"
              />
            </div>
          ))}
        </div>
        <div className="mt-12 flex flex-col gap-7 md:flex-row">
          <div className="w-full rounded-md border border-gray-100 bg-white p-5 shadow-md md:w-[300px]">
            <nav className="space-y-2">
              <NavItem
                label="Profile"
                Icon={User}
                active={activeTab === "Profile"}
                onClick={() => setActiveTab("Profile")}
              />
              <NavItem
                label="My Orders"
                Icon={ShoppingBag}
                active={activeTab === "My Orders"}
                onClick={() => setActiveTab("My Orders")}
              />
              <NavItem
                label="Inbox"
                Icon={Inbox}
                active={activeTab === "Inbox"}
                onClick={() => setActiveTab("Inbox")}
              />
              <NavItem
                label="Notifications"
                Icon={Bell}
                active={activeTab === "Notifications"}
                onClick={() => setActiveTab("Notifications")}
              />
              <NavItem
                label="Shipping Address"
                Icon={MapPin}
                active={activeTab === "Shipping Address"}
                onClick={() => setActiveTab("Shipping Address")}
              />
              <NavItem
                label="Change Password"
                Icon={Lock}
                active={activeTab === "Change Password"}
                onClick={() => setActiveTab("Change Password")}
              />
              <NavItem
                label="Logout"
                Icon={LogOut}
                danger
                onClick={() => logOutHandler()}
              />
            </nav>
          </div>

          <div className="min-h-[386px] w-full rounded bg-white px-7 py-8 shadow-[0_2px_10px_rgba(15,23,42,0.12)] md:w-[820px] md:flex-none">
            {activeTab === "Profile" && !isLoading && user ? (
              <div className="flex flex-col gap-[26px]">
                <h2 className="text-[25px] font-bold leading-none text-gray-900">
                  Profile
                </h2>

                <div className="flex items-center gap-5">
                  <img
                    src={
                      getAvatarUrl(user) ||
                      `https://api.dicebear.com/8.x/personas/svg?seed=${encodeURIComponent(
                        user?.name || "User"
                      )}`
                    }
                    alt="Profile"
                    className="h-[74px] w-[74px] rounded-full object-cover"
                  />
                  <button
                    type="button"
                    className="flex cursor-pointer items-center gap-2 text-[14px] font-semibold text-blue-500"
                  >
                    <Pencil className="h-[17px] w-[17px]" />
                    Change Photo
                  </button>
                </div>

                <p className="text-[16px] leading-none text-gray-600">
                  <span className="font-bold text-gray-700">Name:</span>{" "}
                  {user.name || "User"}
                </p>
                <p className="text-[16px] leading-none text-gray-600">
                  <span className="font-bold text-gray-700">Email:</span>{" "}
                  {user.email || "N/A"}
                </p>
                <p className="text-[16px] leading-none text-gray-600">
                  <span className="font-bold text-gray-700">Joined:</span>{" "}
                  {formatJoinedDate(user.createdAt)}
                </p>
                <p className="text-[16px] leading-none text-gray-600">
                  <span className="font-bold text-gray-700">
                    Earned Points:
                  </span>{" "}
                  {user.points || 0}
                </p>
              </div>
            ) : activeTab === "Shipping Address" ? (
              <div>
                <h2 className="text-[25px] font-bold leading-none text-gray-900">
                  Shipping Address
                </h2>

                <div className="mt-8 flex items-center justify-between gap-4">
                  <h3 className="text-[21px] font-bold leading-none text-gray-900">
                    Saved Address:
                  </h3>
                  <button
                    type="button"
                    className="text-sm cursor-pointer font-bold text-blue-600"
                    onClick={openAddressModal}
                  >
                    Add New Address
                  </button>
                </div>

                <div className="mt-7 space-y-4">
                  {isAddressLoading ? (
                    <div className="rounded border border-gray-100 bg-gray-50 p-4 text-sm font-medium text-gray-500">
                      Loading saved addresses...
                    </div>
                  ) : isAddressError ? (
                    <div className="rounded border border-red-100 bg-red-50 p-4 text-sm font-medium text-red-600">
                      {getErrorMessage(addressError)}
                    </div>
                  ) : savedAddresses.length > 0 ? (
                    savedAddresses.map((address, index) => (
                      <div
                        key={address.id || address._id || index}
                        className="rounded border border-gray-100 bg-gray-50 p-4 text-sm font-medium text-gray-600"
                      >
                        <p className="font-bold text-gray-900">
                          {address.label}{" "}
                          {address.isDefault ? "(Default)" : ""}
                        </p>
                        <p className="mt-2">{address.name}</p>
                        <p className="mt-1">
                          {address.street}, {address.city}, {address.zip}
                        </p>
                        <p className="mt-1">{address.country}</p>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm font-medium text-gray-500">
                      No saved address found.
                    </p>
                  )}
                </div>
              </div>
            ) : (
              <h2 className="text-[26px] font-bold leading-none text-gray-900">
                {activeTab}
              </h2>
            )}
          </div>
          {/* Right Quick Panel */}
<div className="w-full md:w-1/4 space-y-4">
  <QuickActionCard 
  Icon={Gift}
  title="Referral Program"
  description="Invite friends and earn rewards."
/>
<QuickActionCard
  Icon={BadgeCheck}
  title="Your Badges"
  description="View your earned achievements."
/>

<QuickActionCard
  Icon={Settings}
  title="Account Settings"
  description="Manage preferences and security."
/>

<QuickActionCard
  Icon={Receipt}
  title="Billing History"
  description="Check your recent payments."
/>

<QuickActionCard
  Icon={PhoneCall}
  title="Support Center"
  description="Need help? Contact support."
/>
</div>
        </div>
      </div>

      {isAddressModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/35 px-4">
          <form
            onSubmit={handleAddressSubmit}
            className="relative w-full max-w-[520px] rounded-md bg-white px-7 pb-7 pt-8 shadow-xl"
          >
            <button
              type="button"
              aria-label="Close address modal"
              className="absolute right-4 top-4 text-gray-400 transition hover:text-gray-800"
              onClick={closeAddressModal}
            >
              <X size={22} />
            </button>

            <h2 className="mb-6 text-[22px] font-bold leading-none text-gray-900">
              Add New Address
            </h2>

            <div className="space-y-3">
              <select
                name="label"
                value={addressForm.label}
                onChange={handleAddressChange}
                disabled={createAddressMutation.isPending}
                className="h-[44px] w-full bg-mist-200 rounded border border-gray-200 bg-white px-4 text-sm font-semibold text-gray-700 outline-none focus:border-blue-400"
              >
                <option value="Home">Home</option>
                <option value="Office">Office</option>
              </select>
              <input
                name="name"
                value={addressForm.name}
                onChange={handleAddressChange}
                placeholder="Name"
                disabled={createAddressMutation.isPending}
                className="h-[44px] w-full bg-mist-100 rounded border border-gray-200 px-4 text-sm font-semibold text-gray-700 outline-none placeholder:text-gray-400 focus:border-blue-400"
              />
              <input
                name="street"
                value={addressForm.street}
                onChange={handleAddressChange}
                placeholder="Street"
                disabled={createAddressMutation.isPending}
                className="h-[44px] w-full bg-mist-100 rounded border border-gray-200 px-4 text-sm font-semibold text-gray-700 outline-none placeholder:text-gray-400 focus:border-blue-400"
              />
              <input
                name="city"
                value={addressForm.city}
                onChange={handleAddressChange}
                placeholder="City"
                disabled={createAddressMutation.isPending}
                className="h-[44px] w-full bg-mist-100 rounded border border-gray-200 px-4 text-sm font-semibold text-gray-700 outline-none placeholder:text-gray-400 focus:border-blue-400"
              />
              <input
                name="zip"
                value={addressForm.zip}
                onChange={handleAddressChange}
                placeholder="ZIP Code"
                disabled={createAddressMutation.isPending}
                className="h-[44px] w-full bg-mist-100 rounded border border-gray-200 px-4 text-sm font-semibold text-gray-700 outline-none placeholder:text-gray-400 focus:border-blue-400"
              />
              <select
                name="country"
                value={addressForm.country}
                onChange={handleAddressChange}
                disabled={createAddressMutation.isPending}
                className="h-[44px] w-full rounded border border-gray-500 bg-white px-4 text-sm font-semibold text-gray-700 outline-none focus:border-blue-400"
              >
                <option value="Bangladesh">Bangladesh</option>
                <option value="United States">United States</option>
              </select>
              <select
                name="isDefault"
                value={addressForm.isDefault}
                onChange={handleAddressChange}
                disabled={createAddressMutation.isPending}
                className="h-[44px] w-full rounded border border-gray-200 bg-white px-4 text-sm font-semibold text-gray-700 outline-none focus:border-blue-400"
              >
                <option value="false">Not Default</option>
                <option value="true">Default</option>
              </select>

              {createAddressMutation.isError && (
                <p className="text-sm font-medium text-red-600">
                  {getErrorMessage(createAddressMutation.error)}
                </p>
              )}

              <button
                type="submit"
                disabled={createAddressMutation.isPending}
                className="mt-2 h-[44px] w-full rounded bg-blue-600 text-sm font-bold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {createAddressMutation.isPending ? "Saving..." : "Save Address"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

function Page() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gray-50 p-6 pb-14">
          <div className="mx-auto max-w-7xl" />
        </div>
      }
    >
      <ProfilePageContent />
    </Suspense>
  );
}

export default Page;
