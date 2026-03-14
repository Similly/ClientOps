import { Topbar } from "@/components/layout/topbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requireUser } from "@/lib/session";

export default async function SettingsPage() {
  const user = await requireUser();

  return (
    <div>
      <Topbar title="Settings" subtitle="Profile and workspace information." />
      <main className="grid gap-6 p-6 md:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Profile</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm text-slate-600">
            <p><strong>Name:</strong> {user.name}</p>
            <p><strong>Email:</strong> {user.email}</p>
            <p><strong>Role:</strong> {user.role}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Environment</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm text-slate-600">
            <p>Local-first MVP with PostgreSQL + Prisma + NextAuth.</p>
            <p>Use Docker for consistent local setup.</p>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
