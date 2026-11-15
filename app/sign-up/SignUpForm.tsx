"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/Button";
import { TextField } from "@/components/ui/fields";
import { Notice } from "@/components/ui/Notice";

// Creates an account. Everyone starts out waiting for the owner to approve them. The form sends
// only a name, an email, and a password. Nothing in it can choose a role or a status: the
// sign-in system ignores them, and the app sets them itself.
export function SignUpForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    const form = new FormData(event.currentTarget);
    const name = String(form.get("name") ?? "").trim();
    const password = String(form.get("password") ?? "");
    if (!name) return setError("Please enter your name, so the owner knows who you are.");
    if (password.length < 8 || password.length > 128) return setError("Your password needs 8 to 128 characters.");

    setBusy(true);
    const { error: failed } = await authClient.signUp.email({
      name,
      email: String(form.get("email") ?? ""),
      password,
    });
    if (failed) {
      // One message for every reason, so it can't be used to find out who already has an account.
      setError(
        failed.status === 429
          ? "Too many tries. Wait a minute, then try again."
          : "We couldn't create that account. If you already have one, sign in instead.",
      );
      setBusy(false);
      return;
    }
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
      <TextField label="Your name" name="name" autoComplete="name" required maxLength={80} />
      <TextField label="Email" name="email" type="email" autoComplete="email" required />
      <TextField
        label="Password"
        name="password"
        type="password"
        autoComplete="new-password"
        required
        minLength={8}
        maxLength={128}
        hint="At least 8 characters. A few random words is a good password."
      />
      <div>
        <Button type="submit" disabled={busy}>
          {busy ? "Creating your account..." : "Create account"}
        </Button>
      </div>
    </form>
  );
}
