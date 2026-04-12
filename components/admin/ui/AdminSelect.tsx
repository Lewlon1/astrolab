"use client";

interface AdminSelectProps {
  label?: string;
  id: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  options: { value: string; label: string }[];
  placeholder?: string;
  required?: boolean;
  className?: string;
}

export default function AdminSelect({
  label,
  id,
  value,
  onChange,
  options,
  placeholder,
  required,
  className,
}: AdminSelectProps) {
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
      <select
        id={id}
        value={value}
        onChange={onChange}
        required={required}
        className="w-full px-3 py-2.5 border border-[#e8e5df] rounded-lg text-[#1a1a18] bg-[#fafaf8] focus:outline-none focus:ring-2 focus:ring-deep/20 focus:border-deep transition-colors"
      >
        {placeholder && (
          <option value="" disabled>
            {placeholder}
          </option>
        )}
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}
