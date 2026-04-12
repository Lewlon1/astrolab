"use client";

import Script from "next/script";

export default function ManyChatScript() {
  const id = process.env.NEXT_PUBLIC_MANYCHAT_API_KEY;
  if (!id) return null;

  return (
    <Script
      src={`https://widget.manychat.com/${id}.js`}
      strategy="lazyOnload"
    />
  );
}
