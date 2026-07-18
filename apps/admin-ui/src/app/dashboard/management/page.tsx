"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import axios, { AxiosError } from "axios";
import Link from "next/link";
import { useState } from "react";
import type { FormEvent } from "react";

type TeamAdmin = {
  id: string;
  name: string;
  email: string;
  role: string;
};

type ManagementResponse = {
  admins: TeamAdmin[];
};

type CreateAdminResponse = {
  success: boolean;
  admin?: TeamAdmin;
  message?: string;
};

type AddAdminForm = {
  email: string;
  password: string;
};

const initialForm: AddAdminForm = {
  email: "",
  password: "",
};

const fetchAdmins = async () => {
  const response = await axios.get<ManagementResponse>(
    "/api/admin/management",
    {
      withCredentials: true,
    }
  );

  return response.data;
};

const createAdmin = async (form: AddAdminForm) => {
  const response = await axios.post<CreateAdminResponse>(
    "/api/admin/management",
    form,
    {
      withCredentials: true,
    }
  );

  return response.data;
};

const getErrorMessage = (error: AxiosError<{ message?: string }>) =>
  error.response?.data?.message || error.message || "Unable to create admin.";

const ManagementPage = () => {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form, setForm] = useState<AddAdminForm>(initialForm);
  const [serverError, setServerError] = useState<string | null>(null);
  const { data, isLoading } = useQuery({
    queryKey: ["admin-management"],
    queryFn: fetchAdmins,
  });
  const admins = data?.admins || [];
  const createAdminMutation = useMutation({
    mutationFn: createAdmin,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-management"] });
      setForm(initialForm);
      setServerError(null);
      setIsModalOpen(false);
    },
    onError: (error: AxiosError<{ message?: string }>) => {
      setServerError(getErrorMessage(error));
    },
  });

  const openModal = () => {
    setServerError(null);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    if (createAdminMutation.isPending) {
      return;
    }

    setForm(initialForm);
    setServerError(null);
    setIsModalOpen(false);
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setServerError(null);
    createAdminMutation.mutate(form);
  };

  return (
    <div className="min-h-screen bg-black px-8 py-[44px] text-white">
      <div className="mb-5 flex items-start justify-between gap-5">
        <div>
          <h1 className="text-[23px] font-semibold leading-8 text-[#f2f3f5]">
            Team Management
          </h1>
          <div className="mt-3 flex items-center gap-2 text-[14px] font-semibold">
            <Link href="/dashboard" className="text-[#4f73d9]">
              Dashboard
            </Link>
            <span className="text-[#aeb3c0]">&gt;</span>
            <span className="text-[#d7d9df]">Team Management</span>
          </div>
        </div>

        <button
          type="button"
          onClick={openModal}
          className="mt-1 h-11 rounded-full bg-[#2457df] px-6 text-[14px] font-semibold text-white shadow-[0_0_0_1px_rgba(102,140,255,0.22)] transition duration-150 hover:bg-[#3266ee]"
        >
          Add Admin
        </button>
      </div>

      <div className="overflow-hidden rounded-md border border-[#11172b] bg-black">
        <table className="w-full border-collapse text-left text-[14px] font-semibold">
          <thead>
            <tr className="h-[52px] bg-[#0b1122] text-[#cfd3df]">
              <th className="w-[34%] px-4">Name</th>
              <th className="w-[50%] px-4">Email</th>
              <th className="px-4">Role</th>
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              <tr className="h-[53px] border-t border-[#11172b] text-[#979dad]">
                <td className="px-4" colSpan={3}>
                  Loading admins...
                </td>
              </tr>
            )}

            {!isLoading && admins.length === 0 && (
              <tr className="h-[53px] border-t border-[#11172b] text-[#979dad]">
                <td className="px-4" colSpan={3}>
                  No admins found.
                </td>
              </tr>
            )}

            {!isLoading &&
              admins.map((admin) => (
                <tr
                  key={admin.id || admin.email}
                  className="h-[53px] border-t border-[#11172b] text-[#b8bcc8]"
                >
                  <td className="px-4">{admin.name || "Admin"}</td>
                  <td className="px-4">{admin.email}</td>
                  <td className="px-4">{admin.role || "admin"}</td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 px-4">
          <form
            onSubmit={handleSubmit}
            className="w-full max-w-[430px] rounded-lg border border-[#17203a] bg-[#05070d] p-6 shadow-2xl"
          >
            <h2 className="text-[20px] font-semibold text-[#f3f4f7]">
              Add Admin
            </h2>

            <label className="mt-5 block text-[13px] font-semibold text-[#c5cad7]">
              Admin Gmail
              <input
                value={form.email}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    email: event.target.value,
                  }))
                }
                type="email"
                required
                className="mt-2 h-11 w-full rounded-md border border-[#18223b] bg-[#0b1120] px-3 text-[14px] font-semibold text-white outline-none transition duration-150 placeholder:text-[#697184] focus:border-[#2858ba]"
                placeholder="admin@gmail.com"
              />
            </label>

            <label className="mt-4 block text-[13px] font-semibold text-[#c5cad7]">
              Admin Password
              <input
                value={form.password}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    password: event.target.value,
                  }))
                }
                type="password"
                required
                className="mt-2 h-11 w-full rounded-md border border-[#18223b] bg-[#0b1120] px-3 text-[14px] font-semibold text-white outline-none transition duration-150 placeholder:text-[#697184] focus:border-[#2858ba]"
                placeholder="Password"
              />
            </label>

            {serverError && (
              <p className="mt-3 text-[13px] font-semibold text-[#ff6b6b]">
                {serverError}
              </p>
            )}

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={closeModal}
                disabled={createAdminMutation.isPending}
                className="h-10 rounded-md border border-[#1c2640] px-4 text-[13px] font-semibold text-[#c7ccd8] transition duration-150 hover:bg-[#0d1425] disabled:cursor-not-allowed disabled:opacity-60"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={createAdminMutation.isPending}
                className="h-10 rounded-md bg-[#2457df] px-5 text-[13px] font-semibold text-white transition duration-150 hover:bg-[#3266ee] disabled:cursor-not-allowed disabled:opacity-70"
              >
                {createAdminMutation.isPending ? "Adding..." : "Add Admin"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default ManagementPage;
