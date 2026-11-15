import "server-only";
import { betterAuth } from "better-auth";
import { mongodbAdapter } from "better-auth/adapters/mongodb";
import { getClient, getDb, getDbName } from "@/lib/mongodb";
import { startingAccess } from "@/lib/memberRules";

// Sign-in, run by Better Auth. It hashes passwords (scrypt), keeps sessions, and limits how fast
// someone can guess. Everything else here is the app's own rules: who starts as the owner, and
// that everyone else waits for approval.

const isProduction = process.env.NODE_ENV === "production";

// There can only ever be one owner, and the database itself enforces it: a unique index that
// applies only to documents whose role is "owner". Checking in code isn't enough on its own,
// because two sign-ups at the same moment could both pass the check.
const globalForAuth = globalThis as unknown as { kidsTableOwnerIndex?: Promise<unknown> };

export async function ensureOnlyOneOwner(): Promise<void> {
  if (!globalForAuth.kidsTableOwnerIndex) {
    const db = await getDb();
    globalForAuth.kidsTableOwnerIndex = db
      .collection("user")
      .createIndex({ role: 1 }, { unique: true, partialFilterExpression: { role: "owner" }, name: "only_one_owner" })
      .catch((error) => {
        // Try again next time rather than remembering a failure.
        globalForAuth.kidsTableOwnerIndex = undefined;
        throw error;
      });
  }
  await globalForAuth.kidsTableOwnerIndex;
}

function build() {
  const client = getClient();
  const baseURL = process.env.BETTER_AUTH_URL ?? "http://localhost:3000";

  return betterAuth({
    baseURL,
    // Requests from any other address are refused. On your own computer, the usual local addresses are allowed too.
    trustedOrigins: isProduction ? [baseURL] : [baseURL, "http://localhost:3000", "http://localhost:3001"],
    database: mongodbAdapter(client.db(getDbName()), { client }),

    // Email and password. The password is stored only as a scrypt hash. Eight to 128 characters.
    emailAndPassword: { enabled: true, minPasswordLength: 8, maxPasswordLength: 128 },

    user: {
      additionalFields: {
        // `input: false` means a person can't choose these when they sign up. Only the app sets them.
        role: { type: ["owner", "member"], required: false, defaultValue: "member", input: false },
        status: { type: ["waiting", "member", "removed"], required: false, defaultValue: "waiting", input: false },
      },
    },

    databaseHooks: {
      user: {
        create: {
          // Runs just before a new account is saved. This is where everyone becomes "waiting",
          // except the one person whose email is the owner's.
          before: async (user) => {
            const db = await getDb();
            const ownerExists = (await db.collection("user").countDocuments({ role: "owner" })) > 0;
            const access = startingAccess(user.email, process.env.OWNER_EMAIL, ownerExists);
            return { data: { ...user, ...access } };
          },
        },
      },
    },

    // Every time something asks who's signed in, read it from the database. Then approving or
    // removing someone takes effect on their very next click, with no waiting for a cache to expire.
    session: { cookieCache: { enabled: false } },

    // Guessing passwords is slowed to a few tries a minute, kept in the database so it works on
    // a host that runs the app in many small pieces.
    rateLimit: {
      enabled: true,
      storage: "database",
      window: 60,
      max: isProduction ? 60 : 300,
      customRules: {
        "/sign-in/email": { window: 60, max: isProduction ? 5 : 30 },
        "/sign-up/email": { window: 60, max: isProduction ? 5 : 30 },
      },
    },
    // Where to read a visitor's address for that limit. Only headers the host itself sets.
    advanced: { ipAddress: { ipAddressHeaders: ["x-vercel-forwarded-for", "x-forwarded-for"] } },
  });
}

type Auth = ReturnType<typeof build>;
const globalForInstance = globalThis as unknown as { kidsTableAuth?: Auth };

/** The one sign-in system. Built the first time it's needed, so the app can still build without a database. */
export function getAuth(): Auth {
  globalForInstance.kidsTableAuth ??= build();
  return globalForInstance.kidsTableAuth;
}
