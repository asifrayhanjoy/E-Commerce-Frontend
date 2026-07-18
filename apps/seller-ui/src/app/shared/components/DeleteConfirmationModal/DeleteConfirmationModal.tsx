"use client";

import type { ReactNode } from "react";

type DeleteConfirmationModalProps = {
  isOpen?: boolean;
  open?: boolean;
  show?: boolean;
  title?: string;
  message?: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
  isDeleting?: boolean;
  isLoading?: boolean;
  loading?: boolean;
  children?: ReactNode;
  onClose?: () => void;
  onCancel?: () => void;
  onConfirm?: () => void;
  handleClose?: () => void;
  handleConfirm?: () => void;
  [key: string]: any;
};

const DeleteConfirmationModal = ({
  isOpen,
  open,
  show,
  title = "Delete item",
  message,
  description,
  confirmText = "Delete",
  cancelText = "Cancel",
  isDeleting,
  isLoading,
  loading,
  children,
  onClose,
  onCancel,
  onConfirm,
  handleClose,
  handleConfirm,
}: DeleteConfirmationModalProps) => {
  const visible = Boolean(isOpen ?? open ?? show);
  const pending = Boolean(isDeleting ?? isLoading ?? loading);
  const closeModal = onClose ?? onCancel ?? handleClose;
  const confirmDelete = onConfirm ?? handleConfirm;

  if (!visible) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 px-4">
      <div className="w-full max-w-[430px] rounded-lg border border-[#17203a] bg-[#05070d] p-6 text-white shadow-2xl">
        <h2 className="text-[20px] font-semibold text-[#f3f4f7]">{title}</h2>

        <div className="mt-3 text-[14px] font-semibold leading-6 text-[#a8afc0]">
          {children || message || description || "Are you sure you want to delete this item?"}
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={closeModal}
            disabled={pending}
            className="h-11 rounded-md border border-[#1d2b49] px-5 text-[14px] font-semibold text-[#d8dce7] transition duration-150 hover:bg-[#0d1423] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={confirmDelete}
            disabled={pending}
            className="h-11 rounded-md bg-[#d92d3b] px-5 text-[14px] font-semibold text-white transition duration-150 hover:bg-[#ef4050] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {pending ? "Deleting..." : confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeleteConfirmationModal;
