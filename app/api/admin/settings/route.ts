import { NextRequest } from "next/server";
import { withRole, requireAuth } from "@/lib/server-auth";
import { apiResponse } from "@/lib/utils";
import { getCompanySettings, upsertCompanySettings } from "@/lib/company-settings";
import { logActivity } from "@/lib/activity";

export async function GET() {
  const { error } = await requireAuth();
  if (error) return error;

  const settings = await getCompanySettings();
  return apiResponse(settings);
}

export async function PATCH(req: NextRequest) {
  const { session, error } = await withRole("ADMIN");
  if (error || !session) return error;

  const body = await req.json();
  // Whitelist fields - never let body inject id or updatedAt
  const allowed = [
    "companyName", "companyLogo", "timezone",
    "workingHoursStart", "workingHoursEnd", "workingDays",
    "defaultCasualLeave", "defaultSickLeave", "defaultAnnualLeave",
    "fiscalYearStart", "currency", "emailFromName", "primaryColor",
  ];
  const data: any = {};
  for (const key of allowed) {
    if (key in body) data[key] = body[key];
  }

  const settings = await upsertCompanySettings(data, session.user.id);
  await logActivity({
    userId: session.user.id,
    action: "update",
    entity: "company-settings",
    details: `Updated company settings: ${Object.keys(data).join(", ")}`,
  });
  return apiResponse(settings);
}
