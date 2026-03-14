import { Priority, ProjectStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { notFound, redirect } from "next/navigation";

import { Topbar } from "@/components/layout/topbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { logActivity } from "@/lib/activity";
import { prisma } from "@/lib/db";
import { canViewProject } from "@/lib/permissions";
import { requireUser } from "@/lib/session";
import { projectSchema } from "@/lib/validators";

export default async function EditProjectPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  const { id } = await params;

  const [project, clients, teamMembers] = await Promise.all([
    prisma.project.findUnique({ include: { client: true, members: true }, where: { id } }),
    prisma.client.findMany({ where: { archivedAt: null }, orderBy: { companyName: "asc" } }),
    prisma.user.findMany({ where: { role: "TEAM_MEMBER" }, orderBy: { name: "asc" } }),
  ]);

  if (!project) notFound();
  if (
    user.role === "CLIENT" ||
    !canViewProject(user, project, {
      clientOwnerUserId: project.client.ownerUserId,
      isMember: project.members.some((m) => m.userId === user.id),
    })
  ) {
    redirect("/projects");
  }

  async function updateProject(formData: FormData) {
    "use server";
    const actor = await requireUser();
    if (actor.role === "CLIENT") return;

    const memberIds = formData.getAll("memberIds").map((value) => String(value));
    const parsed = projectSchema.parse({
      name: formData.get("name"),
      description: formData.get("description"),
      clientId: formData.get("clientId"),
      status: formData.get("status"),
      priority: formData.get("priority"),
      budget: formData.get("budget"),
      deadline: formData.get("deadline"),
      memberIds,
    });

    await prisma.project.update({
      where: { id },
      data: {
        name: parsed.name,
        description: parsed.description || null,
        clientId: parsed.clientId,
        status: parsed.status,
        priority: parsed.priority,
        budget: parsed.budget ?? null,
        deadline: parsed.deadline ? new Date(parsed.deadline) : null,
        members: {
          deleteMany: {},
          createMany: {
            data: (parsed.memberIds ?? []).map((memberId) => ({ userId: memberId })),
          },
        },
      },
    });

    await logActivity({ actorUserId: actor.id, entityType: "project", entityId: id, action: "updated" });
    revalidatePath(`/projects/${id}`);
    redirect(`/projects/${id}`);
  }

  async function archiveProject() {
    "use server";
    const actor = await requireUser();
    if (actor.role === "CLIENT") return;

    await prisma.project.update({ where: { id }, data: { archivedAt: new Date(), status: "COMPLETED" } });
    await logActivity({ actorUserId: actor.id, entityType: "project", entityId: id, action: "archived" });
    revalidatePath("/projects");
    redirect("/projects");
  }

  return (
    <div>
      <Topbar title="Edit Project" subtitle={`Update ${project.name}`} />
      <main className="p-6">
        <Card className="max-w-4xl">
          <CardHeader>
            <CardTitle>Project Details</CardTitle>
          </CardHeader>
          <CardContent>
            <form action={updateProject} className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2"><Label>Project Name</Label><Input name="name" required defaultValue={project.name} /></div>
                <div className="space-y-2"><Label>Client</Label><Select name="clientId" defaultValue={project.clientId}>{clients.map((c) => <option key={c.id} value={c.id}>{c.companyName}</option>)}</Select></div>
                <div className="space-y-2"><Label>Status</Label><Select name="status" defaultValue={project.status}>{Object.values(ProjectStatus).map((v) => <option key={v} value={v}>{v}</option>)}</Select></div>
                <div className="space-y-2"><Label>Priority</Label><Select name="priority" defaultValue={project.priority}>{Object.values(Priority).map((v) => <option key={v} value={v}>{v}</option>)}</Select></div>
                <div className="space-y-2"><Label>Budget</Label><Input type="number" name="budget" defaultValue={Number(project.budget ?? 0)} /></div>
                <div className="space-y-2"><Label>Deadline</Label><Input type="date" name="deadline" defaultValue={project.deadline ? project.deadline.toISOString().slice(0, 10) : ""} /></div>
              </div>
              <div className="space-y-2"><Label>Description</Label><Textarea name="description" defaultValue={project.description ?? ""} /></div>
              <div className="space-y-2">
                <Label>Team Members</Label>
                <div className="grid gap-2 md:grid-cols-2">
                  {teamMembers.map((member) => (
                    <label key={member.id} className="flex items-center gap-2 rounded-md border border-slate-200 p-2 text-sm">
                      <input type="checkbox" name="memberIds" value={member.id} defaultChecked={project.members.some((m) => m.userId === member.id)} />
                      {member.name}
                    </label>
                  ))}
                </div>
              </div>
              <div className="flex gap-3">
                <Button type="submit">Save Changes</Button>
                <Button type="button" variant="danger" formAction={archiveProject}>Archive Project</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
