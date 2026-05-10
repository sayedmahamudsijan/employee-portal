import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

export type CompanySettingsData = {
  id: string;
  companyName: string;
  companyLogo: string | null;
  timezone: string;
  workingHoursStart: string;
  workingHoursEnd: string;
  workingDays: number[];
  defaultCasualLeave: number;
  defaultSickLeave: number;
  defaultAnnualLeave: number;
  fiscalYearStart: string;
  currency: string;
  emailFromName: string;
  primaryColor: string;
  /** null = keep forever; positive int = auto-delete ActivityLog entries older than N days */
  historyRetentionDays: number | null;
  /** Portal design overrides — see lib/portal-design.ts for DesignConfig shape */
  designConfig: Record<string, unknown> | null;
};

const DEFAULTS: Omit<CompanySettingsData, "id"> = {
  companyName: "Meta Build Dynamics",
  companyLogo: null,
  timezone: "Asia/Dhaka",
  workingHoursStart: "09:00",
  workingHoursEnd: "18:00",
  workingDays: [1, 2, 3, 4, 5],
  defaultCasualLeave: 12,
  defaultSickLeave: 10,
  defaultAnnualLeave: 15,
  fiscalYearStart: "01-01",
  currency: "BDT",
  emailFromName: "MBD Portal",
  primaryColor: "#3b82f6",
  historyRetentionDays: null,
  designConfig: null,
};

/**
 * Get company settings — falls back to defaults if not yet initialised.
 * Never throws; on any DB error returns defaults so the app stays usable.
 */
export async function getCompanySettings(): Promise<CompanySettingsData> {
  try {
    const existing = await prisma.companySettings.findUnique({
      where: { id: "singleton" },
    });
    if (existing) return existing as CompanySettingsData;
    return { id: "singleton", ...DEFAULTS };
  } catch {
    return { id: "singleton", ...DEFAULTS };
  }
}

/**
 * Normalise a nullable Json field value for Prisma upserts.
 * Prisma Json? fields require Prisma.JsonNull (not JS null) to store null,
 * and Prisma.InputJsonValue for real values (BUG-003 pattern).
 */
function toNullableJson(
  v: Record<string, unknown> | null | undefined
): Prisma.NullableJsonNullValueInput | Prisma.InputJsonValue | undefined {
  if (v === undefined) return undefined;
  if (v === null) return Prisma.JsonNull;
  return v as Prisma.InputJsonValue;
}

export async function upsertCompanySettings(
  data: Partial<Omit<CompanySettingsData, "id">>,
  updatedBy: string
) {
  // Extract Json? fields so we can handle their null semantics separately.
  const { designConfig: dc, ...scalarData } = data;

  const designConfigCreate = toNullableJson(
    dc !== undefined ? dc : DEFAULTS.designConfig
  );
  const designConfigUpdate = toNullableJson(dc);

  return prisma.companySettings.upsert({
    where: { id: "singleton" },
    create: {
      ...DEFAULTS,
      id: "singleton",
      ...scalarData,
      updatedBy,
      // Override the DEFAULTS spread for designConfig with the Prisma-typed value
      designConfig: designConfigCreate,
    } as Parameters<typeof prisma.companySettings.upsert>[0]["create"],
    update: {
      ...scalarData,
      updatedBy,
      ...(dc !== undefined && { designConfig: designConfigUpdate }),
    } as Parameters<typeof prisma.companySettings.upsert>[0]["update"],
  });
}
