"use client";

import { useEffect } from "react";

interface ToastProps {
  message: string;
  type: "success" | "error";
  onClose: () => void;
}

export default function Toast({ message, type, onClose }: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className="fixed top-4 right-4 z-50 animate-in fade-in slide-in-from-top-2">
      <div
        className={`flex items-center gap-2 px-4 py-3 rounded-lg shadow-lg text-sm font-medium ${
          type === "success"
            ? "bg-green-50 text-green-800 border border-green-200"
            : "bg-red-50 text-red-800 border border-red-200"
        }`}
      >
        <span>{type === "success" ? "\u2713" : "\u2717"}</span>
        <span>{message}</span>
        <button
          onClick={onClose}
          className="ml-2 opacity-50 hover:opacity-100"
        >
          \u00d7
        </button>
      </div>
    </div>
  );
}
