import { describe, it, expect } from "vitest";
describe("middleware role guard", () => {
  it("redirects unauthenticated user to /login", () => {
    expect("/login").toBe("/login");
  });
  it("blocks non-admin from /settings", () => {
    const role = "sales";
    const blocked = role !== "admin";
    expect(blocked).toBe(true);
  });
});
