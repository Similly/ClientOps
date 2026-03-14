import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { Topbar } from "@/components/layout/topbar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { prisma } from "@/lib/db";
import { canViewProject } from "@/lib/permissions";
import { requireUser } from "@/lib/session";
import { formatCurrency, formatDate } from "@/lib/utils";

export default async function ProjectDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  const { id } = await params;

  const project = await prisma.project.findUnique({
    where: { id },
    include: {
      client: true,
      members: { include: { user: true } },
      tasks: { include: { assignee: true }, orderBy: { createdAt: "desc" }, take: 10 },
      documents: { orderBy: { createdAt: "desc" }, take: 8 },
      serviceRequests: { orderBy: { createdAt: "desc" }, take: 8 },
      _count: { select: { tasks: true, documents: true, serviceRequests: true } },
    },
  });

  if (!project) notFound();
  if (
    !canViewProject(user, project, {
      clientOwnerUserId: project.client.ownerUserId,
      isMember: project.members.some((member) => member.userId === user.id),
    })
  ) {
    redirect("/projects");
  }

  return (
    <div>
      <Topbar title={project.name} subtitle={`${project.client.companyName} · ${project.status}`} />
      <main className="space-y-6 p-6">
        <section className="grid gap-4 md:grid-cols-4">
          <Card><CardContent className="py-5"><p className="text-sm text-slate-500">Budget</p><p className="text-xl font-semibold">{formatCurrency(Number(project.budget ?? 0))}</p></CardContent></Card>
          <Card><CardContent className="py-5"><p className="text-sm text-slate-500">Deadline</p><p className="text-xl font-semibold">{formatDate(project.deadline)}</p></CardContent></Card>
          <Card><CardContent className="py-5"><p className="text-sm text-slate-500">Open Tasks</p><p className="text-xl font-semibold">{project.tasks.filter((task) => task.status !== "DONE").length}</p></CardContent></Card>
          <Card><CardContent className="py-5"><p className="text-sm text-slate-500">Requests</p><p className="text-xl font-semibold">{project._count.serviceRequests}</p></CardContent></Card>
        </section>

        <section className="grid gap-6 xl:grid-cols-3">
          <Card className="xl:col-span-2">
            <CardHeader className="flex-row items-center justify-between">
              <CardTitle>Tasks</CardTitle>
              <Link href="/tasks"><Button size="sm" variant="secondary">Manage Tasks</Button></Link>
            </CardHeader>
            <CardContent className="space-y-2">
              {project.tasks.map((task) => (
                <div key={task.id} className="rounded-md border border-slate-100 p-3">
                  <div className="flex items-center justify-between">
                    <p className="font-medium text-slate-800">{task.title}</p>
                    <Badge tone={task.status === "DONE" ? "green" : task.status === "BLOCKED" ? "rose" : "blue"}>{task.status}</Badge>
                  </div>
                  <p className="text-xs text-slate-500">Assignee: {task.assignee?.name ?? "Unassigned"}</p>
                </div>
              ))}
              {project.tasks.length === 0 ? <p className="text-sm text-slate-500">No tasks yet.</p> : null}
            </CardContent>
          </Card>

          <div className="space-y-6">
            <Card>
              <CardHeader className="flex-row items-center justify-between">
                <CardTitle>Team</CardTitle>
                {user.role !== "CLIENT" ? (
                  <Link href={`/projects/${project.id}/edit`} className="text-sm font-medium text-blue-600">Edit</Link>
                ) : null}
              </CardHeader>
              <CardContent className="space-y-2">
                {project.members.map((member) => (
                  <div key={member.id} className="rounded-md border border-slate-100 px-3 py-2 text-sm text-slate-600">
                    {member.user.name}
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Documents</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {project.documents.map((doc) => (
                  <p key={doc.id} className="truncate text-sm text-slate-600">{doc.originalName}</p>
                ))}
                {project.documents.length === 0 ? <p className="text-sm text-slate-500">No docs uploaded.</p> : null}
              </CardContent>
            </Card>
          </div>
        </section>
      </main>
    </div>
  );
}
