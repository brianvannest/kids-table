import { NextResponse, type NextRequest } from "next/server";
import { getSessionCookie } from "better-auth/cookies";

// A first, cheap gate in front of the private pages. If a request carries no sign-in cookie at all,
// it's sent to the sign-in page straight away, before any page code runs, with a proper redirect.
//
// This only checks that a cookie EXISTS. It can't tell a real sign-in from a made-up cookie, so it is
// not the protection. The protection is that every page and every action asks the database who is
// signed in, and what they're allowed to do. This gate just keeps strangers out of the front door, and
// means a crawler or a script gets a plain redirect instead of a page.
export function proxy(request: NextRequest) {
  if (getSessionCookie(request)) return NextResponse.next();
  const to = request.nextUrl.clone();
  to.pathname = "/sign-in";
  to.search = "";
  return NextResponse.redirect(to);
}

export const config = {
  matcher: ["/places/:path*", "/visits/:path*", "/members/:path*", "/import/:path*", "/waiting"],
};
