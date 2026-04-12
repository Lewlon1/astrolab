export function timeAgo(dateString: string): string {
  const now = new Date();
  const date = new Date(dateString);
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  const weeks = Math.floor(days / 7);
  if (weeks < 4) return `${weeks}w ago`;
  return date.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

export const leadStatusColors: Record<string, { bg: string; text: string }> = {
  new: { bg: "bg-orange-50", text: "text-orange-700" },
  voice_note_sent: { bg: "bg-blue-50", text: "text-blue-700" },
  nurturing: { bg: "bg-purple-50", text: "text-purple-700" },
  booked: { bg: "bg-green-50", text: "text-green-700" },
  converted: { bg: "bg-amber-50", text: "text-amber-700" },
};

export const leadSourceColors: Record<string, { bg: string; text: string }> = {
  website_form: { bg: "bg-slate-100", text: "text-slate-600" },
  lovecode: { bg: "bg-pink-50", text: "text-pink-600" },
  event_qr: { bg: "bg-indigo-50", text: "text-indigo-600" },
  manychat: { bg: "bg-sky-50", text: "text-sky-600" },
};

export function formatStatus(status: string): string {
  return status.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export function formatSource(source: string): string {
  const labels: Record<string, string> = {
    website_form: "Website",
    lovecode: "Love Code",
    event_qr: "Event QR",
    manychat: "ManyChat",
  };
  return labels[source] || source;
}
