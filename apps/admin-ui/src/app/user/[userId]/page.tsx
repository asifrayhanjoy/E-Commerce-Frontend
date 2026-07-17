"use client";

import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import Link from "next/link";
import { useParams } from "next/navigation";

type AdminUserDetail = {
  id: string;
  image: string;
  name: string;
  email: string;
  orders: number;
  joined: string;
  updated: string;
};

const fetchUser = async (userId: string) => {
  const response = await axios.get<{ user: AdminUserDetail }>(
    `/api/admin/users/${encodeURIComponent(userId)}`,
    {
      withCredentials: true,
    }
  );

  return response.data.user;
};

const UserImage = ({ user }: { user: AdminUserDetail }) => {
  if (user.image) {
    return (
      <img
        src={user.image}
        alt={user.name}
        className="h-28 w-28 rounded-full object-cover"
      />
    );
  }

  return (
    <div className="flex h-28 w-28 items-center justify-center rounded-full bg-[#111729] text-[38px] font-semibold text-[#9aa3b9]">
      {user.name.slice(0, 1).toUpperCase()}
    </div>
  );
};

const DetailRow = ({ label, value }: { label: string; value: string | number }) => (
  <div className="rounded-md border border-[#141d31] bg-[#0b1020] px-4 py-3">
    <p className="text-[12px] font-semibold text-[#747b90]">{label}</p>
    <p className="mt-1 text-[15px] font-semibold text-[#e2e5ec]">{value || "-"}</p>
  </div>
);

const UserDetailPage = () => {
  const params = useParams<{ userId: string }>();
  const userId = params.userId;
  const { data: user, isLoading, isError } = useQuery({
    queryKey: ["admin-user", userId],
    queryFn: () => fetchUser(userId),
    enabled: Boolean(userId),
  });

  return (
    <main className="min-h-screen bg-black px-8 py-8 text-white">
      <div className="mb-7">
        <h1 className="text-[22px] font-semibold leading-7 text-[#f1f2f4]">
          User Details
        </h1>
        <div className="mt-3 flex items-center gap-2 text-[14px] font-semibold">
          <Link href="/dashboard" className="text-[#4f86ee]">
            Dashboard
          </Link>
          <span className="text-[#aeb3c0]">›</span>
          <Link href="/dashboard/users" className="text-[#4f86ee]">
            All Users
          </Link>
          <span className="text-[#aeb3c0]">›</span>
          <span className="text-[#d7d9df]">Details</span>
        </div>
      </div>

      {isLoading && (
        <div className="text-[15px] font-semibold text-[#aeb4c4]">
          Loading user...
        </div>
      )}

      {isError && (
        <div className="rounded-md border border-red-500/30 bg-red-500/10 px-4 py-3 text-[15px] font-semibold text-red-300">
          User could not be loaded.
        </div>
      )}

      {user && (
        <section className="max-w-[760px] rounded-lg border border-[#121a2d] bg-[#0b1020] p-6">
          <div className="flex items-center gap-5">
            <UserImage user={user} />
            <div>
              <h2 className="text-[26px] font-semibold text-[#f1f2f4]">
                {user.name}
              </h2>
              <p className="mt-2 text-[15px] font-semibold text-[#aeb4c4]">
                {user.email}
              </p>
            </div>
          </div>

          <div className="mt-7 grid grid-cols-3 gap-4">
            <DetailRow label="Orders" value={user.orders} />
            <DetailRow label="Joined" value={user.joined} />
            <DetailRow label="Updated" value={user.updated} />
          </div>
        </section>
      )}
    </main>
  );
};

export default UserDetailPage;
