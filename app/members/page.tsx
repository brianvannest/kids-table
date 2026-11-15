import type { Metadata } from "next";
import { Suspense } from "react";
import { connection } from "next/server";
import { requireOwnerPage } from "@/lib/session";
import { MembersList } from "./MembersList";

export const metadata: Metadata = { title: "Members", robots: { index: false, follow: false } };

// Only the owner can see this. Anyone else is sent away before a single person is read.
async function OwnerGate() {
  await connection();
  await requireOwnerPage();
  return <MembersList />;
}

export default function MembersPage() {
  return (
    <div className="grid gap-6">
      <header className="grid max-w-prose gap-2">
        <h1 className="text-3xl font-extrabold leading-9 sm:text-4xl sm:leading-10">Members</h1>
        <p>Everyone who has made an account. People who are waiting come first.</p>
      </header>
      <Suspense fallback={<p role="status">Loading...</p>}>
        <OwnerGate />
      </Suspense>
    </div>
  );
}
