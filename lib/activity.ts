import { Prisma } from "@prisma/client";

import { prisma } from "@/lib/db";

export async function logActivity(params: {
  actorUserId?: string;
  entityType: string;
  entityId: string;
  action: string;
  metadata?: Prisma.InputJsonValue;
}) {
  await prisma.activityLog.create({
    data: {
      actorUserId: params.actorUserId,
      entityType: params.entityType,
      entityId: params.entityId,
      action: params.action,
      metadata: params.metadata,
    },
  });
}
