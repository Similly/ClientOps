import { describe, expect, it } from "vitest";

import { clientSchema, loginSchema } from "@/lib/validators";

describe("validators", () => {
  it("accepts valid login payload", () => {
    const parsed = loginSchema.parse({ email: "admin@clientops.dev", password: "Password123!" });
    expect(parsed.email).toBe("admin@clientops.dev");
  });

  it("rejects invalid client payload", () => {
    const result = clientSchema.safeParse({ companyName: "A", contactName: "", contactEmail: "nope" });
    expect(result.success).toBe(false);
  });
});
