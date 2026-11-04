import { PrismaClient } from "@prisma/client";
import { getEnvConfig } from "./env";
import { logger, startTimer } from "./logger";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createPrismaClient(): PrismaClient {
  const { DATABASE_URL } = getEnvConfig();

  const client = new PrismaClient({
    ...(DATABASE_URL
      ? {
          datasources: {
            db: {
              url: DATABASE_URL,
            },
          },
        }
      : {}),
    log: [
      { emit: "event", level: "error" },
      { emit: "event", level: "warn" },
    ],
  });

  client.$on("error", (e) => {
    logger.error({
      module: "DATABASE",
      action: "PRISMA_ENGINE_ERROR",
      message: e.message,
      meta: { target: e.target },
    });
  });

  client.$on("warn", (e) => {
    logger.warn({
      module: "DATABASE",
      action: "PRISMA_ENGINE_WARN",
      message: e.message,
    });
  });

  return client;
}

export const db = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = db;
}

export async function verifyDatabaseConnection(traceId?: string): Promise<{
  connected: boolean;
  latencyMs: number;
  errorReason?: string;
}> {
  const getElapsed = startTimer();

  if (!process.env.DATABASE_URL) {
    return {
      connected: false,
      latencyMs: getElapsed(),
      errorReason: "DATABASE_URL is not configured in Vercel Environment Variables",
    };
  }

  try {
    await db.$queryRaw`SELECT 1`;
    const latencyMs = getElapsed();
    logger.info({
      module: "DATABASE",
      action: "DB_HEALTH_OK",
      traceId,
      durationMs: latencyMs,
      message: "Hostinger MySQL connection verified successfully.",
    });
    return { connected: true, latencyMs };
  } catch (err) {
    const latencyMs = getElapsed();
    logger.error(
      {
        module: "DATABASE",
        action: "DB_CONNECTION_FAILED",
        traceId,
        durationMs: latencyMs,
        message:
          "Could not connect to Hostinger MySQL. Check DATABASE_URL or Remote MySQL IP whitelist (%).",
      },
      err
    );
    return {
      connected: false,
      latencyMs,
      errorReason: err instanceof Error ? err.message : String(err),
    };
  }
}