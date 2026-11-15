import { toNextJsHandler } from "better-auth/next-js";
import { ensureOnlyOneOwner, getAuth } from "@/lib/auth";

// Better Auth's own address, /api/auth/... It handles sign-up, sign-in, and sign-out. The sign-in
// system is built the first time a request arrives, not when the app is built.
export async function GET(request: Request) {
  return toNextJsHandler(getAuth()).GET(request);
}

export async function POST(request: Request) {
  // The one-owner rule is a database index. It has to exist before Better Auth opens its own
  // database transaction for a sign-up, so it's made here, first. After the first time it's a no-op.
  await ensureOnlyOneOwner();
  return toNextJsHandler(getAuth()).POST(request);
}
