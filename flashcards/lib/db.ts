import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import { PrismaClient } from "@/app/generated/prisma/client";

const createPrismaClient = () => {
  const url = process.env.DATABASE_URL ?? "";
  // Neon compute scales to zero when idle; give connections generous time to
  // wake up (cold start) and tolerate latency spikes during recovery.
  const pool = new Pool({
    connectionString: url,
    connectionTimeoutMillis: 60_000,
    query_timeout: 120_000,
    idleTimeoutMillis: 60_000,
    max: 10,
  });
  return new PrismaClient({
    adapter: new PrismaPg(pool),
  });
};

const globalForPrisma = globalThis as unknown as {
  prisma?: ReturnType<typeof createPrismaClient>;
};

export const db = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = db;
}
