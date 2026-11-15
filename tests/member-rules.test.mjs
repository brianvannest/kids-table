// Run with: npm test
// Who is allowed to do what. No database, no browser.
import { test } from "node:test";
import assert from "node:assert/strict";
import { startingAccess, isApproved, isOwner, applyAction, readStatus, readRole, normalizeEmail } from "../lib/memberRules.ts";

const OWNER = "priya@example.com";

test("a new account is a waiting member by default", () => {
  assert.deepEqual(startingAccess("dana@example.com", OWNER, false), { role: "member", status: "waiting" });
});

test("the owner's email becomes the owner, but only while there's no owner yet", () => {
  assert.deepEqual(startingAccess(OWNER, OWNER, false), { role: "owner", status: "member" });
  assert.deepEqual(startingAccess(OWNER, OWNER, true), { role: "member", status: "waiting" });
});

test("capital letters and spaces in the owner's email still match", () => {
  assert.deepEqual(startingAccess("  Priya@Example.COM ", OWNER, false), { role: "owner", status: "member" });
});

test("with no owner email set, nobody becomes the owner", () => {
  assert.deepEqual(startingAccess(OWNER, undefined, false), { role: "member", status: "waiting" });
  assert.deepEqual(startingAccess(OWNER, "", false), { role: "member", status: "waiting" });
  assert.deepEqual(startingAccess("", "", false), { role: "member", status: "waiting" });
});

test("only approved people are approved, and only an approved owner is the owner", () => {
  assert.equal(isApproved({ status: "member" }), true);
  assert.equal(isApproved({ status: "waiting" }), false);
  assert.equal(isApproved({ status: "removed" }), false);
  assert.equal(isApproved(null), false);
  assert.equal(isOwner({ role: "owner", status: "member" }), true);
  assert.equal(isOwner({ role: "owner", status: "removed" }), false, "a removed owner has no power");
  assert.equal(isOwner({ role: "member", status: "member" }), false);
  assert.equal(isOwner(undefined), false);
});

test("the four actions move people between the three statuses", () => {
  const m = (status) => ({ role: "member", status });
  assert.equal(applyAction(m("waiting"), "approve"), "member");
  assert.equal(applyAction(m("waiting"), "decline"), "removed");
  assert.equal(applyAction(m("member"), "remove"), "removed");
  assert.equal(applyAction(m("removed"), "restore"), "member");
});

test("an action that doesn't fit the person's status is refused", () => {
  const m = (status) => ({ role: "member", status });
  assert.equal(applyAction(m("member"), "approve"), null);
  assert.equal(applyAction(m("removed"), "approve"), null);
  assert.equal(applyAction(m("waiting"), "remove"), null);
  assert.equal(applyAction(m("waiting"), "restore"), null);
  assert.equal(applyAction(m("member"), "restore"), null);
});

test("nobody can change the owner, and unknown actions do nothing", () => {
  for (const status of ["waiting", "member", "removed"]) {
    for (const action of ["approve", "decline", "remove", "restore"]) {
      assert.equal(applyAction({ role: "owner", status }, action), null, `owner ${status} ${action}`);
    }
  }
  assert.equal(applyAction({ role: "member", status: "waiting" }, "makeOwner"), null);
  assert.equal(applyAction({ role: "member", status: "waiting" }, ""), null);
  assert.equal(applyAction({ role: "member", status: "waiting" }, "__proto__"), null);
});

test("anything odd in the database is read as the safest value", () => {
  assert.equal(readStatus("member"), "member");
  assert.equal(readStatus(undefined), "removed");
  assert.equal(readStatus("admin"), "removed");
  assert.equal(readStatus(null), "removed");
  assert.equal(readRole("owner"), "owner");
  assert.equal(readRole("superuser"), "member");
  assert.equal(readRole(undefined), "member");
});

test("emails are compared the same way everywhere", () => {
  assert.equal(normalizeEmail("  Dana@Example.com "), "dana@example.com");
});
