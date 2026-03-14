import Link from "next/link";
import { Topbar } from "@/components/layout/topbar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TD, TH, THead } from "@/components/ui/table";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/session";

export default async function ClientsPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const user = await requireUser();
  const { q } = await searchParams;

  const clients = await prisma.client.findMany({
    where: {
      archivedAt: null,
      ...(user.role === "CLIENT" ? { ownerUserId: user.id } : {}),
      ...(q ? { companyName: { contains: q, mode: "insensitive" } } : {}),
    },
    include: { projects: { where: { archivedAt: null } } },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>
      <Topbar title="Clients" subtitle="Manage contacts and account-level context." />
      <main className="space-y-6 p-6">
        <Card>
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle>Client Directory</CardTitle>
            {user.role !== "CLIENT" ? (
              <Link href="/clients/new">
                <Button>Add Client</Button>
              </Link>
            ) : null}
          </CardHeader>
          <CardContent>
            <form className="mb-4" action="/clients">
              <Input name="q" defaultValue={q} placeholder="Search by company name..." />
            </form>
            <div className="overflow-x-auto">
              <Table>
                <THead>
                  <tr>
                    <TH>Company</TH>
                    <TH>Contact</TH>
                    <TH>Projects</TH>
                    <TH>Status</TH>
                    <TH></TH>
                  </tr>
                </THead>
                <tbody>
                  {clients.map((client) => (
                    <tr key={client.id}>
                      <TD>{client.companyName}</TD>
                      <TD>
                        <p>{client.contactName}</p>
                        <p className="text-xs text-slate-500">{client.contactEmail}</p>
                      </TD>
                      <TD>{client.projects.length}</TD>
                      <TD>
                        <Badge tone={client.status === "ACTIVE" ? "green" : "gray"}>{client.status}</Badge>
                      </TD>
                      <TD>
                        <Link href={`/clients/${client.id}`} className="text-sm font-medium text-blue-600">
                          View
                        </Link>
                      </TD>
                    </tr>
                  ))}
                </tbody>
              </Table>
              {clients.length === 0 ? <p className="p-4 text-sm text-slate-500">No clients found.</p> : null}
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
