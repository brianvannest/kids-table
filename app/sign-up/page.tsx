import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { isDatabaseConfigured } from "@/lib/mongodb";
import { getCurrentUser } from "@/lib/session";
import { Notice } from "@/components/ui/Notice";
import { SignUpForm } from "./SignUpForm";

export const metadata: Metadata = { title: "Create an account", robots: { index: false, follow: false } };

async function SignUpContent() {
  await connection();
  if (!isDatabaseConfigured()) {
    return (
      <Notice kind="error">
        <p className="font-bold">Sign-up isn&apos;t available right now.</p>
        <p>Try again in a minute.</p>
      </Notice>
    );
  }
  if (await getCurrentUser()) redirect("/waiting");
  return (
    <>
      <Notice kind="info">
        <p>
          The owner approves everyone who joins. After you sign up, you&apos;ll see a waiting screen until they let you in.
        </p>
      </Notice>
      <SignUpForm />
      <p>
        Already have an account? <Link href="/sign-in">Sign in</Link>
      </p>
    </>
  );
}

export default function SignUpPage() {
  return (
    <div className="grid max-w-md gap-6">
      <h1 className="text-3xl font-extrabold leading-9 sm:text-4xl sm:leading-10">Create an account</h1>
      <Suspense fallback={<p role="status">Loading...</p>}>
        <SignUpContent />
      </Suspense>
    </div>
  );
}
