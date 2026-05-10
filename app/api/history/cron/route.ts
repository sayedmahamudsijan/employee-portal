import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { subDays } from "date-fns";
import { apiResponse, apiError } from "@/lib/utils";

/**
 * GET /api/history/cron
 *
 * Called daily by Vercel Cron (see vercel.json).
 * Reads `historyRetentionDays` from CompanySettings and deletes all
 * ActivityLog entries older than that threshold.
 *
 * Protected by CRON_SECRET env var — Vercel injects this automatically
 * as an Authorization: Bearer <secret> header on every cron invocation.
 *
 * Set CRON_SECRET in Vercel → Project → Settings → Environment Variables.
 */
export async function GET(req: NextRequest) {
  // Verify the request comes from Vercel Cron (or a manual trigger with the secret)
  const auth = req.headers.get("authorization");
  const secret = process.env.CRON_SECRET;

  if (!secret || auth !== `Bearer ${secret}`) {
    return apiError("Unauthorized", 401);
  }

  // Read retention setting
  const settings = await prisma.companySettings.findUnique({
    where: { id: "singleton" },
    select: { historyRetentionDays: true },
  });

  const days = settings?.historyRetentionDays;
  if (!days || days <= 0) {
    return apiResponse({
      skipped: true,
      reason: "History retention policy is disabled — set historyRetentionDays in Company Settings to enable.",
    });
  }

  const cutoff = subDays(new Date(), days);

  const { count } = await prisma.activityLog.deleteMany({
    where: { createdAt: { lt: cutoff } },
  });

  console.log(
    `[History Cron] Retention=${days}d | Cutoff=${cutoff.toISOString()} | Deleted=${count} entries`
  );

  return apiResponse({
    deleted: count,
    retentionDays: days,
    cutoff: cutoff.toISOString(),
    ranAt: new Date().toISOString(),
  });
}
