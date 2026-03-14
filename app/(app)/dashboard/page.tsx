import Link from "next/link";

import { Topbar } from "@/components/layout/topbar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { formatDate } from "@/lib/utils";

export default async function DashboardPage() {
  const user = await requireUser();

  const clientFilter = user.role === "CLIENT" ? { ownerUserId: user.id } : {};
  const memberFilter = user.role === "TEAM_MEMBER" ? { members: { some: { userId: user.id } } } : {};

  const [totalClients, activeProjects, openTasks, pendingRequests, activity, deadlines] = await Promise.all([
    prisma.client.count({ where: { archivedAt: null, ...clientFilter } }),
    prisma.project.count({ where: { archivedAt: null, status: { in: ["ACTIVE", "PLANNING"] }, ...memberFilter } }),
    prisma.task.count({ where: { status: { in: ["TODO", "IN_PROGRESS", "BLOCKED"] }, ...(user.role === "TEAM_MEMBER" ? { assigneeId: user.id } : {}) } }),
    prisma.serviceRequest.count({ where: { status: { in: ["SUBMITTED", "IN_REVIEW", "IN_PROGRESS"] }, ...(user.role === "CLIENT" ? { createdByUserId: user.id } : {}) } }),
    prisma.activityLog.findMany({ orderBy: { createdAt: "desc" }, take: 8 }),
    prisma.project.findMany({
      where: { deadline: { not: null }, archivedAt: null, ...memberFilter },
      include: { client: true },
      orderBy: { deadline: "asc" },
      take: 5,
    }),
  ]);

  const kpis = [
    { label: "Total Clients", value: totalClients },
    { label: "Active Projects", value: activeProjects },
    { label: "Open Tasks", value: openTasks },
    { label: "Pending Requests", value: pendingRequests },
  ];

  return (
    <div>
      <Topbar title="Dashboard" subtitle="Track operations across clients, projects, and requests." />
      <main className="space-y-6 p-6">
        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {kpis.map((kpi) => (
            <Card key={kpi.label}>
              <CardContent className="py-6">
                <p className="text-sm text-slate-500">{kpi.label}</p>
                <p className="mt-2 text-3xl font-semibold text-slate-900">{kpi.value}</p>
              </CardContent>
            </Card>
          ))}
        </section>

        <section className="grid gap-6 xl:grid-cols-3">
          <Card className="xl:col-span-2">
            <CardHeader className="flex-row items-center justify-between">
              <CardTitle>Recent Activity</CardTitle>
              <Link href="/projects">
                <Button size="sm" variant="secondary">
                  View projects
                </Button>
              </Link>
            </CardHeader>
            <CardContent className="space-y-3">
              {activity.length === 0 ? <p className="text-sm text-slate-500">No recent activity yet.</p> : null}
              {activity.map((entry) => (
                <div key={entry.id} className="flex items-center justify-between rounded-lg border border-slate-100 p-3">
                  <div>
                    <p className="font-medium text-slate-800">{entry.entityType} {entry.action}</p>
                    <p className="text-xs text-slate-500">{entry.entityId}</p>
                  </div>
                  <span className="text-xs text-slate-500">{formatDate(entry.createdAt)}</span>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Upcoming Deadlines</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {deadlines.length === 0 ? <p className="text-sm text-slate-500">No deadlines scheduled.</p> : null}
              {deadlines.map((project) => (
                <div key={project.id} className="rounded-lg border border-slate-100 p-3">
                  <p className="font-medium text-slate-800">{project.name}</p>
                  <p className="text-xs text-slate-500">{project.client.companyName}</p>
                  <div className="mt-2 flex items-center justify-between">
                    <Badge tone="amber">{project.status}</Badge>
                    <span className="text-xs text-slate-500">{formatDate(project.deadline)}</span>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </section>
      </main>
    </div>
  );
}
