import type { Metadata } from "next";
import { Suspense } from "react";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { requireSignedIn } from "@/lib/session";
import { isApproved } from "@/lib/memberRules";
import { Notice } from "@/components/ui/Notice";
import { SignOutButton } from "@/components/ui/SignOutButton";

export const metadata: Metadata = { title: "Waiting to be let in", robots: { index: false, follow: false } };

// Where every signed-in person lands first. Approved people are sent on to the app. A waiting
// person sees this screen, and a removed one sees that they don't have access.
async function WaitingContent() {
  await connection();
  const user = await requireSignedIn();
  if (isApproved(user)) redirect("/");

  if (user.status === "removed") {
    return (
      <>
        <Notice kind="warning">
          <p className="font-bold">This account doesn&apos;t have access.</p>
          <p>If you think that&apos;s a mistake, ask the owner.</p>
        </Notice>
        <div>
          <SignOutButton />
        </div>
      </>
    );
  }

  return (
    <>
      <Notice kind="info">
        <p className="font-bold">Thanks, {user.name}. You&apos;re signed in.</p>
        <p>The owner needs to approve your account before you can see everything. Check back soon.</p>
      </Notice>
      <div>
        <SignOutButton />
      </div>
    </>
  );
}

export default function WaitingPage() {
  return (
    <div className="grid max-w-xl gap-6">
      <h1 className="text-3xl font-extrabold leading-9 sm:text-4xl sm:leading-10">Waiting to be let in</h1>
      <Suspense fallback={<p role="status">Loading...</p>}>
        <WaitingContent />
      </Suspense>
    </div>
  );
}
