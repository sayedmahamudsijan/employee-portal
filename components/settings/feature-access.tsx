"use client";

import { useState } from "react";
import { FEATURES, type FeatureKey } from "@/lib/feature-access";
import { getRoleLabel } from "@/lib/roles";
import { toast } from "sonner";
import type { Role } from "@prisma/client";

type AccessMap = Record<FeatureKey, Role[]>;

const DISPLAY_ROLES: Role[] = ["INTERN", "EMPLOYEE", "MANAGER", "ADMIN", "CEO", "CMO", "CTO"];

function RoleBadge({ role }: { role: Role }) {
  const colors: Record<Role, string> = {
    INTERN:   "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300",
    EMPLOYEE: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
    MANAGER:  "bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300",
    ADMIN:    "bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300",
    CEO:      "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300",
    CMO:      "bg-pink-100 text-pink-700 dark:bg-pink-900/40 dark:text-pink-300",
    CTO:      "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300",
  };
  return (
    <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${colors[role]}`}>
      {getRoleLabel(role)}
    </span>
  );
}

export function FeatureAccessControl({ initial }: { initial: { feature: string; roles: Role[] }[] }) {
  const init: AccessMap = {} as AccessMap;
  for (const { feature, roles } of initial) {
    init[feature as FeatureKey] = roles;
  }
  const [access, setAccess] = useState<AccessMap>(init);
  const [saving, setSaving] = useState<FeatureKey | null>(null);

  async function toggle(feature: FeatureKey, role: Role) {
    const current = access[feature] ?? [];
    const updated = current.includes(role)
      ? current.filter((r) => r !== role)
      : [...current, role];
    setAccess((a) => ({ ...a, [feature]: updated }));

    setSaving(feature);
    try {
      const res = await fetch("/api/feature-access", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ feature, roles: updated }),
      });
      if (!res.ok) throw new Error();
      toast.success("Access updated");
    } catch {
      // Revert
      setAccess((a) => ({ ...a, [feature]: current }));
      toast.error("Failed to update access");
    } finally {
      setSaving(null);
    }
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Toggle which roles can access each feature. Changes apply to new page loads — logged-in users will see the change on next navigation.
      </p>
      <div className="rounded-xl border border-border overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/50">
              <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground w-40">Feature</th>
              {DISPLAY_ROLES.map((r) => (
                <th key={r} className="px-3 py-3 text-center text-xs font-medium text-muted-foreground">
                  <RoleBadge role={r} />
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {FEATURES.map(({ key, label }) => {
              const roles = access[key] ?? [];
              return (
                <tr key={key} className={`hover:bg-muted/20 transition-colors ${saving === key ? "opacity-60" : ""}`}>
                  <td className="px-4 py-3 font-medium text-foreground">{label}</td>
                  {DISPLAY_ROLES.map((role) => {
                    const enabled = roles.includes(role);
                    return (
                      <td key={role} className="px-3 py-3 text-center">
                        <button
                          onClick={() => toggle(key, role)}
                          disabled={saving === key}
                          className={`w-5 h-5 rounded border-2 transition-all mx-auto flex items-center justify-center
                            ${enabled
                              ? "bg-primary border-primary"
                              : "border-muted-foreground/30 hover:border-primary/60"
                            }`}
                        >
                          {enabled && (
                            <svg className="w-3 h-3 text-primary-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                        </button>
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
