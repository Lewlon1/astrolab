"use client";

interface AdminTextareaProps {
  label?: string;
  id: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  placeholder?: string;
  required?: boolean;
  rows?: number;
  mono?: boolean;
  className?: string;
}

export default function AdminTextarea({
  label,
  id,
  value,
  onChange,
  placeholder,
  required,
  rows = 4,
  mono,
  className,
}: AdminTextareaProps) {
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
      <textarea
        id={id}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        rows={rows}
        className={`w-full px-3 py-2.5 border border-[#e8e5df] rounded-lg text-[#1a1a18] bg-[#fafaf8] placeholder:text-[#b8b0a4] focus:outline-none focus:ring-2 focus:ring-deep/20 focus:border-deep transition-colors resize-vertical ${mono ? "font-mono text-sm" : ""}`}
      />
    </div>
  );
}
