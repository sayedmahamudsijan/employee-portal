"use client";

import { useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Palette, Upload, X, Check, AlertTriangle, RefreshCw,
  Building2, Image as ImageIcon, Monitor, Navigation, Users,
  RotateCcw, ChevronDown, ChevronUp,
} from "lucide-react";
import type { DesignConfig, DesignIconName } from "@/lib/portal-design";
import { SECTION_DEFAULTS, NAV_DEFAULTS, DESIGN_ICON_NAMES } from "@/lib/portal-design";
import { DESIGN_ICON_MAP } from "@/components/design/icon-map";

// ── Shared ─────────────────────────────────────────────────────────────────

const ALL_ROLES = ["CEO", "CMO", "CTO", "ADMIN", "MANAGER", "EMPLOYEE", "INTERN"] as const;
const ROLE_LABELS: Record<string, string> = {
  CEO: "CEO", CMO: "CMO", CTO: "CTO",
  ADMIN: "Admin", MANAGER: "Manager", EMPLOYEE: "Employee", INTERN: "Intern",
};

// ── Confirm Dialog ─────────────────────────────────────────────────────────

function ConfirmDialog({
  open, title, message, confirmLabel, onConfirm, onCancel, saving,
}: {
  open: boolean; title: string; message: string; confirmLabel: string;
  onConfirm: () => void; onCancel: () => void; saving?: boolean;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-card border border-border rounded-xl p-6 w-full max-w-md shadow-2xl mx-4">
        <div className="flex items-start gap-3 mb-4">
          <AlertTriangle className="w-5 h-5 mt-0.5 text-yellow-500 flex-shrink-0" />
          <div>
            <h3 className="font-bold text-base">{title}</h3>
            <p className="text-sm text-muted-foreground mt-1">{message}</p>
          </div>
        </div>
        <div className="flex gap-2 justify-end">
          <Button variant="outline" size="sm" onClick={onCancel} disabled={saving}>Cancel</Button>
          <Button size="sm" onClick={onConfirm} disabled={saving}>
            {saving ? <RefreshCw className="w-3.5 h-3.5 animate-spin mr-1.5" /> : null}
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}

// ── Image Upload ───────────────────────────────────────────────────────────

function ImageUpload({
  label, hint, value, onChange, maxKB = 512, aspect = "wide",
}: {
  label: string; hint: string; value: string; onChange: (v: string) => void;
  maxKB?: number; aspect?: "wide" | "square";
}) {
  const ref = useRef<HTMLInputElement>(null);

  const handleFile = (file: File) => {
    if (file.size > maxKB * 1024) {
      alert(`Image must be under ${maxKB} KB. Your file is ${Math.round(file.size / 1024)} KB.`);
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => onChange(e.target?.result as string);
    reader.readAsDataURL(file);
  };

  return (
    <div>
      <input
        ref={ref}
        type="file"
        accept="image/png,image/jpeg,image/gif,image/webp,image/svg+xml,image/x-icon"
        className="hidden"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
      />
      {value ? (
        <div className="relative group inline-block">
          <img
            src={value}
            alt={label}
            className={cn(
              "border border-border rounded-lg object-contain bg-muted/30",
              aspect === "square" ? "h-16 w-16" : "h-14 max-w-[200px]"
            )}
          />
          <div className="absolute inset-0 rounded-lg bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
            <button
              onClick={() => ref.current?.click()}
              className="text-white bg-white/20 hover:bg-white/30 rounded px-2 py-1 text-xs"
            >
              Change
            </button>
            <button
              onClick={() => onChange("")}
              className="text-white bg-red-500/60 hover:bg-red-500/80 rounded px-2 py-1 text-xs"
            >
              Remove
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => ref.current?.click()}
          className={cn(
            "flex flex-col items-center justify-center gap-2 border-2 border-dashed border-border",
            "rounded-lg text-muted-foreground hover:border-primary/40 hover:text-foreground transition-colors",
            aspect === "square" ? "h-16 w-16" : "h-14 w-48"
          )}
        >
          <Upload className="w-4 h-4" />
          <span className="text-xs">{label}</span>
        </button>
      )}
      <p className="text-xs text-muted-foreground mt-1.5">{hint}</p>
    </div>
  );
}

// ── Icon Picker ────────────────────────────────────────────────────────────

function IconPicker({
  value, onChange, fallbackIconName,
}: {
  value: string | undefined; onChange: (name: string) => void; fallbackIconName: string;
}) {
  const [open, setOpen] = useState(false);
  const CurrentIcon = value
    ? (DESIGN_ICON_MAP[value] ?? DESIGN_ICON_MAP[fallbackIconName])
    : DESIGN_ICON_MAP[fallbackIconName];

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center justify-center w-9 h-9 rounded-lg border border-border hover:border-primary/40 bg-muted/30 hover:bg-muted/60 transition-colors"
        title="Change icon"
      >
        {CurrentIcon && <CurrentIcon className="w-4 h-4" />}
      </button>

      {open && (
        <div className="absolute top-10 left-0 z-30 bg-card border border-border rounded-xl shadow-2xl p-3 w-64">
          <p className="text-xs text-muted-foreground mb-2 font-medium">Pick an icon</p>
          <div className="grid grid-cols-6 gap-1.5 max-h-48 overflow-y-auto">
            {DESIGN_ICON_NAMES.map((name) => {
              const Icon = DESIGN_ICON_MAP[name];
              if (!Icon) return null;
              return (
                <button
                  key={name}
                  title={name}
                  onClick={() => { onChange(name); setOpen(false); }}
                  className={cn(
                    "flex items-center justify-center w-8 h-8 rounded-md border transition-colors",
                    value === name
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-transparent hover:border-border hover:bg-muted/50"
                  )}
                >
                  <Icon className="w-4 h-4" />
                </button>
              );
            })}
          </div>
          <button
            onClick={() => setOpen(false)}
            className="mt-2 w-full text-xs text-muted-foreground hover:text-foreground py-1"
          >
            Close
          </button>
        </div>
      )}
    </div>
  );
}

// ── Brand Panel ────────────────────────────────────────────────────────────

function BrandPanel({
  config, onChange,
}: {
  config: DesignConfig;
  onChange: (partial: Partial<DesignConfig>) => void;
}) {
  return (
    <div className="space-y-6">
      {/* Portal Title */}
      <div>
        <label className="text-sm font-medium block mb-1.5">Portal Title</label>
        <Input
          value={config.portalTitle ?? ""}
          onChange={(e) => onChange({ portalTitle: e.target.value })}
          placeholder="MBD Portal"
          className="max-w-sm"
        />
        <p className="text-xs text-muted-foreground mt-1">Shown in the sidebar header and browser tab.</p>
      </div>

      {/* Logo */}
      <div>
        <label className="text-sm font-medium block mb-1.5">Portal Logo</label>
        <ImageUpload
          label="Upload Logo"
          hint="Recommended: PNG/SVG, 200×50 px, transparent background. Max 512 KB."
          value={config.logoUrl ?? ""}
          onChange={(v) => onChange({ logoUrl: v })}
          maxKB={512}
          aspect="wide"
        />
      </div>

      {/* Favicon */}
      <div>
        <label className="text-sm font-medium block mb-1.5">Favicon</label>
        <ImageUpload
          label="Upload Favicon"
          hint="Recommended: ICO or PNG, 32×32 px. Max 100 KB."
          value={config.faviconUrl ?? ""}
          onChange={(v) => onChange({ faviconUrl: v })}
          maxKB={100}
          aspect="square"
        />
      </div>

      {/* Primary Color */}
      <div>
        <label className="text-sm font-medium block mb-1.5">Brand Color</label>
        <div className="flex items-center gap-3">
          <input
            type="color"
            value={config.primaryColor ?? "#3b82f6"}
            onChange={(e) => onChange({ primaryColor: e.target.value })}
            className="h-10 w-16 rounded-lg border border-border cursor-pointer bg-transparent p-0.5"
          />
          <Input
            value={config.primaryColor ?? "#3b82f6"}
            onChange={(e) => onChange({ primaryColor: e.target.value })}
            placeholder="#3b82f6"
            className="w-32 font-mono text-sm"
            maxLength={7}
          />
          <button
            onClick={() => onChange({ primaryColor: "#3b82f6" })}
            className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"
          >
            <RotateCcw className="w-3 h-3" /> Reset
          </button>
        </div>
        <p className="text-xs text-muted-foreground mt-1">Applied as the accent color across the portal (sidebar glow, active states, badges).</p>
      </div>

      {/* Live preview strip */}
      <div className="rounded-lg border border-border bg-muted/20 p-4">
        <p className="text-xs text-muted-foreground mb-3 font-medium uppercase tracking-wider">Preview</p>
        <div className="flex items-center gap-3 p-3 bg-sidebar border border-border rounded-lg w-fit">
          {config.logoUrl ? (
            <img src={config.logoUrl} alt="logo" className="h-8 max-w-[120px] object-contain" />
          ) : (
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center text-white"
              style={{ background: config.primaryColor ?? "#3b82f6" }}
            >
              <Building2 className="w-4 h-4" />
            </div>
          )}
          <span className="font-bold text-sm" style={{ color: config.primaryColor ?? "#3b82f6" }}>
            {config.portalTitle || "MBD Portal"}
          </span>
        </div>
      </div>
    </div>
  );
}

// ── Navigation Panel ───────────────────────────────────────────────────────

function NavigationPanel({
  sections, navItems, onSectionChange, onNavItemChange,
}: {
  sections: DesignConfig["sections"];
  navItems: DesignConfig["navItems"];
  onSectionChange: (key: string, patch: { label?: string; iconName?: string }) => void;
  onNavItemChange: (href: string, label: string) => void;
}) {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());

  const toggle = (key: string) => setExpandedSections((prev) => {
    const next = new Set(prev);
    next.has(key) ? next.delete(key) : next.add(key);
    return next;
  });

  const navBySection: Record<string, string[]> = {};
  for (const [href] of Object.entries(NAV_DEFAULTS)) {
    const sectionKey = Object.keys(SECTION_DEFAULTS).find((sk) =>
      href.startsWith(`/${sk.toLowerCase()}`) ||
      (sk === "Workspace" && ["/dashboard","/attendance","/tasks","/work-log","/leave","/expenses","/one-on-ones","/helpdesk","/onboarding"].includes(href)) ||
      (sk === "Growth" && ["/goals","/okrs","/career","/mentorship","/performance"].includes(href)) ||
      (sk === "Company" && ["/calendar","/projects","/teams","/team","/kudos","/announcements","/documents"].includes(href)) ||
      (sk === "Manage" && ["/work-log/admin","/analytics"].includes(href)) ||
      (sk === "Admin" && ["/admin","/admin/diversity","/admin/compensation"].includes(href)) ||
      (sk === "History" && href.startsWith("/history")) ||
      (sk === "Account" && ["/notifications","/settings","/design"].includes(href))
    );
    if (sectionKey) {
      navBySection[sectionKey] = navBySection[sectionKey] ?? [];
      navBySection[sectionKey].push(href);
    }
  }

  return (
    <div className="space-y-2">
      {Object.entries(SECTION_DEFAULTS).map(([key, def]) => {
        const override = sections?.[key] ?? {};
        const isExpanded = expandedSections.has(key);
        const navHrefs = navBySection[key] ?? [];
        const hasChanges = override.label || override.iconName ||
          navHrefs.some(href => navItems?.[href]);

        return (
          <div key={key} className="border border-border rounded-xl overflow-hidden">
            {/* Section row */}
            <div className="flex items-center gap-3 p-3 bg-muted/20">
              <IconPicker
                value={override.iconName}
                onChange={(name) => onSectionChange(key, { iconName: name })}
                fallbackIconName={def.defaultIconName}
              />
              <Input
                value={override.label ?? ""}
                onChange={(e) => onSectionChange(key, { label: e.target.value })}
                placeholder={def.label}
                className="flex-1 h-9"
              />
              {hasChanges && (
                <button
                  onClick={() => {
                    onSectionChange(key, { label: "", iconName: "" });
                    navHrefs.forEach(href => onNavItemChange(href, ""));
                  }}
                  className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 flex-shrink-0"
                  title="Reset section to defaults"
                >
                  <RotateCcw className="w-3 h-3" />
                </button>
              )}
              <button
                onClick={() => toggle(key)}
                className="text-muted-foreground hover:text-foreground ml-1 flex-shrink-0"
                title={isExpanded ? "Hide nav items" : "Show nav items"}
              >
                {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>
            </div>

            {/* Nav items (expandable) */}
            {isExpanded && navHrefs.length > 0 && (
              <div className="border-t border-border divide-y divide-border">
                {navHrefs.map((href) => (
                  <div key={href} className="flex items-center gap-3 px-4 py-2">
                    <span className="text-xs text-muted-foreground font-mono w-44 flex-shrink-0 truncate">{href}</span>
                    <Input
                      value={navItems?.[href] ?? ""}
                      onChange={(e) => onNavItemChange(href, e.target.value)}
                      placeholder={NAV_DEFAULTS[href] ?? href}
                      className="flex-1 h-8 text-sm"
                    />
                    {navItems?.[href] && (
                      <button onClick={() => onNavItemChange(href, "")} className="text-muted-foreground hover:text-foreground">
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── Access Panel ───────────────────────────────────────────────────────────

function AccessPanel({
  currentRoles, onChange,
}: {
  currentRoles: string[];
  onChange: (roles: string[]) => void;
}) {
  const toggle = (role: string) => {
    onChange(
      currentRoles.includes(role)
        ? currentRoles.filter((r) => r !== role)
        : [...currentRoles, role]
    );
  };

  return (
    <div>
      <p className="text-sm text-muted-foreground mb-4">
        Select which roles can access and modify Portal Design settings. At least one executive role (CEO, CMO, or CTO) should always be included.
      </p>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {ALL_ROLES.map((role) => {
          const checked = currentRoles.includes(role);
          const isExec = ["CEO", "CMO", "CTO"].includes(role);
          return (
            <label
              key={role}
              className={cn(
                "flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors select-none",
                checked
                  ? "border-primary/50 bg-primary/8"
                  : "border-border hover:border-border/80 hover:bg-muted/30"
              )}
            >
              <input
                type="checkbox"
                checked={checked}
                onChange={() => toggle(role)}
                className="w-4 h-4 rounded border-border accent-primary"
              />
              <span className="text-sm font-medium">{ROLE_LABELS[role]}</span>
              {isExec && (
                <Badge variant="outline" className="text-[10px] px-1 py-0 ml-auto text-primary border-primary/30">Exec</Badge>
              )}
            </label>
          );
        })}
      </div>
    </div>
  );
}

// ── Main: DesignStudio ─────────────────────────────────────────────────────

interface Props {
  initialConfig: DesignConfig;
  designRoles: string[];
  companyName: string;
}

export function DesignStudio({ initialConfig, designRoles, companyName }: Props) {
  const [tab, setTab] = useState<"brand" | "nav" | "access">("brand");
  const [saving, setSaving] = useState(false);

  // ── Brand state ──────────────────────────────────────────────────────────
  const [brand, setBrand] = useState<DesignConfig>({
    portalTitle:  initialConfig.portalTitle ?? "",
    logoUrl:      initialConfig.logoUrl     ?? "",
    faviconUrl:   initialConfig.faviconUrl  ?? "",
    primaryColor: initialConfig.primaryColor ?? "#3b82f6",
  });
  const [confirmBrand, setConfirmBrand] = useState(false);

  // ── Navigation state ─────────────────────────────────────────────────────
  const [sectionOverrides, setSectionOverrides] = useState<NonNullable<DesignConfig["sections"]>>(
    initialConfig.sections ?? {}
  );
  const [navItemOverrides, setNavItemOverrides] = useState<NonNullable<DesignConfig["navItems"]>>(
    initialConfig.navItems ?? {}
  );
  const [confirmNav, setConfirmNav] = useState(false);

  // ── Access state ─────────────────────────────────────────────────────────
  const [roles, setRoles]           = useState<string[]>(designRoles);
  const [confirmAccess, setConfirmAccess] = useState(false);

  // ── Helpers ──────────────────────────────────────────────────────────────

  const patchSection = (key: string, patch: { label?: string; iconName?: string }) => {
    setSectionOverrides((prev) => {
      const existing = prev[key] ?? {};
      const merged = { ...existing, ...patch };
      // Drop empty strings (means reset)
      if (!merged.label) delete merged.label;
      if (!merged.iconName) delete merged.iconName;
      const next = { ...prev };
      if (Object.keys(merged).length === 0) delete next[key];
      else next[key] = merged;
      return next;
    });
  };

  const patchNavItem = (href: string, label: string) => {
    setNavItemOverrides((prev) => {
      const next = { ...prev };
      if (!label.trim()) delete next[href];
      else next[href] = label;
      return next;
    });
  };

  // ── Save handlers ─────────────────────────────────────────────────────────

  const saveBrand = async () => {
    setSaving(true);
    try {
      const currentConfig = await fetchCurrentConfig();
      const merged = { ...currentConfig, ...brand };
      // Remove empty strings from merged
      if (!merged.portalTitle) delete merged.portalTitle;
      if (!merged.logoUrl) delete merged.logoUrl;
      if (!merged.faviconUrl) delete merged.faviconUrl;
      await saveDesignConfig(merged);
      setConfirmBrand(false);
    } finally { setSaving(false); }
  };

  const saveNav = async () => {
    setSaving(true);
    try {
      const currentConfig = await fetchCurrentConfig();
      const merged = {
        ...currentConfig,
        sections: sectionOverrides,
        navItems: navItemOverrides,
      };
      await saveDesignConfig(merged);
      setConfirmNav(false);
    } finally { setSaving(false); }
  };

  const saveAccess = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/design", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roles }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setConfirmAccess(false);
    } catch (e: any) {
      alert(e.message ?? "Failed to save access settings");
    } finally { setSaving(false); }
  };

  return (
    <div>
      {/* ── Page header ───────────────────────────────────────────────────── */}
      <div className="flex items-start justify-between gap-4 mb-6 pb-4 border-b border-border">
        <div>
          <h1 className="text-2xl font-bold gradient-text flex items-center gap-2">
            <Palette className="w-6 h-6" /> Portal Design Studio
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Customise every visual aspect of <span className="font-medium text-foreground">{companyName}</span>{"'"}s portal — logo, favicon, colours, section names, and navigation labels. Changes apply to all users instantly.
          </p>
        </div>
      </div>

      {/* ── Tabs ──────────────────────────────────────────────────────────── */}
      <div className="flex gap-1 mb-6 p-1 bg-muted/30 rounded-lg w-fit border border-border">
        {([
          { key: "brand", label: "Brand",      icon: Monitor },
          { key: "nav",   label: "Navigation", icon: Navigation },
          { key: "access",label: "Access",     icon: Users },
        ] as const).map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors",
              tab === key
                ? "bg-card border border-border shadow-sm text-foreground"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Icon className="w-4 h-4" />
            {label}
          </button>
        ))}
      </div>

      {/* ── Panel content ─────────────────────────────────────────────────── */}
      <div className="bg-card border border-border rounded-xl p-6">
        {tab === "brand" && (
          <>
            <h2 className="text-base font-bold mb-1 flex items-center gap-2">
              <ImageIcon className="w-4 h-4 text-muted-foreground" /> Brand Identity
            </h2>
            <p className="text-sm text-muted-foreground mb-6">
              Set the portal{"'"}s name, logo, favicon, and accent colour.
            </p>
            <BrandPanel config={brand} onChange={(p) => setBrand((b) => ({ ...b, ...p }))} />
            <div className="flex justify-end mt-8 pt-4 border-t border-border">
              <Button onClick={() => setConfirmBrand(true)}>
                <Check className="w-4 h-4 mr-1.5" /> Apply Brand Changes
              </Button>
            </div>
          </>
        )}

        {tab === "nav" && (
          <>
            <h2 className="text-base font-bold mb-1 flex items-center gap-2">
              <Navigation className="w-4 h-4 text-muted-foreground" /> Navigation Labels &amp; Icons
            </h2>
            <p className="text-sm text-muted-foreground mb-6">
              Rename sections and nav items, and pick custom icons. Leave a field blank to keep the default. Click the chevron to expand nav items within a section.
            </p>
            <NavigationPanel
              sections={sectionOverrides}
              navItems={navItemOverrides}
              onSectionChange={patchSection}
              onNavItemChange={patchNavItem}
            />
            <div className="flex justify-end mt-8 pt-4 border-t border-border">
              <Button onClick={() => setConfirmNav(true)}>
                <Check className="w-4 h-4 mr-1.5" /> Apply Navigation Changes
              </Button>
            </div>
          </>
        )}

        {tab === "access" && (
          <>
            <h2 className="text-base font-bold mb-1 flex items-center gap-2">
              <Users className="w-4 h-4 text-muted-foreground" /> Design Access Control
            </h2>
            <AccessPanel currentRoles={roles} onChange={setRoles} />
            <div className="flex justify-end mt-8 pt-4 border-t border-border">
              <Button onClick={() => setConfirmAccess(true)}>
                <Check className="w-4 h-4 mr-1.5" /> Save Access Settings
              </Button>
            </div>
          </>
        )}
      </div>

      {/* ── Confirm dialogs ────────────────────────────────────────────────── */}
      <ConfirmDialog
        open={confirmBrand}
        title="Apply brand changes?"
        message="This will update the portal title, logo, favicon, and accent colour for all users immediately. You can change it back at any time."
        confirmLabel="Apply Changes"
        saving={saving}
        onCancel={() => setConfirmBrand(false)}
        onConfirm={saveBrand}
      />
      <ConfirmDialog
        open={confirmNav}
        title="Apply navigation changes?"
        message="Section labels and nav item names will update in the sidebar for all users immediately. Blank fields revert to defaults."
        confirmLabel="Apply Changes"
        saving={saving}
        onCancel={() => setConfirmNav(false)}
        onConfirm={saveNav}
      />
      <ConfirmDialog
        open={confirmAccess}
        title="Save access settings?"
        message={`The Design Studio will be accessible to: ${roles.join(", ") || "no one"}. Make sure at least one executive role is included.`}
        confirmLabel="Save Settings"
        saving={saving}
        onCancel={() => setConfirmAccess(false)}
        onConfirm={saveAccess}
      />
    </div>
  );
}

// ── API helpers ────────────────────────────────────────────────────────────

async function fetchCurrentConfig(): Promise<DesignConfig> {
  const res  = await fetch("/api/design");
  const data = await res.json();
  return (data.data?.designConfig as DesignConfig) ?? {};
}

async function saveDesignConfig(config: DesignConfig) {
  const res = await fetch("/api/design", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ designConfig: config }),
  });
  const data = await res.json();
  if (data.error) throw new Error(data.error);
  // Reload to apply new title/favicon/color immediately
  window.location.reload();
}
