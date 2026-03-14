import { UserRole } from "@prisma/client";

import { prisma } from "@/lib/db";
import { clientSchema } from "@/lib/validators";

export async function createClientService(input: unknown, actor: { id: string; role: UserRole }) {
  if (actor.role === UserRole.CLIENT) {
    throw new Error("Unauthorized");
  }

  const parsed = clientSchema.parse(input);

  return prisma.client.create({
    data: {
      companyName: parsed.companyName,
      contactName: parsed.contactName,
      contactEmail: parsed.contactEmail,
      phone: parsed.phone || null,
      notes: parsed.notes || null,
    },
  });
}
