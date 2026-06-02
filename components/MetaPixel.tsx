"use client";

import Script from "next/script";
import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useRef, Suspense } from "react";
import { FB_PIXEL_ID, pageview } from "@/lib/fbpixel";
import { useConsent } from "@/context/ConsentContext";

function PixelPageView() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const first = useRef(true);
  useEffect(() => {
    // the init snippet already fires the first PageView — skip it here to avoid double-counting
    if (first.current) {
      first.current = false;
      return;
    }
    pageview();
  }, [pathname, searchParams]);
  return null;
}

export default function MetaPixel() {
  const { marketingAllowed } = useConsent();
  // No ID, or no marketing-cookie consent yet → load nothing, fire nothing.
  if (!FB_PIXEL_ID || !marketingAllowed) return null;
  return (
    <>
      <Script id="meta-pixel" strategy="afterInteractive">
        {`!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?
        n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;
        n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;
        t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,
        document,'script','https://connect.facebook.net/en_US/fbevents.js');
        fbq('init','${FB_PIXEL_ID}');fbq('track','PageView');`}
      </Script>
      <noscript>
        <img
          height="1"
          width="1"
          style={{ display: "none" }}
          alt=""
          src={`https://www.facebook.com/tr?id=${FB_PIXEL_ID}&ev=PageView&noscript=1`}
        />
      </noscript>
      <Suspense fallback={null}>
        <PixelPageView />
      </Suspense>
    </>
  );
}
