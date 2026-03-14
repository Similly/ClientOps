import { DocumentVisibility } from "@prisma/client";
import { revalidatePath } from "next/cache";

import { Topbar } from "@/components/layout/topbar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { logActivity } from "@/lib/activity";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { saveUpload } from "@/lib/storage";
import { formatDate } from "@/lib/utils";

export default async function DocumentsPage() {
  const user = await requireUser();

  const [projects, clients, documents] = await Promise.all([
    prisma.project.findMany({
      where: {
        archivedAt: null,
        ...(user.role === "TEAM_MEMBER" ? { members: { some: { userId: user.id } } } : {}),
        ...(user.role === "CLIENT" ? { client: { ownerUserId: user.id } } : {}),
      },
      orderBy: { name: "asc" },
    }),
    prisma.client.findMany({
      where: {
        archivedAt: null,
        ...(user.role === "CLIENT" ? { ownerUserId: user.id } : {}),
      },
      orderBy: { companyName: "asc" },
    }),
    prisma.document.findMany({
      where: {
        ...(user.role === "CLIENT" ? { client: { ownerUserId: user.id }, visibility: "CLIENT_SHARED" } : {}),
        ...(user.role === "TEAM_MEMBER" ? { OR: [{ visibility: "CLIENT_SHARED" }, { uploadedByUserId: user.id }] } : {}),
      },
      include: { project: true, client: true, uploadedBy: true },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  async function uploadDocument(formData: FormData) {
    "use server";
    const actor = await requireUser();
    if (actor.role === "CLIENT" && formData.get("visibility") === "INTERNAL") return;

    const file = formData.get("file");
    if (!(file instanceof File)) {
      throw new Error("Please choose a valid file.");
    }

    const fileData = await saveUpload(file);
    const document = await prisma.document.create({
      data: {
        projectId: String(formData.get("projectId") || "") || null,
        clientId: String(formData.get("clientId") || "") || null,
        visibility: String(formData.get("visibility")) as DocumentVisibility,
        uploadedByUserId: actor.id,
        ...fileData,
      },
    });

    await logActivity({ actorUserId: actor.id, entityType: "document", entityId: document.id, action: "uploaded" });
    revalidatePath("/documents");
  }

  return (
    <div>
      <Topbar title="Documents" subtitle="Upload and share project files securely." />
      <main className="grid gap-6 p-6 xl:grid-cols-3">
        <Card>
          <CardHeader><CardTitle>Upload File</CardTitle></CardHeader>
          <CardContent>
            <form action={uploadDocument} className="space-y-3" encType="multipart/form-data">
              <div className="space-y-2">
                <Label>File</Label>
                <input type="file" name="file" required className="w-full rounded-md border border-slate-200 p-2 text-sm" />
              </div>
              <div className="space-y-2"><Label>Client</Label><Select name="clientId"><option value="">No specific client</option>{clients.map((client) => <option key={client.id} value={client.id}>{client.companyName}</option>)}</Select></div>
              <div className="space-y-2"><Label>Project</Label><Select name="projectId"><option value="">No specific project</option>{projects.map((project) => <option key={project.id} value={project.id}>{project.name}</option>)}</Select></div>
              <div className="space-y-2">
                <Label>Visibility</Label>
                <Select name="visibility" defaultValue={user.role === "CLIENT" ? "CLIENT_SHARED" : "INTERNAL"}>
                  {user.role !== "CLIENT" ? <option value="INTERNAL">Internal only</option> : null}
                  <option value="CLIENT_SHARED">Client shared</option>
                </Select>
              </div>
              <Button type="submit" className="w-full">Upload</Button>
            </form>
          </CardContent>
        </Card>

        <Card className="xl:col-span-2">
          <CardHeader><CardTitle>Document Library</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {documents.map((document) => (
              <div key={document.id} className="flex items-center justify-between rounded-lg border border-slate-100 p-3">
                <div>
                  <p className="font-medium text-slate-800">{document.originalName}</p>
                  <p className="text-xs text-slate-500">
                    {document.client?.companyName ?? "General"} · {document.project?.name ?? "No project"} · Uploaded by {document.uploadedBy.name}
                  </p>
                  <p className="text-xs text-slate-500">{formatDate(document.createdAt)}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge tone={document.visibility === "CLIENT_SHARED" ? "green" : "gray"}>{document.visibility}</Badge>
                  <a href={`/api/documents/${document.id}`} className="text-sm font-medium text-blue-600">Download</a>
                </div>
              </div>
            ))}
            {documents.length === 0 ? <p className="text-sm text-slate-500">No documents uploaded.</p> : null}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
