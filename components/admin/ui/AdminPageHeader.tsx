import Link from "next/link";

interface AdminPageHeaderProps {
  title: string;
  description?: string;
  action?: { label: string; href: string };
}

export default function AdminPageHeader({
  title,
  description,
  action,
}: AdminPageHeaderProps) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <h1 className="font-heading text-2xl text-[#1a1a18]">{title}</h1>
        {description && (
          <p className="text-[#6b6560] mt-1">{description}</p>
        )}
      </div>
      {action && (
        <Link
          href={action.href}
          className="inline-flex items-center gap-1.5 text-sm font-medium bg-deep text-white px-4 py-2.5 rounded-lg hover:bg-deep/90 transition-colors"
        >
          {action.label}
        </Link>
      )}
    </div>
  );
}
