import { UserRole } from "@prisma/client";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { prisma } from "@/lib/db";
import { createClientService } from "@/lib/services/client-service";

vi.mock("@/lib/db", () => ({
  prisma: {
    client: {
      create: vi.fn(),
    },
  },
}));

describe("createClientService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("creates client for admin", async () => {
    vi.mocked(prisma.client.create).mockResolvedValueOnce({ id: "c1" } as never);

    const result = await createClientService(
      {
        companyName: "Orbit Co",
        contactName: "Taylor",
        contactEmail: "taylor@orbit.co",
      },
      { id: "u1", role: UserRole.ADMIN },
    );

    expect(result).toEqual({ id: "c1" });
    expect(prisma.client.create).toHaveBeenCalledOnce();
  });

  it("rejects client role", async () => {
    await expect(
      createClientService(
        {
          companyName: "Orbit Co",
          contactName: "Taylor",
          contactEmail: "taylor@orbit.co",
        },
        { id: "u1", role: UserRole.CLIENT },
      ),
    ).rejects.toThrow("Unauthorized");
  });
});
