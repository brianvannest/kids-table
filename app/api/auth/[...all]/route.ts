import { toNextJsHandler } from "better-auth/next-js";
import { ensureOnlyOneOwner, getAuth } from "@/lib/auth";
import { isAuthConfigured } from "@/lib/authConfig";

// Until the settings are in, sign-in says so, plainly, instead of crashing. The reason isn't sent,
// because a stranger doesn't need to know which setting is missing.
const notSetUp = () => Response.json({ message: "Sign-in isn't set up yet." }, { status: 503 });

// Better Auth's own address, /api/auth/... It handles sign-up, sign-in, and sign-out. The sign-in
// system is built the first time a request arrives, not when the app is built.
export async function GET(request: Request) {
  if (!isAuthConfigured()) return notSetUp();
  return toNextJsHandler(getAuth()).GET(request);
}

export async function POST(request: Request) {
  if (!isAuthConfigured()) return notSetUp();
  // The one-owner rule is a database index. It has to exist before Better Auth opens its own
  // database transaction for a sign-up, so it's made here, first. After the first time it's a no-op.
  await ensureOnlyOneOwner();
  return toNextJsHandler(getAuth()).POST(request);
}
