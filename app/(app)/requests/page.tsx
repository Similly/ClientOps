import { Priority, RequestStatus, RequestType } from "@prisma/client";
import { revalidatePath } from "next/cache";

import { Topbar } from "@/components/layout/topbar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { logActivity } from "@/lib/activity";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { formatDate } from "@/lib/utils";
import { requestSchema } from "@/lib/validators";

export default async function RequestsPage() {
  const user = await requireUser();

  const [clients, projects, requests] = await Promise.all([
    prisma.client.findMany({ where: { ...(user.role === "CLIENT" ? { ownerUserId: user.id } : {}), archivedAt: null }, orderBy: { companyName: "asc" } }),
    prisma.project.findMany({ where: { ...(user.role === "CLIENT" ? { client: { ownerUserId: user.id } } : {}), archivedAt: null }, orderBy: { name: "asc" } }),
    prisma.serviceRequest.findMany({
      where: {
        ...(user.role === "CLIENT" ? { createdByUserId: user.id } : {}),
        ...(user.role === "TEAM_MEMBER" ? { project: { members: { some: { userId: user.id } } } } : {}),
      },
      include: { client: true, project: true, createdBy: true },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  async function submitRequest(formData: FormData) {
    "use server";
    const actor = await requireUser();

    const parsed = requestSchema.parse({
      clientId: formData.get("clientId"),
      projectId: formData.get("projectId"),
      type: formData.get("type"),
      title: formData.get("title"),
      description: formData.get("description"),
      priority: formData.get("priority"),
    });

    const request = await prisma.serviceRequest.create({
      data: {
        clientId: parsed.clientId,
        projectId: parsed.projectId || null,
        createdByUserId: actor.id,
        type: parsed.type,
        title: parsed.title,
        description: parsed.description,
        priority: parsed.priority,
      },
    });

    await logActivity({ actorUserId: actor.id, entityType: "serviceRequest", entityId: request.id, action: "submitted" });
    revalidatePath("/requests");
  }

  async function updateRequest(formData: FormData) {
    "use server";
    const actor = await requireUser();
    if (actor.role === "CLIENT") return;

    const requestId = String(formData.get("requestId"));
    const status = String(formData.get("status")) as RequestStatus;
    const internalNotes = String(formData.get("internalNotes") || "");

    await prisma.serviceRequest.update({
      where: { id: requestId },
      data: {
        status,
        internalNotes: internalNotes || null,
      },
    });

    await logActivity({ actorUserId: actor.id, entityType: "serviceRequest", entityId: requestId, action: "updated", metadata: { status } });
    revalidatePath("/requests");
  }

  return (
    <div>
      <Topbar title="Service Requests" subtitle="Collect, triage, and resolve incoming client asks." />
      <main className="grid gap-6 p-6 xl:grid-cols-3">
        <Card>
          <CardHeader><CardTitle>Submit Request</CardTitle></CardHeader>
          <CardContent>
            <form action={submitRequest} className="space-y-3">
              <div className="space-y-2"><Label>Client</Label><Select name="clientId" required>{clients.map((client) => <option key={client.id} value={client.id}>{client.companyName}</option>)}</Select></div>
              <div className="space-y-2"><Label>Project</Label><Select name="projectId"><option value="">No linked project</option>{projects.map((project) => <option key={project.id} value={project.id}>{project.name}</option>)}</Select></div>
              <div className="space-y-2"><Label>Type</Label><Select name="type" defaultValue={RequestType.SUPPORT_REQUEST}>{Object.values(RequestType).map((type) => <option key={type} value={type}>{type}</option>)}</Select></div>
              <div className="space-y-2"><Label>Priority</Label><Select name="priority" defaultValue={Priority.MEDIUM}>{Object.values(Priority).map((priority) => <option key={priority} value={priority}>{priority}</option>)}</Select></div>
              <div className="space-y-2"><Label>Title</Label><Input name="title" required /></div>
              <div className="space-y-2"><Label>Description</Label><Textarea name="description" required /></div>
              <Button type="submit" className="w-full">Submit</Button>
            </form>
          </CardContent>
        </Card>

        <Card className="xl:col-span-2">
          <CardHeader><CardTitle>Request Queue</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {requests.map((request) => (
              <div key={request.id} className="rounded-lg border border-slate-100 p-3">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="font-medium text-slate-800">{request.title}</p>
                    <p className="text-xs text-slate-500">
                      {request.client.companyName} · {request.createdBy.name} · {formatDate(request.createdAt)}
                    </p>
                  </div>
                  <Badge tone={request.status === "COMPLETED" ? "green" : request.status === "REJECTED" ? "rose" : "blue"}>{request.status}</Badge>
                </div>
                <p className="mt-2 text-sm text-slate-600">{request.description}</p>
                <div className="mt-3 flex items-center gap-2">
                  <Badge tone="amber">{request.type}</Badge>
                  <Badge tone="gray">{request.priority}</Badge>
                </div>
                {user.role !== "CLIENT" ? (
                  <form action={updateRequest} className="mt-3 grid gap-2 md:grid-cols-[200px_1fr_auto]">
                    <input type="hidden" name="requestId" value={request.id} />
                    <Select name="status" defaultValue={request.status}>{Object.values(RequestStatus).map((statusValue) => <option key={statusValue} value={statusValue}>{statusValue}</option>)}</Select>
                    <Input name="internalNotes" defaultValue={request.internalNotes ?? ""} placeholder="Internal notes" />
                    <Button size="sm" variant="secondary">Update</Button>
                  </form>
                ) : null}
              </div>
            ))}
            {requests.length === 0 ? <p className="text-sm text-slate-500">No service requests yet.</p> : null}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
