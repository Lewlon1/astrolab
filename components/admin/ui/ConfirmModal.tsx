"use client";

interface ConfirmModalProps {
  isOpen: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  title: string;
  message: string;
  loading?: boolean;
}

export default function ConfirmModal({
  isOpen,
  onConfirm,
  onCancel,
  title,
  message,
  loading,
}: ConfirmModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onCancel} />
      <div className="relative bg-white border border-[#e8e5df] rounded-xl p-6 max-w-sm w-full mx-4 shadow-xl">
        <h3 className="font-heading text-lg text-[#1a1a18]">{title}</h3>
        <p className="text-sm text-[#6b6560] mt-2">{message}</p>
        <div className="flex justify-end gap-3 mt-6">
          <button
            onClick={onCancel}
            disabled={loading}
            className="text-sm px-4 py-2 rounded-lg border border-[#e8e5df] text-[#1a1a18] hover:bg-[#f5f3ef] transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="text-sm px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 transition-colors disabled:opacity-50"
          >
            {loading ? "Deleting..." : "Delete"}
          </button>
        </div>
      </div>
    </div>
  );
}
