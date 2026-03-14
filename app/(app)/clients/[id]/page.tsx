import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { Topbar } from "@/components/layout/topbar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { prisma } from "@/lib/db";
import { canViewClient } from "@/lib/permissions";
import { requireUser } from "@/lib/session";
import { formatDate } from "@/lib/utils";

export default async function ClientDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  const { id } = await params;

  const client = await prisma.client.findUnique({
    where: { id },
    include: {
      projects: { where: { archivedAt: null }, orderBy: { createdAt: "desc" } },
      serviceRequests: { orderBy: { createdAt: "desc" }, take: 5 },
    },
  });

  if (!client) notFound();
  if (!canViewClient(user, client)) redirect("/dashboard");

  return (
    <div>
      <Topbar title={client.companyName} subtitle="Client account overview and related work." />
      <main className="grid gap-6 p-6 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle>Projects</CardTitle>
            {user.role !== "CLIENT" ? (
              <Link href="/projects/new">
                <Button size="sm">New Project</Button>
              </Link>
            ) : null}
          </CardHeader>
          <CardContent className="space-y-3">
            {client.projects.map((project) => (
              <div key={project.id} className="rounded-lg border border-slate-100 p-3">
                <div className="flex items-center justify-between">
                  <Link href={`/projects/${project.id}`} className="font-medium text-slate-900 hover:text-blue-600">
                    {project.name}
                  </Link>
                  <Badge tone={project.status === "ACTIVE" ? "green" : "gray"}>{project.status}</Badge>
                </div>
                <p className="mt-1 text-sm text-slate-500">{project.description ?? "No description"}</p>
              </div>
            ))}
            {client.projects.length === 0 ? <p className="text-sm text-slate-500">No active projects for this client.</p> : null}
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader className="flex-row items-center justify-between">
              <CardTitle>Client Info</CardTitle>
              {user.role !== "CLIENT" ? (
                <Link href={`/clients/${client.id}/edit`} className="text-sm font-medium text-blue-600">
                  Edit
                </Link>
              ) : null}
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <p className="text-slate-600">{client.contactName}</p>
              <p className="text-slate-600">{client.contactEmail}</p>
              <p className="text-slate-600">{client.phone ?? "No phone"}</p>
              <p className="text-slate-500">Created {formatDate(client.createdAt)}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Recent Requests</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {client.serviceRequests.map((request) => (
                <div key={request.id} className="rounded-lg border border-slate-100 p-3">
                  <p className="font-medium text-slate-800">{request.title}</p>
                  <p className="text-xs text-slate-500">{request.type}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
