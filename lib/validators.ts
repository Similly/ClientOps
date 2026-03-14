import { Priority, ProjectStatus, RequestStatus, RequestType, TaskStatus } from "@prisma/client";
import { z } from "zod";

export const loginSchema = z.object({
  email: z.email(),
  password: z.string().min(8),
});

export const clientSchema = z.object({
  companyName: z.string().min(2).max(120),
  contactName: z.string().min(2).max(120),
  contactEmail: z.email(),
  phone: z.string().max(32).optional().or(z.literal("")),
  notes: z.string().max(500).optional().or(z.literal("")),
});

export const projectSchema = z.object({
  name: z.string().min(2).max(140),
  description: z.string().max(1000).optional().or(z.literal("")),
  clientId: z.string().cuid(),
  status: z.enum(ProjectStatus),
  priority: z.enum(Priority),
  budget: z.coerce.number().nonnegative().optional(),
  deadline: z.string().optional().or(z.literal("")),
  memberIds: z.array(z.string().cuid()).optional(),
});

export const taskSchema = z.object({
  projectId: z.string().cuid(),
  title: z.string().min(2).max(200),
  description: z.string().max(1000).optional().or(z.literal("")),
  assigneeId: z.string().cuid().optional().or(z.literal("")),
  dueDate: z.string().optional().or(z.literal("")),
  priority: z.enum(Priority),
  status: z.enum(TaskStatus),
});

export const requestSchema = z.object({
  clientId: z.string().cuid(),
  projectId: z.string().cuid().optional().or(z.literal("")),
  type: z.enum(RequestType),
  title: z.string().min(3).max(180),
  description: z.string().min(10).max(1500),
  priority: z.enum(Priority),
  status: z.enum(RequestStatus).optional(),
  internalNotes: z.string().max(1000).optional().or(z.literal("")),
});
