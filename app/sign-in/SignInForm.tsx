"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/Button";
import { TextField } from "@/components/ui/fields";
import { Notice } from "@/components/ui/Notice";

// Goes through the sign-in system's own address (/api/auth), which checks where the request came
// from and limits how fast anyone can guess. The message for a wrong answer is always the same,
// so it never tells a stranger whether an email has an account.
export function SignInForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setBusy(true);
    const form = new FormData(event.currentTarget);
    const { error: failed } = await authClient.signIn.email({
      email: String(form.get("email") ?? ""),
      password: String(form.get("password") ?? ""),
    });
    if (failed) {
      setError(
        failed.status === 429
          ? "Too many tries. Wait a minute, then try again."
          : "That email and password don't match. Check them and try again.",
      );
      setBusy(false);
      return;
    }
    // The waiting screen sends an approved person on to the app.
    router.push("/waiting");
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-4">
      {error && (
        <Notice kind="error">
          <p>{error}</p>
        </Notice>
      )}
      <TextField label="Email" name="email" type="email" autoComplete="email" required />
      <TextField label="Password" name="password" type="password" autoComplete="current-password" required />
      <div>
        <Button type="submit" disabled={busy}>
          {busy ? "Signing in..." : "Sign in"}
        </Button>
      </div>
    </form>
  );
}
