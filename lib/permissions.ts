import { Client, Project, User, UserRole } from "@prisma/client";

export function isAdmin(user: Pick<User, "role">) {
  return user.role === UserRole.ADMIN;
}

export function isTeamMember(user: Pick<User, "role">) {
  return user.role === UserRole.TEAM_MEMBER;
}

export function isClientUser(user: Pick<User, "role">) {
  return user.role === UserRole.CLIENT;
}

export function canViewClient(user: Pick<User, "role" | "id">, client: Pick<Client, "ownerUserId">) {
  if (isAdmin(user) || isTeamMember(user)) return true;
  return client.ownerUserId === user.id;
}

export function canViewProject(
  user: Pick<User, "role" | "id">,
  _project: Pick<Project, "clientId">,
  context: { clientOwnerUserId?: string | null; isMember?: boolean },
) {
  if (isAdmin(user)) return true;
  if (isTeamMember(user)) return Boolean(context.isMember);
  return context.clientOwnerUserId === user.id;
}
