import { Priority, ProjectStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { Topbar } from "@/components/layout/topbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { logActivity } from "@/lib/activity";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { projectSchema } from "@/lib/validators";

export default async function NewProjectPage() {
  const user = await requireUser();
  if (user.role === "CLIENT") redirect("/projects");

  const [clients, teamMembers] = await Promise.all([
    prisma.client.findMany({ where: { archivedAt: null }, orderBy: { companyName: "asc" } }),
    prisma.user.findMany({ where: { role: "TEAM_MEMBER" }, orderBy: { name: "asc" } }),
  ]);

  async function createProject(formData: FormData) {
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

    const project = await prisma.project.create({
      data: {
        name: parsed.name,
        description: parsed.description || null,
        clientId: parsed.clientId,
        status: parsed.status,
        priority: parsed.priority,
        budget: parsed.budget ?? null,
        deadline: parsed.deadline ? new Date(parsed.deadline) : null,
        members: {
          createMany: {
            data: (parsed.memberIds ?? []).map((memberId) => ({ userId: memberId })),
          },
        },
      },
    });

    await logActivity({ actorUserId: actor.id, entityType: "project", entityId: project.id, action: "created" });
    revalidatePath("/projects");
    redirect(`/projects/${project.id}`);
  }

  return (
    <div>
      <Topbar title="Create Project" subtitle="Define project scope, ownership, and delivery timeline." />
      <main className="p-6">
        <Card className="max-w-4xl">
          <CardHeader>
            <CardTitle>Project Details</CardTitle>
          </CardHeader>
          <CardContent>
            <form action={createProject} className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Project Name</Label>
                  <Input name="name" required />
                </div>
                <div className="space-y-2">
                  <Label>Client</Label>
                  <Select name="clientId" required>
                    <option value="">Select client</option>
                    {clients.map((client) => (
                      <option key={client.id} value={client.id}>
                        {client.companyName}
                      </option>
                    ))}
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select name="status" defaultValue={ProjectStatus.PLANNING}>
                    {Object.values(ProjectStatus).map((status) => (
                      <option key={status} value={status}>{status}</option>
                    ))}
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Priority</Label>
                  <Select name="priority" defaultValue={Priority.MEDIUM}>
                    {Object.values(Priority).map((priority) => (
                      <option key={priority} value={priority}>{priority}</option>
                    ))}
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Budget (USD)</Label>
                  <Input name="budget" type="number" min={0} step="100" />
                </div>
                <div className="space-y-2">
                  <Label>Deadline</Label>
                  <Input name="deadline" type="date" />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea name="description" />
              </div>

              <div className="space-y-2">
                <Label>Assign Team Members</Label>
                <div className="grid gap-2 md:grid-cols-2">
                  {teamMembers.map((member) => (
                    <label key={member.id} className="flex items-center gap-2 rounded-md border border-slate-200 p-2 text-sm">
                      <input type="checkbox" name="memberIds" value={member.id} />
                      {member.name}
                    </label>
                  ))}
                </div>
              </div>

              <Button type="submit">Create Project</Button>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
