import { revalidatePath } from "next/cache";
import { notFound, redirect } from "next/navigation";

import { Topbar } from "@/components/layout/topbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { logActivity } from "@/lib/activity";
import { prisma } from "@/lib/db";
import { canViewClient } from "@/lib/permissions";
import { requireUser } from "@/lib/session";
import { clientSchema } from "@/lib/validators";

export default async function EditClientPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  const { id } = await params;
  const client = await prisma.client.findUnique({ where: { id } });

  if (!client) notFound();
  if (!canViewClient(user, client) || user.role === "CLIENT") redirect("/clients");

  async function updateClient(formData: FormData) {
    "use server";
    const actor = await requireUser();
    if (actor.role === "CLIENT") return;

    const parsed = clientSchema.parse({
      companyName: formData.get("companyName"),
      contactName: formData.get("contactName"),
      contactEmail: formData.get("contactEmail"),
      phone: formData.get("phone"),
      notes: formData.get("notes"),
    });

    await prisma.client.update({
      where: { id },
      data: {
        ...parsed,
        phone: parsed.phone || null,
        notes: parsed.notes || null,
      },
    });

    await logActivity({ actorUserId: actor.id, entityType: "client", entityId: id, action: "updated" });
    revalidatePath(`/clients/${id}`);
    redirect(`/clients/${id}`);
  }

  async function archiveClient() {
    "use server";
    const actor = await requireUser();
    if (actor.role === "CLIENT") return;

    await prisma.client.update({ where: { id }, data: { archivedAt: new Date(), status: "INACTIVE" } });
    await logActivity({ actorUserId: actor.id, entityType: "client", entityId: id, action: "archived" });
    revalidatePath("/clients");
    redirect("/clients");
  }

  return (
    <div>
      <Topbar title="Edit Client" subtitle={`Update ${client.companyName}`} />
      <main className="space-y-6 p-6">
        <Card className="max-w-3xl">
          <CardHeader>
            <CardTitle>Client Details</CardTitle>
          </CardHeader>
          <CardContent>
            <form action={updateClient} className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Company Name</Label>
                  <Input name="companyName" required defaultValue={client.companyName} />
                </div>
                <div className="space-y-2">
                  <Label>Contact Name</Label>
                  <Input name="contactName" required defaultValue={client.contactName} />
                </div>
                <div className="space-y-2">
                  <Label>Contact Email</Label>
                  <Input name="contactEmail" type="email" required defaultValue={client.contactEmail} />
                </div>
                <div className="space-y-2">
                  <Label>Phone</Label>
                  <Input name="phone" defaultValue={client.phone ?? ""} />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Notes</Label>
                <Textarea name="notes" defaultValue={client.notes ?? ""} />
              </div>
              <div className="flex items-center gap-3">
                <Button type="submit">Save Changes</Button>
                <Button type="button" variant="danger" formAction={archiveClient}>
                  Archive Client
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
