import { createAuthClient } from "better-auth/react";

// The browser's side of sign-in. Forms use it to sign up, sign in, and sign out. It talks to
// /api/auth, which checks where the request came from and limits how fast someone can guess.
export const authClient = createAuthClient();
