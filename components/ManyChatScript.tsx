"use client";

import Script from "next/script";
import { useConsent } from "@/context/ConsentContext";

export default function ManyChatScript() {
  const { marketingAllowed } = useConsent();
  const id = process.env.NEXT_PUBLIC_MANYCHAT_API_KEY;
  // Third-party widget that can set cookies → only load with marketing consent.
  if (!id || !marketingAllowed) return null;

  return (
    <Script
      src={`https://widget.manychat.com/${id}.js`}
      strategy="lazyOnload"
    />
  );
}
