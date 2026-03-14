import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { Topbar } from "@/components/layout/topbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { logActivity } from "@/lib/activity";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { clientSchema } from "@/lib/validators";

export default async function NewClientPage() {
  const user = await requireUser();
  if (user.role === "CLIENT") redirect("/clients");

  async function createClient(formData: FormData) {
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

    const client = await prisma.client.create({
      data: {
        ...parsed,
        phone: parsed.phone || null,
        notes: parsed.notes || null,
      },
    });

    await logActivity({ actorUserId: actor.id, entityType: "client", entityId: client.id, action: "created" });
    revalidatePath("/clients");
    redirect(`/clients/${client.id}`);
  }

  return (
    <div>
      <Topbar title="Create Client" subtitle="Add a new account and primary contact." />
      <main className="p-6">
        <Card className="max-w-3xl">
          <CardHeader>
            <CardTitle>Client Details</CardTitle>
          </CardHeader>
          <CardContent>
            <form action={createClient} className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Company Name</Label>
                  <Input name="companyName" required />
                </div>
                <div className="space-y-2">
                  <Label>Contact Name</Label>
                  <Input name="contactName" required />
                </div>
                <div className="space-y-2">
                  <Label>Contact Email</Label>
                  <Input name="contactEmail" type="email" required />
                </div>
                <div className="space-y-2">
                  <Label>Phone</Label>
                  <Input name="phone" />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Notes</Label>
                <Textarea name="notes" />
              </div>
              <Button type="submit">Create Client</Button>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
