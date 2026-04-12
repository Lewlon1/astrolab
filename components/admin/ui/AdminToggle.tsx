"use client";

interface AdminToggleProps {
  label?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  size?: "default" | "small";
}

export default function AdminToggle({
  label,
  checked,
  onChange,
  size = "default",
}: AdminToggleProps) {
  const isSmall = size === "small";

  return (
    <label className="inline-flex items-center gap-2 cursor-pointer">
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative inline-flex shrink-0 rounded-full transition-colors ${
          checked ? "bg-deep" : "bg-[#e8e5df]"
        } ${isSmall ? "h-5 w-9" : "h-6 w-11"}`}
      >
        <span
          className={`inline-block rounded-full bg-white shadow transition-transform ${
            isSmall ? "h-4 w-4 mt-0.5 ml-0.5" : "h-5 w-5 mt-0.5 ml-0.5"
          } ${
            checked
              ? isSmall
                ? "translate-x-4"
                : "translate-x-5"
              : "translate-x-0"
          }`}
        />
      </button>
      {label && (
        <span className="text-sm text-[#1a1a18]">{label}</span>
      )}
    </label>
  );
}
