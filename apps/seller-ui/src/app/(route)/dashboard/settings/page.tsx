"use client";

import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import {
  AlertTriangle,
  Bell,
  ChevronRight,
  CirclePlus,
  Globe2,
  Save,
  Shield,
  Trash2,
  WalletCards,
  X,
} from "lucide-react";
import axiosInstance from "@/utils/axiosInstance";
import useSeller from "@/hooks/useSeller";

type SellerSettings = {
  id?: string;
  lowStockAlertThreshold: number;
  notificationPreferences: {
    email: boolean;
    web: boolean;
    app: boolean;
  };
  customDomains: string[];
  withdrawMethod: {
    type?: string;
    accountName?: string;
    accountNumber?: string;
    bankName?: string;
  } | null;
};

type ActiveTab = "general" | "domains" | "withdraw";
type ActiveDialog = "threshold" | "notifications" | "delete" | null;

const defaultSettings: SellerSettings = {
  lowStockAlertThreshold: 10,
  notificationPreferences: {
    email: true,
    web: true,
    app: true,
  },
  customDomains: [],
  withdrawMethod: null,
};

const fetchSellerSettings = async () => {
  const response = await axiosInstance.get("/api/v1/auth/seller-settings");

  return (response.data?.settings || defaultSettings) as SellerSettings;
};

const updateSellerSettings = async (payload: Partial<SellerSettings>) => {
  const response = await axiosInstance.put("/api/v1/auth/seller-settings", payload);

  return response.data?.settings as SellerSettings;
};

const deleteSellerShop = async (payload: { confirmName?: string; confirm?: string }) => {
  const response = await axiosInstance.delete("/api/v1/auth/seller-shop", {
    data: payload,
  });

  return response.data;
};

function SettingsPage() {
  const queryClient = useQueryClient();
  const { seller } = useSeller();
  const [activeTab, setActiveTab] = useState<ActiveTab>("general");
  const [activeDialog, setActiveDialog] = useState<ActiveDialog>(null);
  const [threshold, setThreshold] = useState("10");
  const [notifications, setNotifications] = useState({
    email: true,
    web: true,
    app: true,
  });
  const [domainInput, setDomainInput] = useState("");
  const [withdrawMethod, setWithdrawMethod] = useState({
    type: "Bank Transfer",
    accountName: "",
    accountNumber: "",
    bankName: "",
  });
  const [deleteConfirmation, setDeleteConfirmation] = useState("");

  const {
    data: settings = defaultSettings,
    isLoading,
    isError,
  } = useQuery<SellerSettings>({
    queryKey: ["seller-settings"],
    queryFn: fetchSellerSettings,
    staleTime: 1000 * 60 * 5,
  });

  const updateSettingsMutation = useMutation({
    mutationFn: updateSellerSettings,
    onSuccess: (updatedSettings) => {
      queryClient.setQueryData(["seller-settings"], updatedSettings);
      setActiveDialog(null);
    },
  });

  const deleteShopMutation = useMutation({
    mutationFn: deleteSellerShop,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["seller"] });
      window.location.href = "/register";
    },
  });

  useEffect(() => {
    setThreshold(String(settings.lowStockAlertThreshold));
    setNotifications(settings.notificationPreferences);
    setWithdrawMethod({
      type: settings.withdrawMethod?.type || "Bank Transfer",
      accountName: settings.withdrawMethod?.accountName || "",
      accountNumber: settings.withdrawMethod?.accountNumber || "",
      bankName: settings.withdrawMethod?.bankName || "",
    });
    setDomainInput(settings.customDomains.join(", "));
  }, [settings]);

  const tabs = [
    { id: "general" as const, label: "General" },
    { id: "domains" as const, label: "Custom Domains" },
    { id: "withdraw" as const, label: "Withdraw Method" },
  ];
  const shopName = seller?.shop?.name || "";
  const isDeleteConfirmationValid =
    deleteConfirmation.trim().toUpperCase() === "DELETE";
  const domainList = useMemo(
    () =>
      domainInput
        .split(",")
        .map((domain) => domain.trim().toLowerCase())
        .filter(Boolean),
    [domainInput]
  );

  const saveThreshold = () => {
    updateSettingsMutation.mutate({
      lowStockAlertThreshold: Number(threshold),
    });
  };

  const saveNotifications = () => {
    updateSettingsMutation.mutate({
      notificationPreferences: notifications,
    });
  };

  const saveDomains = () => {
    updateSettingsMutation.mutate({
      customDomains: domainList,
    });
  };

  const saveWithdrawMethod = () => {
    updateSettingsMutation.mutate({
      withdrawMethod,
    });
  };

  return (
    <div className="min-h-screen w-full p-6 text-white md:p-12">
      <h2 className="text-xl font-semibold text-white">Settings</h2>

      <div className="mt-2 flex items-center text-sm text-white">
        <Link href="/dashboard" className="cursor-pointer text-[#80Deea]">
          Dashboard
        </Link>
        <ChevronRight size={20} className="opacity-[.8]" />
        <span>Settings</span>
      </div>

      <div className="mt-10 border-b border-gray-800">
        <div className="flex gap-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`relative pb-4 text-base font-semibold transition md:text-lg ${
                activeTab === tab.id ? "text-white" : "text-gray-400 hover:text-white"
              }`}
            >
              {tab.label}
              {activeTab === tab.id && (
                <span className="absolute bottom-[-1px] left-0 h-[3px] w-full rounded-full bg-blue-600" />
              )}
            </button>
          ))}
        </div>
      </div>

      {isError && (
        <div className="mt-6 max-w-3xl rounded-lg border border-red-500/40 bg-red-950/40 p-4 text-sm text-red-200">
          Settings could not be loaded.
        </div>
      )}

      {activeTab === "general" && (
        <div className="mt-8 max-w-3xl">
          <div className="space-y-1">
            <SettingsRow
              icon={<Bell size={24} className="text-blue-400" />}
              title="Low Stock Alert Threshold"
              description={
                isLoading
                  ? "Loading..."
                  : `Get notified when stock falls below ${settings.lowStockAlertThreshold}.`
              }
              onClick={() => setActiveDialog("threshold")}
            />
            <SettingsRow
              icon={<Shield size={24} className="text-yellow-400" />}
              title="Order Notification Preferences"
              description="Choose how you receive order notifications (Email, Web, App)."
              onClick={() => setActiveDialog("notifications")}
            />
          </div>

          <div className="mt-8 border-t border-gray-800 pt-8">
            <div className="mb-6 flex items-center gap-3">
              <AlertTriangle size={24} className="text-red-500" />
              <h3 className="text-xl font-semibold text-red-500">Danger Zone</h3>
            </div>

            <SettingsRow
              icon={<Trash2 size={24} className="text-gray-200" />}
              title="Delete Shop"
              description="Deleting your shop is irreversible. Proceed with caution."
              danger
              onClick={() => setActiveDialog("delete")}
            />
          </div>
        </div>
      )}

      {activeTab === "domains" && (
        <div className="mt-8 max-w-3xl space-y-8">
          <section>
            <DomainSectionHeader
              icon={<CirclePlus size={24} className="text-blue-400" />}
              title="Add Custom Domain"
              description="Connect your own domain to this store."
            />

            <div className="mt-6 border-t border-gray-800 pt-6">
              <label className="block">
                <span className="text-sm font-semibold text-gray-300">
                  Domain Name
                </span>
                <input
                  type="text"
                  value={domainInput}
                  onChange={(event) => setDomainInput(event.target.value)}
                  placeholder="yourdomain.com"
                  className="mt-2 h-12 w-full rounded-md border  bg-amber-50 px-3 text-sm font-semibold text-black outline-none transition placeholder:text-gray-500 focus:border-blue-500"
                />
              </label>
            </div>

            <button
              type="button"
              onClick={saveDomains}
              disabled={updateSettingsMutation.isPending}
              className="mt-5 inline-flex h-12 items-center gap-2 rounded-md bg-blue-600 px-5 text-sm font-semibold text-white transition hover:bg-blue-500 disabled:bg-gray-700"
            >
              <Save size={20} />
              {updateSettingsMutation.isPending ? "Saving..." : "Save Domain"}
            </button>
          </section>

          <section className="space-y-6">
            <DomainSectionHeader
              icon={<Globe2 size={24} className="text-green-400" />}
              title="Connected Domain"
              description="Manage your custom domain."
            />

            {isLoading ? (
              <p className="text-sm font-semibold text-gray-400">Loading...</p>
            ) : settings.customDomains.length > 0 ? (
              <div className="space-y-2">
                {settings.customDomains.map((domain) => (
                  <p key={domain} className="text-sm font-semibold text-gray-300">
                    {domain}
                  </p>
                ))}
              </div>
            ) : (
              <p className="text-sm font-semibold text-gray-400">
                No domain connected.
              </p>
            )}
          </section>

          <section>
            <DomainSectionHeader
              icon={<Globe2 size={24} className="text-yellow-400" />}
              title="DNS Configuration"
              description="Set up your DNS records for verification."
            />

            <div className="mt-6 border-t border-gray-800 pt-6">
              <p className="text-sm font-semibold text-gray-300">
                To verify your domain, add the following DNS records:
              </p>
              <div className="mt-4 space-y-3 text-xs font-semibold text-gray-300">
                <p>
                  <span className="text-white">CNAME:</span> Set{" "}
                  <span className="text-white">www</span> to point to{" "}
                  <span className="text-blue-500">seller.shondhane.com</span>
                </p>
                <p>
                  <span className="text-white">A Record:</span> Point your root domain
                  {" "}to <span className="text-blue-500">YOUR_SERVER_IP</span>
                </p>
              </div>
            </div>
          </section>
        </div>
      )}

      {activeTab === "withdraw" && (
        <div className="mt-8 max-w-3xl">
          <SettingsPanel
            icon={<WalletCards size={24} className="text-green-400" />}
            title="Withdraw Method"
            description="Manage where seller payouts should be sent."
          >
            <div className="grid gap-4 md:grid-cols-2">
              <InputField
                label="Method"
                value={withdrawMethod.type}
                onChange={(value) =>
                  setWithdrawMethod((current) => ({ ...current, type: value }))
                }
              />
              <InputField
                label="Account Name"
                value={withdrawMethod.accountName}
                onChange={(value) =>
                  setWithdrawMethod((current) => ({
                    ...current,
                    accountName: value,
                  }))
                }
              />
              <InputField
                label="Account Number"
                value={withdrawMethod.accountNumber}
                onChange={(value) =>
                  setWithdrawMethod((current) => ({
                    ...current,
                    accountNumber: value,
                  }))
                }
              />
              <InputField
                label="Bank Name"
                value={withdrawMethod.bankName}
                onChange={(value) =>
                  setWithdrawMethod((current) => ({
                    ...current,
                    bankName: value,
                  }))
                }
              />
            </div>
            <button
              type="button"
              onClick={saveWithdrawMethod}
              disabled={updateSettingsMutation.isPending}
              className="mt-5 h-10 rounded-md bg-blue-600 px-4 text-sm font-semibold text-white transition hover:bg-blue-500 disabled:bg-gray-700"
            >
              Save Withdraw Method
            </button>
          </SettingsPanel>
        </div>
      )}

      {activeDialog === "threshold" && (
        <Dialog title="Low Stock Alert Threshold" onClose={() => setActiveDialog(null)}>
          <InputField
            label="Threshold"
            type="number"
            value={threshold}
            onChange={setThreshold}
          />
          <DialogActions
            isLoading={updateSettingsMutation.isPending}
            onCancel={() => setActiveDialog(null)}
            onSave={saveThreshold}
          />
        </Dialog>
      )}

      {activeDialog === "notifications" && (
        <Dialog
          title="Order Notification Preferences"
          onClose={() => setActiveDialog(null)}
        >
          <div className="space-y-3">
            {(["email", "web", "app"] as const).map((key) => (
              <label
                key={key}
                className="flex items-center justify-between rounded-md border border-gray-800 bg-gray-950 p-3 text-sm font-semibold text-white"
              >
                <span>{key[0].toUpperCase() + key.slice(1)}</span>
                <input
                  type="checkbox"
                  checked={notifications[key]}
                  onChange={(event) =>
                    setNotifications((current) => ({
                      ...current,
                      [key]: event.target.checked,
                    }))
                  }
                  className="h-5 w-5 accent-blue-600"
                />
              </label>
            ))}
          </div>
          <DialogActions
            isLoading={updateSettingsMutation.isPending}
            onCancel={() => setActiveDialog(null)}
            onSave={saveNotifications}
          />
        </Dialog>
      )}

      {activeDialog === "delete" && (
        <Dialog title="Delete Shop" onClose={() => setActiveDialog(null)}>
          <p className="text-xs font-medium text-red-300">
            This will remove the shop and mark its products as deleted.
          </p>
          {shopName && (
            <p className="mt-2 text-xs font-medium text-gray-400">
              Shop: {shopName}
            </p>
          )}
          <InputField
            label='Type "DELETE" to confirm'
            value={deleteConfirmation}
            onChange={setDeleteConfirmation}
          />
          {!isDeleteConfirmationValid && (
            <p className="mt-3 text-xs text-gray-400">
              Enter DELETE to enable this action.
            </p>
          )}
          {deleteShopMutation.isError && (
            <p className="mt-3 text-sm text-red-300">Shop could not be deleted.</p>
          )}
          <div className="mt-6 flex justify-end gap-3">
            <button
              type="button"
              onClick={() => setActiveDialog(null)}
              className="h-10 rounded-md border border-gray-700 px-4 text-sm font-semibold text-white transition hover:bg-gray-800"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={deleteShopMutation.isPending || !isDeleteConfirmationValid}
              onClick={() => deleteShopMutation.mutate({ confirm: "DELETE" })}
              className="h-10 rounded-md bg-red-600 px-4 text-sm font-semibold text-white transition hover:bg-red-500 disabled:bg-gray-700"
            >
              {deleteShopMutation.isPending ? "Deleting..." : "Delete Shop"}
            </button>
          </div>
        </Dialog>
      )}
    </div>
  );
}

function DomainSectionHeader({
  icon,
  title,
  description,
}: {
  icon: ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="mt-1 flex w-6 justify-center">{icon}</div>
      <div>
        <h3 className="text-base font-semibold text-white">{title}</h3>
        <p className="mt-1 text-xs font-semibold text-gray-400">{description}</p>
      </div>
    </div>
  );
}

function SettingsRow({
  icon,
  title,
  description,
  danger,
  onClick,
}: {
  icon: ReactNode;
  title: string;
  description: string;
  danger?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="grid w-full grid-cols-[42px_minmax(0,1fr)_32px] items-center gap-3 rounded-md py-4 text-left transition hover:bg-gray-900/40"
    >
      <div className="flex justify-center">{icon}</div>
      <div className="min-w-0">
        <h4 className="text-base font-semibold text-white">{title}</h4>
        <p
          className={`mt-1 text-xs font-semibold ${
            danger ? "text-red-400" : "text-gray-400"
          }`}
        >
          {description}
        </p>
      </div>
      <ChevronRight size={26} className="text-gray-400" />
    </button>
  );
}

function SettingsPanel({
  icon,
  title,
  description,
  children,
}: {
  icon: ReactNode;
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <div className="rounded-lg border border-gray-800 bg-gray-900 p-5">
      <div className="mb-5 flex items-start gap-3">
        {icon}
        <div>
          <h3 className="text-lg font-semibold text-white">{title}</h3>
          <p className="mt-1 text-xs font-semibold text-gray-400">{description}</p>
        </div>
      </div>
      {children}
    </div>
  );
}

function Dialog({
  title,
  children,
  onClose,
}: {
  title: string;
  children: ReactNode;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="w-full max-w-md rounded-lg border border-gray-700 bg-gray-900 p-5 text-white shadow-2xl">
        <div className="mb-5 flex items-center justify-between gap-4">
          <h3 className="text-lg font-semibold">{title}</h3>
          <button
            type="button"
            title="Close"
            onClick={onClose}
            className="text-gray-400 transition hover:text-white"
          >
            <X size={22} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

function InputField({
  label,
  value,
  type = "text",
  onChange,
}: {
  label: string;
  value: string;
  type?: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="block">
      <span className="text-xs font-semibold text-gray-300">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="mt-2 h-11 w-full rounded-md border border-gray-700 bg-gray-950 px-3 text-sm text-white outline-none transition placeholder:text-gray-500 focus:border-blue-500"
      />
    </label>
  );
}

function DialogActions({
  isLoading,
  onCancel,
  onSave,
}: {
  isLoading: boolean;
  onCancel: () => void;
  onSave: () => void;
}) {
  return (
    <div className="mt-6 flex justify-end gap-3">
      <button
        type="button"
        onClick={onCancel}
        className="h-10 rounded-md border border-gray-700 px-4 text-sm font-semibold text-white transition hover:bg-gray-800"
      >
        Cancel
      </button>
      <button
        type="button"
        onClick={onSave}
        disabled={isLoading}
        className="h-10 rounded-md bg-blue-600 px-4 text-sm font-semibold text-white transition hover:bg-blue-500 disabled:bg-gray-700"
      >
        {isLoading ? "Saving..." : "Save"}
      </button>
    </div>
  );
}

export default SettingsPage;
