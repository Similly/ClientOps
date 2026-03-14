import { describe, expect, it } from "vitest";

import { canViewClient, canViewProject } from "@/lib/permissions";

describe("permission helpers", () => {
  it("allows admins to view any client", () => {
    expect(canViewClient({ id: "u1", role: "ADMIN" }, { ownerUserId: null })).toBe(true);
  });

  it("prevents clients from viewing others", () => {
    expect(canViewClient({ id: "u1", role: "CLIENT" }, { ownerUserId: "u2" })).toBe(false);
  });

  it("requires team member membership to view project", () => {
    expect(canViewProject({ id: "u1", role: "TEAM_MEMBER" }, { clientId: "c1" }, { isMember: false })).toBe(false);
    expect(canViewProject({ id: "u1", role: "TEAM_MEMBER" }, { clientId: "c1" }, { isMember: true })).toBe(true);
  });
});
