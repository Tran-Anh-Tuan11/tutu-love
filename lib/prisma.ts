import path from "path";
import { PrismaClient } from "@/app/generated/prisma/client";

// `prisma migrate`/CLI resolve a relative `file:` URL against prisma/schema.prisma's
// directory, but the Next.js runtime's cwd is the project root — resolve the same
// way here so dev/build/start all point at the same prisma/dev.db file.
function resolvedDatabaseUrl(): string | undefined {
  const url = process.env.DATABASE_URL;
  if (!url?.startsWith("file:")) return url;
  const relative = url.slice("file:".length);
  const abs = path.isAbsolute(relative) ? relative : path.join(process.cwd(), "prisma", relative);
  return `file:${abs}`;
}

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma =
  globalForPrisma.prisma ?? new PrismaClient({ datasourceUrl: resolvedDatabaseUrl() });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
