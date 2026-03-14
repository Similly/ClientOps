import "dotenv/config";
import { defineConfig } from "prisma/config";

const fallbackUrl = "postgresql://placeholder:placeholder@localhost:5432/placeholder?schema=public";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    // Allow `prisma generate` during CI/install even when DATABASE_URL is not present yet.
    url: process.env.DATABASE_URL ?? fallbackUrl,
  },
});
