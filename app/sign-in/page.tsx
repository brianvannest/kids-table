import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { isAuthConfigured } from "@/lib/authConfig";
import { getCurrentUser } from "@/lib/session";
import { Notice } from "@/components/ui/Notice";
import { SignInForm } from "./SignInForm";

export const metadata: Metadata = { title: "Sign in", robots: { index: false, follow: false } };

async function SignInContent() {
  await connection();
  if (!isAuthConfigured()) {
    return (
      <Notice kind="error">
        <p className="font-bold">Sign-in isn&apos;t available right now.</p>
        <p>Try again in a minute.</p>
      </Notice>
    );
  }
  // Already signed in: the waiting screen sends you on.
  if (await getCurrentUser()) redirect("/waiting");
  return (
    <>
      <SignInForm />
      <p>
        New here? <Link href="/sign-up">Create an account</Link>
      </p>
    </>
  );
}

export default function SignInPage() {
  return (
    <div className="grid max-w-md gap-6">
      <h1 className="text-3xl font-extrabold leading-9 sm:text-4xl sm:leading-10">Sign in</h1>
      <Suspense fallback={<p role="status">Loading...</p>}>
        <SignInContent />
      </Suspense>
    </div>
  );
}
