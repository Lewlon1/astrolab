import type { NavIcon } from "./navConfig";

const paths: Record<NavIcon, React.ReactNode> = {
  today: (
    <>
      <circle cx="10" cy="10" r="3.5" />
      <path d="M10 2v2M10 16v2M2 10h2M16 10h2M4.3 4.3l1.4 1.4M14.3 14.3l1.4 1.4M4.3 15.7l1.4-1.4M14.3 5.7l1.4-1.4" />
    </>
  ),
  clients: (
    <>
      <circle cx="7.5" cy="7" r="2.75" />
      <path d="M2.5 16.5c0-2.8 2.2-4.75 5-4.75s5 1.95 5 4.75" />
      <path d="M13 4.5a2.6 2.6 0 0 1 0 5M14.5 12c1.8.5 3 2.1 3 4.5" />
    </>
  ),
  content: (
    <>
      <path d="M13.5 3.5l3 3L7 16H4v-3z" />
      <path d="M11.5 5.5l3 3" />
    </>
  ),
  website: (
    <>
      <rect x="2.5" y="3.5" width="15" height="13" rx="2" />
      <path d="M2.5 7.5h15M5.5 5.5h.01M7.5 5.5h.01" />
    </>
  ),
  insights: <path d="M3 16.5h14M5.5 13.5v-4M10 13.5v-8M14.5 13.5v-6" />,
};

export default function NavIconSvg({ icon, className }: { icon: NavIcon; className?: string }) {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
    >
      {paths[icon]}
    </svg>
  );
}
