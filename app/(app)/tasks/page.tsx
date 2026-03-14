import { Priority, TaskStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";
import Link from "next/link";

import { Topbar } from "@/components/layout/topbar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { logActivity } from "@/lib/activity";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { formatDate } from "@/lib/utils";
import { taskSchema } from "@/lib/validators";

export default async function TasksPage({ searchParams }: { searchParams: Promise<{ status?: string; projectId?: string }> }) {
  const user = await requireUser();
  const { status, projectId } = await searchParams;

  const [projects, teamMembers] = await Promise.all([
    prisma.project.findMany({
      where: {
        archivedAt: null,
        ...(user.role === "TEAM_MEMBER" ? { members: { some: { userId: user.id } } } : {}),
        ...(user.role === "CLIENT" ? { client: { ownerUserId: user.id } } : {}),
      },
      orderBy: { name: "asc" },
    }),
    prisma.user.findMany({ where: { role: "TEAM_MEMBER" }, orderBy: { name: "asc" } }),
  ]);

  const tasks = await prisma.task.findMany({
    where: {
      ...(status ? { status: status as never } : {}),
      ...(projectId ? { projectId } : {}),
      ...(user.role === "TEAM_MEMBER" ? { project: { members: { some: { userId: user.id } } } } : {}),
      ...(user.role === "CLIENT" ? { project: { client: { ownerUserId: user.id } } } : {}),
    },
    include: { project: true, assignee: true },
    orderBy: { createdAt: "desc" },
  });

  async function createTask(formData: FormData) {
    "use server";
    const actor = await requireUser();
    if (actor.role === "CLIENT") return;

    const parsed = taskSchema.parse({
      projectId: formData.get("projectId"),
      title: formData.get("title"),
      description: formData.get("description"),
      assigneeId: formData.get("assigneeId"),
      dueDate: formData.get("dueDate"),
      priority: formData.get("priority"),
      status: formData.get("status"),
    });

    const task = await prisma.task.create({
      data: {
        projectId: parsed.projectId,
        title: parsed.title,
        description: parsed.description || null,
        assigneeId: parsed.assigneeId || null,
        dueDate: parsed.dueDate ? new Date(parsed.dueDate) : null,
        priority: parsed.priority,
        status: parsed.status,
      },
    });

    await logActivity({ actorUserId: actor.id, entityType: "task", entityId: task.id, action: "created" });
    revalidatePath("/tasks");
  }

  async function updateTask(formData: FormData) {
    "use server";
    const actor = await requireUser();
    if (actor.role === "CLIENT") return;

    const taskId = String(formData.get("taskId"));
    const statusValue = String(formData.get("status")) as TaskStatus;

    await prisma.task.update({ where: { id: taskId }, data: { status: statusValue } });
    await logActivity({ actorUserId: actor.id, entityType: "task", entityId: taskId, action: "status_changed", metadata: { status: statusValue } });
    revalidatePath("/tasks");
  }

  async function deleteTask(formData: FormData) {
    "use server";
    const actor = await requireUser();
    if (actor.role === "CLIENT") return;

    const taskId = String(formData.get("taskId"));
    await prisma.task.delete({ where: { id: taskId } });
    await logActivity({ actorUserId: actor.id, entityType: "task", entityId: taskId, action: "deleted" });
    revalidatePath("/tasks");
  }

  return (
    <div>
      <Topbar title="Tasks" subtitle="Coordinate execution across teams and projects." />
      <main className="grid gap-6 p-6 xl:grid-cols-3">
        <Card>
          <CardHeader><CardTitle>New Task</CardTitle></CardHeader>
          <CardContent>
            <form action={createTask} className="space-y-3">
              <div className="space-y-2"><Label>Project</Label><Select name="projectId" required>{projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</Select></div>
              <div className="space-y-2"><Label>Title</Label><Input name="title" required /></div>
              <div className="space-y-2"><Label>Assignee</Label><Select name="assigneeId"><option value="">Unassigned</option>{teamMembers.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}</Select></div>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-2"><Label>Status</Label><Select name="status" defaultValue={TaskStatus.TODO}>{Object.values(TaskStatus).map((v) => <option key={v} value={v}>{v}</option>)}</Select></div>
                <div className="space-y-2"><Label>Priority</Label><Select name="priority" defaultValue={Priority.MEDIUM}>{Object.values(Priority).map((v) => <option key={v} value={v}>{v}</option>)}</Select></div>
              </div>
              <div className="space-y-2"><Label>Due Date</Label><Input type="date" name="dueDate" /></div>
              <Button type="submit" className="w-full">Add Task</Button>
            </form>
          </CardContent>
        </Card>

        <Card className="xl:col-span-2">
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle>Task Board</CardTitle>
            <form action="/tasks" className="flex gap-2">
              <Select name="status" defaultValue={status ?? ""}><option value="">All</option>{Object.values(TaskStatus).map((v) => <option key={v} value={v}>{v}</option>)}</Select>
              <Button type="submit" variant="secondary">Filter</Button>
            </form>
          </CardHeader>
          <CardContent className="space-y-3">
            {tasks.map((task) => (
              <div key={task.id} className="rounded-lg border border-slate-100 p-3">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="font-medium text-slate-800">{task.title}</p>
                    <p className="text-xs text-slate-500">
                      <Link href={`/projects/${task.projectId}`} className="text-blue-600">{task.project.name}</Link>
                      {" · "}
                      {task.assignee?.name ?? "Unassigned"}
                      {" · Due "}
                      {formatDate(task.dueDate)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <form action={updateTask} className="flex items-center gap-2">
                      <input type="hidden" name="taskId" value={task.id} />
                      <Select name="status" defaultValue={task.status}>
                        {Object.values(TaskStatus).map((v) => (
                          <option key={v} value={v}>{v}</option>
                        ))}
                      </Select>
                      <Button size="sm" variant="secondary">Save</Button>
                    </form>
                    {user.role !== "CLIENT" ? (
                      <form action={deleteTask}>
                        <input type="hidden" name="taskId" value={task.id} />
                        <Button size="sm" variant="danger">Delete</Button>
                      </form>
                    ) : null}
                  </div>
                </div>
                <div className="mt-2"><Badge tone={task.priority === "URGENT" ? "rose" : task.priority === "HIGH" ? "amber" : "blue"}>{task.priority}</Badge></div>
              </div>
            ))}
            {tasks.length === 0 ? <p className="text-sm text-slate-500">No tasks available for selected filters.</p> : null}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
