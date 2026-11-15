import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";
import { settings } from "@/lib/settings";
import { AccountMenu } from "./AccountMenu";

// The top of every screen. The logo is Brian's file and is used exactly as it is. It already
// says "A small fry guide", so the tagline isn't repeated as text.
//
// The one glow lives here, behind the logo. It's clipped so it can't make the page scroll sideways.
// At the right is the account menu: Sign in for a visitor, or the signed-in person's name and links.
export function SiteHeader() {
  return (
    <header className="overflow-x-clip">
      <div className="mx-auto flex w-full max-w-[1040px] items-center justify-between gap-4 px-4 pt-4 sm:px-6">
        <Link href="/" className="relative isolate inline-block" aria-label={`${settings.appName}, home`}>
          <span
            aria-hidden="true"
            className="absolute -inset-x-3 -inset-y-2 -z-10 rounded-[48px] bg-[radial-gradient(120%_90%_at_20%_20%,var(--color-tomato-soft)_0%,transparent_60%),radial-gradient(110%_90%_at_85%_85%,var(--color-teal-soft)_0%,transparent_60%)]"
          />
          <Image
            src="/kids-table-logo.png"
            alt={`${settings.appName}: ${settings.tagline.toLowerCase()}`}
            width={96}
            height={73}
            preload
          />
        </Link>
        {/* The account menu depends on who's asking, so it's built when the page is requested. */}
        <Suspense fallback={<div className="h-11 w-24" aria-hidden="true" />}>
          <AccountMenu />
        </Suspense>
      </div>
    </header>
  );
}
