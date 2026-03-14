import Link from "next/link";

import { Topbar } from "@/components/layout/topbar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TD, TH, THead } from "@/components/ui/table";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { formatCurrency, formatDate } from "@/lib/utils";

export default async function ProjectsPage({ searchParams }: { searchParams: Promise<{ q?: string; status?: string }> }) {
  const user = await requireUser();
  const { q, status } = await searchParams;

  const projects = await prisma.project.findMany({
    where: {
      archivedAt: null,
      ...(status ? { status: status as never } : {}),
      ...(q ? { name: { contains: q, mode: "insensitive" } } : {}),
      ...(user.role === "TEAM_MEMBER" ? { members: { some: { userId: user.id } } } : {}),
      ...(user.role === "CLIENT" ? { client: { ownerUserId: user.id } } : {}),
    },
    include: {
      client: true,
      members: { include: { user: true } },
      tasks: true,
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>
      <Topbar title="Projects" subtitle="Track project delivery across all accounts." />
      <main className="space-y-6 p-6">
        <Card>
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle>Project Portfolio</CardTitle>
            {user.role !== "CLIENT" ? (
              <Link href="/projects/new">
                <Button>New Project</Button>
              </Link>
            ) : null}
          </CardHeader>
          <CardContent>
            <form action="/projects" className="mb-4 grid gap-3 md:grid-cols-3">
              <Input name="q" defaultValue={q} placeholder="Search project name..." />
              <select name="status" defaultValue={status ?? ""} className="h-10 rounded-md border border-slate-200 bg-white px-3 text-sm">
                <option value="">All Statuses</option>
                <option value="PLANNING">Planning</option>
                <option value="ACTIVE">Active</option>
                <option value="ON_HOLD">On Hold</option>
                <option value="COMPLETED">Completed</option>
              </select>
              <Button type="submit" variant="secondary">
                Filter
              </Button>
            </form>
            <div className="overflow-x-auto">
              <Table>
                <THead>
                  <tr>
                    <TH>Project</TH>
                    <TH>Client</TH>
                    <TH>Status</TH>
                    <TH>Budget</TH>
                    <TH>Deadline</TH>
                    <TH></TH>
                  </tr>
                </THead>
                <tbody>
                  {projects.map((project) => (
                    <tr key={project.id}>
                      <TD>
                        <p className="font-medium text-slate-800">{project.name}</p>
                        <p className="text-xs text-slate-500">{project.tasks.length} tasks</p>
                      </TD>
                      <TD>{project.client.companyName}</TD>
                      <TD>
                        <Badge tone={project.status === "ACTIVE" ? "green" : project.status === "ON_HOLD" ? "amber" : "gray"}>{project.status}</Badge>
                      </TD>
                      <TD>{formatCurrency(Number(project.budget ?? 0))}</TD>
                      <TD>{formatDate(project.deadline)}</TD>
                      <TD>
                        <Link href={`/projects/${project.id}`} className="text-sm font-medium text-blue-600">
                          Open
                        </Link>
                      </TD>
                    </tr>
                  ))}
                </tbody>
              </Table>
              {projects.length === 0 ? <p className="p-4 text-sm text-slate-500">No projects found.</p> : null}
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
