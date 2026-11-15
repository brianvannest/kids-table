// Is sign-in set up properly? A plain function with no imports, so it can be tested alone, and so
// the launch check script can use the same rules as the app.
//
// It looks only at whether each setting is there and sensible. It never returns a setting's value.

export const MIN_SECRET_LENGTH = 32;

type Env = Record<string, string | undefined>;

export type AuthProblem = "database" | "secret" | "address";

/** What is wrong with the sign-in settings, if anything. Empty means it's ready. */
export function authProblems(env: Env, isProduction: boolean): AuthProblem[] {
  const problems: AuthProblem[] = [];
  if (!env.MONGODB_URI?.trim()) problems.push("database");
  if ((env.BETTER_AUTH_SECRET ?? "").trim().length < MIN_SECRET_LENGTH) problems.push("secret");
  // In a production build, the app has to know its own address. Without it, it trusts only localhost,
  // and every sign-in from the real address would be refused as coming from somewhere else. A real
  // address must be https. Plain http is fine only for your own computer, so you can try the finished
  // build locally.
  const address = (env.BETTER_AUTH_URL ?? "").trim();
  const secure = /^https:\/\/[^/\s]+/.test(address);
  const own = /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?(\/|$)/.test(address);
  if (isProduction && !secure && !own) problems.push("address");
  return problems;
}

export function isAuthConfigured(env: Env = process.env, isProduction: boolean = process.env.NODE_ENV === "production"): boolean {
  return authProblems(env, isProduction).length === 0;
}
