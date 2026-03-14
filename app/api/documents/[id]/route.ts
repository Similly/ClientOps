import fs from "node:fs/promises";
import path from "node:path";

import { NextResponse } from "next/server";

import { getAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getAuthSession();
  if (!session?.user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const document = await prisma.document.findUnique({
    where: { id },
    include: {
      client: true,
      project: { include: { members: true } },
    },
  });

  if (!document) {
    return NextResponse.json({ message: "Not found" }, { status: 404 });
  }

  const user = session.user;
  const canAccess =
    user.role === "ADMIN" ||
    (user.role === "TEAM_MEMBER" && (document.project?.members.some((m) => m.userId === user.id) || document.uploadedByUserId === user.id)) ||
    (user.role === "CLIENT" && document.visibility === "CLIENT_SHARED" && document.client?.ownerUserId === user.id);

  if (!canAccess) {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }

  const absolutePath = path.join(process.cwd(), document.storedPath);
  const file = await fs.readFile(absolutePath);

  return new NextResponse(file, {
    headers: {
      "Content-Type": document.mimeType,
      "Content-Disposition": `attachment; filename=\"${document.originalName}\"`,
    },
  });
}
