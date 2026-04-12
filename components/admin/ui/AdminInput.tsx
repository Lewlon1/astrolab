"use client";

interface AdminInputProps {
  label?: string;
  id: string;
  type?: string;
  value: string | number;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
}

export default function AdminInput({
  label,
  id,
  type = "text",
  value,
  onChange,
  placeholder,
  required,
  disabled,
  className,
}: AdminInputProps) {
  return (
    <div className={className}>
      {label && (
        <label
          htmlFor={id}
          className="block text-sm font-medium text-[#1a1a18] mb-1.5"
        >
          {label}
          {required && <span className="text-red-500 ml-0.5">*</span>}
        </label>
      )}
      <input
        id={id}
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        disabled={disabled}
        className="w-full px-3 py-2.5 border border-[#e8e5df] rounded-lg text-[#1a1a18] bg-[#fafaf8] placeholder:text-[#b8b0a4] focus:outline-none focus:ring-2 focus:ring-deep/20 focus:border-deep transition-colors disabled:opacity-50"
      />
    </div>
  );
}
