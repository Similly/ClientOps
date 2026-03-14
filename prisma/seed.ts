import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient, Priority, ProjectStatus, RequestStatus, RequestType, TaskStatus, UserRole } from "@prisma/client";
import bcrypt from "bcryptjs";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL missing for seed");
}

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString }),
});

async function main() {
  await prisma.activityLog.deleteMany();
  await prisma.document.deleteMany();
  await prisma.serviceRequest.deleteMany();
  await prisma.task.deleteMany();
  await prisma.projectMember.deleteMany();
  await prisma.project.deleteMany();
  await prisma.client.deleteMany();
  await prisma.user.deleteMany();

  const passwordHash = await bcrypt.hash("Password123!", 10);

  const [admin, teamA, teamB, clientUserA, clientUserB] = await Promise.all([
    prisma.user.create({ data: { name: "Avery Admin", email: "admin@clientops.dev", passwordHash, role: UserRole.ADMIN } }),
    prisma.user.create({ data: { name: "Taylor Team", email: "team1@clientops.dev", passwordHash, role: UserRole.TEAM_MEMBER } }),
    prisma.user.create({ data: { name: "Jordan Ops", email: "team2@clientops.dev", passwordHash, role: UserRole.TEAM_MEMBER } }),
    prisma.user.create({ data: { name: "Morgan Client", email: "client1@clientops.dev", passwordHash, role: UserRole.CLIENT } }),
    prisma.user.create({ data: { name: "Riley Client", email: "client2@clientops.dev", passwordHash, role: UserRole.CLIENT } }),
  ]);

  const clientA = await prisma.client.create({
    data: {
      companyName: "Northwind Advisory",
      contactName: "Morgan Client",
      contactEmail: "morgan@northwind.com",
      phone: "+1-415-555-1101",
      notes: "Monthly retainer and analytics support.",
      ownerUserId: clientUserA.id,
    },
  });

  const clientB = await prisma.client.create({
    data: {
      companyName: "BluePeak Studio",
      contactName: "Riley Client",
      contactEmail: "riley@bluepeak.co",
      phone: "+1-415-555-1102",
      notes: "Website optimization and support.",
      ownerUserId: clientUserB.id,
    },
  });

  const clientC = await prisma.client.create({
    data: {
      companyName: "Summit Legal Group",
      contactName: "Dana Cole",
      contactEmail: "dana@summitlegal.com",
      phone: "+1-415-555-1103",
    },
  });

  const projectA = await prisma.project.create({
    data: {
      name: "Q2 Growth Campaign",
      description: "Cross-channel campaign planning and execution.",
      clientId: clientA.id,
      status: ProjectStatus.ACTIVE,
      priority: Priority.HIGH,
      budget: 18000,
      deadline: new Date(Date.now() + 1000 * 60 * 60 * 24 * 14),
    },
  });

  const projectB = await prisma.project.create({
    data: {
      name: "Client Portal Refresh",
      description: "UX refresh and dashboard optimization.",
      clientId: clientB.id,
      status: ProjectStatus.ACTIVE,
      priority: Priority.MEDIUM,
      budget: 12000,
      deadline: new Date(Date.now() + 1000 * 60 * 60 * 24 * 21),
    },
  });

  const projectC = await prisma.project.create({
    data: {
      name: "Content Migration",
      description: "Migrate 200+ pages into modern CMS.",
      clientId: clientC.id,
      status: ProjectStatus.PLANNING,
      priority: Priority.MEDIUM,
      budget: 8500,
      deadline: new Date(Date.now() + 1000 * 60 * 60 * 24 * 35),
    },
  });

  await prisma.projectMember.createMany({
    data: [
      { projectId: projectA.id, userId: admin.id, roleInProject: "Executive Sponsor" },
      { projectId: projectA.id, userId: teamA.id, roleInProject: "Project Lead" },
      { projectId: projectB.id, userId: teamB.id, roleInProject: "Implementation" },
      { projectId: projectB.id, userId: teamA.id, roleInProject: "QA" },
      { projectId: projectC.id, userId: teamB.id, roleInProject: "Planner" },
    ],
  });

  await prisma.task.createMany({
    data: [
      { projectId: projectA.id, title: "Finalize media plan", status: TaskStatus.IN_PROGRESS, priority: Priority.HIGH, assigneeId: teamA.id, dueDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 3) },
      { projectId: projectA.id, title: "Approve ad copy", status: TaskStatus.TODO, priority: Priority.MEDIUM, assigneeId: admin.id, dueDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 2) },
      { projectId: projectB.id, title: "Design review", status: TaskStatus.BLOCKED, priority: Priority.HIGH, assigneeId: teamB.id, dueDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 5) },
      { projectId: projectB.id, title: "Performance baseline report", status: TaskStatus.DONE, priority: Priority.LOW, assigneeId: teamA.id },
      { projectId: projectC.id, title: "Content inventory", status: TaskStatus.TODO, priority: Priority.MEDIUM, assigneeId: teamB.id },
    ],
  });

  await prisma.serviceRequest.createMany({
    data: [
      {
        clientId: clientA.id,
        projectId: projectA.id,
        createdByUserId: clientUserA.id,
        type: RequestType.FEATURE_REQUEST,
        title: "Add weekly performance snapshot",
        description: "Need a one-page weekly summary in dashboard.",
        priority: Priority.MEDIUM,
        status: RequestStatus.IN_REVIEW,
      },
      {
        clientId: clientB.id,
        projectId: projectB.id,
        createdByUserId: clientUserB.id,
        type: RequestType.BUG_FIX,
        title: "Fix form submit timeout",
        description: "Lead form fails on Safari mobile.",
        priority: Priority.HIGH,
        status: RequestStatus.IN_PROGRESS,
      },
      {
        clientId: clientA.id,
        createdByUserId: clientUserA.id,
        type: RequestType.SUPPORT_REQUEST,
        title: "Access issue for contractor",
        description: "Please grant document-only access.",
        priority: Priority.LOW,
        status: RequestStatus.SUBMITTED,
      },
    ],
  });

  await prisma.document.createMany({
    data: [
      {
        projectId: projectA.id,
        clientId: clientA.id,
        uploadedByUserId: teamA.id,
        originalName: "campaign-brief.pdf",
        storedPath: "uploads/demo/campaign-brief.pdf",
        mimeType: "application/pdf",
        sizeBytes: 182344,
        visibility: "CLIENT_SHARED",
      },
      {
        projectId: projectB.id,
        clientId: clientB.id,
        uploadedByUserId: teamB.id,
        originalName: "ux-findings.docx",
        storedPath: "uploads/demo/ux-findings.docx",
        mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        sizeBytes: 94520,
        visibility: "INTERNAL",
      },
    ],
  });

  await prisma.activityLog.createMany({
    data: [
      { actorUserId: admin.id, entityType: "client", entityId: clientA.id, action: "created" },
      { actorUserId: teamA.id, entityType: "project", entityId: projectA.id, action: "updated" },
      { actorUserId: teamB.id, entityType: "task", entityId: projectB.id, action: "status_changed", metadata: { to: "BLOCKED" } },
      { actorUserId: clientUserA.id, entityType: "serviceRequest", entityId: clientA.id, action: "submitted" },
    ],
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
