"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

import { PackageSkeleton } from "./PackageSkeleton";

// Moves to `href` straight away while showing the loading skeleton, so the switch looks like an
// ordinary page load instead of flashing an empty page (as a redirect thrown mid-stream does).
export function RedirectTo({ href }: { href: string }) {
  const router = useRouter();
  useEffect(() => {
    router.replace(href);
  }, [router, href]);
  return (
    <>
      {/* Without JavaScript, the browser follows this instead */}
      <noscript>
        <meta httpEquiv="refresh" content={`0;url=${href}`} />
      </noscript>
      <PackageSkeleton />
    </>
  );
}
