"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Palette, Upload, X, Check, AlertTriangle, RefreshCw,
  Building2, Image as ImageIcon, Monitor, Navigation2, Users, Tag,
  RotateCcw, ChevronDown, ChevronUp, Eye, EyeOff,
  ArrowUp, ArrowDown, Plus, Trash2, ExternalLink, Globe,
  Pencil, Shield, UserCog,
} from "lucide-react";
import type { DesignConfig, CustomNavItem } from "@/lib/portal-design";
import {
  SECTION_DEFAULTS, DEFAULT_SECTION_ORDER, NAV_DEFAULTS,
  NAV_SECTION_MAP, DESIGN_ICON_NAMES, DEFAULT_ROLE_LABELS,
} from "@/lib/portal-design";
import { DESIGN_ICON_MAP } from "@/components/design/icon-map";
import { FEATURES } from "@/lib/feature-access";

// ── Constants ──────────────────────────────────────────────────────────────

const ALL_ROLES = ["CEO", "CMO", "CTO", "ADMIN", "MANAGER", "EMPLOYEE", "INTERN"] as const;

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
            {saving && <RefreshCw className="w-3.5 h-3.5 animate-spin mr-1.5" />}
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
  value, onChange, fallbackIconName, disabled = false, size = "md",
}: {
  value: string | undefined;
  onChange: (name: string) => void;
  fallbackIconName: string;
  disabled?: boolean;
  size?: "sm" | "md";
}) {
  const [open, setOpen] = useState(false);
  const CurrentIcon = (value ? DESIGN_ICON_MAP[value] : null) ?? DESIGN_ICON_MAP[fallbackIconName] ?? Globe;

  return (
    <div className="relative flex-shrink-0">
      <button
        onClick={() => !disabled && setOpen((o) => !o)}
        disabled={disabled}
        className={cn(
          "flex items-center justify-center rounded-lg border border-border bg-muted/30 transition-colors",
          disabled
            ? "opacity-40 cursor-not-allowed"
            : "hover:border-primary/40 hover:bg-muted/60",
          size === "sm" ? "w-7 h-7" : "w-9 h-9"
        )}
        title="Change icon"
      >
        <CurrentIcon className={cn(size === "sm" ? "w-3.5 h-3.5" : "w-4 h-4")} />
      </button>

      {open && (
        <div className="absolute top-10 left-0 z-30 bg-card border border-border rounded-xl shadow-2xl p-3 w-72">
          <p className="text-xs text-muted-foreground mb-2 font-medium">Pick an icon</p>
          <div className="grid grid-cols-7 gap-1.5 max-h-52 overflow-y-auto">
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
        <label className="text-sm font-medium block mb-1.5">Browser Tab Icon (Favicon)</label>
        <ImageUpload
          label="Upload Favicon"
          hint="Recommended: ICO or PNG, 32×32 px square. Max 100 KB. Appears in browser tabs and bookmarks."
          value={config.faviconUrl ?? ""}
          onChange={(v) => onChange({ faviconUrl: v })}
          maxKB={100}
          aspect="square"
        />
      </div>

      {/* Primary Color */}
      <div>
        <label className="text-sm font-medium block mb-1.5">Brand Accent Colour</label>
        <div className="flex items-center gap-3 flex-wrap">
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
        <p className="text-xs text-muted-foreground mt-1">
          Applied as the accent colour across the portal — sidebar glow, active nav states, buttons, and badges.
        </p>
      </div>

      {/* Live preview strip */}
      <div className="rounded-lg border border-border bg-muted/20 p-4">
        <p className="text-xs text-muted-foreground mb-3 font-medium uppercase tracking-wider">Live Preview</p>
        <div className="flex items-center gap-3 p-3 bg-sidebar border border-border rounded-lg w-fit">
          {config.logoUrl ? (
            <img src={config.logoUrl} alt="logo" className="h-8 max-w-[120px] object-contain" />
          ) : (
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center text-white flex-shrink-0"
              style={{ background: config.primaryColor ?? "#3b82f6" }}
            >
              <Building2 className="w-4 h-4" />
            </div>
          )}
          <span className="font-bold text-sm" style={{ color: config.primaryColor ?? "#3b82f6" }}>
            {config.portalTitle || "MBD Portal"}
          </span>
        </div>
        {config.faviconUrl && (
          <div className="mt-3 flex items-center gap-2">
            <p className="text-xs text-muted-foreground">Favicon preview:</p>
            <div className="flex items-center gap-1.5 bg-muted/40 rounded px-2 py-1 border border-border">
              <img src={config.faviconUrl} alt="favicon" className="w-4 h-4 object-contain" />
              <span className="text-xs text-muted-foreground truncate max-w-[120px]">
                {config.portalTitle || "MBD Portal"}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Navigation Panel ───────────────────────────────────────────────────────

function NavigationPanel({
  sectionOverrides, navItemOverrides, hiddenSections, sectionOrder,
  hiddenNavItems, customNavItems,
  onSectionChange, onNavItemChange, onToggleSection, onMoveSection,
  onToggleNavItem, onCustomNavItemsChange,
}: {
  sectionOverrides:   NonNullable<DesignConfig["sections"]>;
  navItemOverrides:   NonNullable<DesignConfig["navItems"]>;
  hiddenSections:     string[];
  sectionOrder:       string[];
  hiddenNavItems:     string[];
  customNavItems:     CustomNavItem[];
  onSectionChange:    (key: string, patch: { label?: string; iconName?: string }) => void;
  onNavItemChange:    (href: string, label: string) => void;
  onToggleSection:    (key: string) => void;
  onMoveSection:      (key: string, dir: "up" | "down") => void;
  onToggleNavItem:    (href: string) => void;
  onCustomNavItemsChange: (items: CustomNavItem[]) => void;
}) {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());
  const [addingLinkFor, setAddingLinkFor] = useState<string | null>(null);
  const [newLink, setNewLink] = useState({ label: "", url: "", iconName: "" });

  const toggleExpand = (key: string) =>
    setExpandedSections((prev) => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });

  // Sections in their current custom order
  const orderedSections = sectionOrder
    .filter((k) => SECTION_DEFAULTS[k])
    .map((k) => ({ key: k, ...SECTION_DEFAULTS[k] }));

  const navHrefsForSection = (key: string) =>
    Object.entries(NAV_SECTION_MAP)
      .filter(([, s]) => s === key)
      .map(([href]) => href)
      .filter((href) => NAV_DEFAULTS[href]); // only hrefs with a known default label

  const addCustomLink = (section: string) => {
    if (!newLink.label.trim() || !newLink.url.trim()) return;
    const item: CustomNavItem = {
      id:       Date.now().toString(),
      label:    newLink.label.trim(),
      url:      newLink.url.trim(),
      section,
      iconName: newLink.iconName || undefined,
    };
    onCustomNavItemsChange([...customNavItems, item]);
    setNewLink({ label: "", url: "", iconName: "" });
    setAddingLinkFor(null);
  };

  return (
    <div className="space-y-2">
      <p className="text-xs text-muted-foreground mb-4">
        Reorder sections with the arrows. Toggle visibility with the eye icon. Expand a section to rename nav items, hide individual items, or add custom links.
      </p>

      {orderedSections.map(({ key, label, defaultIconName }, idx) => {
        const override        = sectionOverrides?.[key] ?? {};
        const isHidden        = hiddenSections.includes(key);
        const isExpanded      = expandedSections.has(key);
        const navHrefs        = navHrefsForSection(key);
        const sectionCustoms  = customNavItems.filter((ci) => ci.section === key);
        const hasCustomisations =
          !!override.label || !!override.iconName ||
          navHrefs.some((href) => navItemOverrides?.[href]) ||
          sectionCustoms.length > 0;

        return (
          <div
            key={key}
            className={cn(
              "border border-border rounded-xl overflow-hidden transition-opacity",
              isHidden && "opacity-50"
            )}
          >
            {/* ── Section header row ───────────────────────────────────────── */}
            <div className="flex items-center gap-2 p-3 bg-muted/20">
              <IconPicker
                value={override.iconName}
                onChange={(name) => onSectionChange(key, { iconName: name })}
                fallbackIconName={defaultIconName}
                disabled={isHidden}
              />
              <Input
                value={override.label ?? ""}
                onChange={(e) => onSectionChange(key, { label: e.target.value })}
                placeholder={label}
                className="flex-1 h-9 text-sm"
                disabled={isHidden}
              />

              {/* Reorder */}
              <div className="flex flex-col gap-0.5">
                <button
                  onClick={() => onMoveSection(key, "up")}
                  disabled={idx === 0}
                  className="text-muted-foreground hover:text-foreground disabled:opacity-20 disabled:cursor-not-allowed leading-none"
                  title="Move up"
                >
                  <ArrowUp className="w-3 h-3" />
                </button>
                <button
                  onClick={() => onMoveSection(key, "down")}
                  disabled={idx === orderedSections.length - 1}
                  className="text-muted-foreground hover:text-foreground disabled:opacity-20 disabled:cursor-not-allowed leading-none"
                  title="Move down"
                >
                  <ArrowDown className="w-3 h-3" />
                </button>
              </div>

              {/* Visibility toggle */}
              <button
                onClick={() => onToggleSection(key)}
                className={cn(
                  "p-1 rounded transition-colors",
                  isHidden
                    ? "text-muted-foreground/40 hover:text-muted-foreground"
                    : "text-muted-foreground hover:text-foreground"
                )}
                title={isHidden ? "Show section in sidebar" : "Hide section from sidebar"}
              >
                {isHidden ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              </button>

              {/* Reset */}
              {hasCustomisations && !isHidden && (
                <button
                  onClick={() => {
                    onSectionChange(key, { label: "", iconName: "" });
                    navHrefs.forEach((href) => onNavItemChange(href, ""));
                    onCustomNavItemsChange(customNavItems.filter((ci) => ci.section !== key));
                  }}
                  className="p-1 text-muted-foreground hover:text-foreground transition-colors"
                  title="Reset section to defaults"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
              )}

              {/* Expand toggle */}
              <button
                onClick={() => toggleExpand(key)}
                className="p-1 text-muted-foreground hover:text-foreground transition-colors"
                title={isExpanded ? "Collapse" : "Expand nav items"}
              >
                {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>
            </div>

            {/* ── Expanded content ─────────────────────────────────────────── */}
            {isExpanded && (
              <div className="border-t border-border">

                {/* Built-in nav items */}
                {navHrefs.length > 0 && (
                  <div className="divide-y divide-border/60">
                    {navHrefs.map((href) => {
                      const isNavHidden = hiddenNavItems.includes(href);
                      return (
                        <div
                          key={href}
                          className={cn(
                            "flex items-center gap-2.5 px-3 py-2 transition-opacity",
                            isNavHidden && "opacity-40"
                          )}
                        >
                          {/* Visibility toggle */}
                          <button
                            onClick={() => onToggleNavItem(href)}
                            className="text-muted-foreground hover:text-foreground flex-shrink-0 p-0.5"
                            title={isNavHidden ? "Show in sidebar" : "Hide from sidebar"}
                          >
                            {isNavHidden ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                          </button>

                          {/* Path label */}
                          <span className="text-xs text-muted-foreground font-mono w-40 flex-shrink-0 truncate">
                            {href}
                          </span>

                          {/* Label input */}
                          <Input
                            value={navItemOverrides?.[href] ?? ""}
                            onChange={(e) => onNavItemChange(href, e.target.value)}
                            placeholder={NAV_DEFAULTS[href] ?? href}
                            className="flex-1 h-8 text-sm"
                            disabled={isNavHidden}
                          />

                          {/* Clear custom label */}
                          {navItemOverrides?.[href] && !isNavHidden && (
                            <button
                              onClick={() => onNavItemChange(href, "")}
                              className="text-muted-foreground hover:text-foreground flex-shrink-0"
                              title="Clear custom label"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Custom links list */}
                {sectionCustoms.length > 0 && (
                  <div className="border-t border-border">
                    <p className="px-3 py-1.5 text-xs font-medium text-muted-foreground bg-muted/10">
                      Custom Links
                    </p>
                    <div className="divide-y divide-border/60">
                      {sectionCustoms.map((ci) => (
                        <div key={ci.id} className="flex items-center gap-2.5 px-3 py-2">
                          <IconPicker
                            value={ci.iconName}
                            onChange={(name) =>
                              onCustomNavItemsChange(
                                customNavItems.map((c) => c.id === ci.id ? { ...c, iconName: name } : c)
                              )
                            }
                            fallbackIconName="Globe"
                            size="sm"
                          />
                          <span className="text-sm font-medium flex-1 truncate">{ci.label}</span>
                          <span className="text-xs text-muted-foreground font-mono flex-1 truncate max-w-[160px]">
                            {ci.url}
                          </span>
                          {ci.url.startsWith("http") && (
                            <span title="Opens in new tab">
                              <ExternalLink className="w-3 h-3 text-muted-foreground flex-shrink-0" />
                            </span>
                          )}
                          <button
                            onClick={() => onCustomNavItemsChange(customNavItems.filter((c) => c.id !== ci.id))}
                            className="text-muted-foreground hover:text-red-500 flex-shrink-0 transition-colors"
                            title="Remove link"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Add custom link */}
                <div className="border-t border-border bg-muted/5">
                  {addingLinkFor === key ? (
                    <div className="p-3 space-y-2">
                      <p className="text-xs font-medium">Add Custom Link to {override.label || label}</p>
                      <div className="flex gap-2 flex-wrap">
                        <Input
                          placeholder="Label (e.g. Company Wiki)"
                          value={newLink.label}
                          onChange={(e) => setNewLink((n) => ({ ...n, label: e.target.value }))}
                          className="flex-1 min-w-[140px] h-8 text-sm"
                        />
                        <Input
                          placeholder="URL (e.g. https://notion.so/… or /dashboard)"
                          value={newLink.url}
                          onChange={(e) => setNewLink((n) => ({ ...n, url: e.target.value }))}
                          className="flex-1 min-w-[200px] h-8 text-sm font-mono"
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1.5">
                          <IconPicker
                            value={newLink.iconName || undefined}
                            onChange={(name) => setNewLink((n) => ({ ...n, iconName: name }))}
                            fallbackIconName="Globe"
                            size="sm"
                          />
                          <span className="text-xs text-muted-foreground">Icon (optional)</span>
                        </div>
                        <div className="flex-1" />
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => { setAddingLinkFor(null); setNewLink({ label: "", url: "", iconName: "" }); }}
                        >
                          Cancel
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => addCustomLink(key)}
                          disabled={!newLink.label.trim() || !newLink.url.trim()}
                        >
                          <Plus className="w-3.5 h-3.5 mr-1" /> Add
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => { setAddingLinkFor(key); setNewLink({ label: "", url: "", iconName: "" }); }}
                      className="w-full flex items-center gap-1.5 px-3 py-2 text-xs text-muted-foreground hover:text-foreground hover:bg-muted/20 transition-colors text-left"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Add custom link to this section
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── Roles Panel ────────────────────────────────────────────────────────────

function RolesPanel({
  roleLabels, onChange,
}: {
  roleLabels: Record<string, string>;
  onChange: (rl: Record<string, string>) => void;
}) {
  const setLabel = (role: string, value: string) => {
    const next = { ...roleLabels };
    if (value.trim()) next[role] = value;
    else delete next[role];
    onChange(next);
  };

  return (
    <div className="space-y-5">
      <div className="bg-muted/20 border border-border rounded-lg p-3 text-sm text-muted-foreground">
        Rename how each role appears throughout the portal — sidebar badge, admin tables, user cards.
        The underlying role permissions and system behaviour are not affected.
        Leave a field blank to keep the default.
      </div>

      <div className="space-y-2">
        {ALL_ROLES.map((role) => {
          const custom      = roleLabels[role] ?? "";
          const displayName = custom || DEFAULT_ROLE_LABELS[role] || role;
          const isExec      = ["CEO", "CMO", "CTO"].includes(role);

          return (
            <div key={role} className="flex items-center gap-3 p-3 rounded-lg border border-border bg-card">
              {/* Role key badge */}
              <Badge
                variant="outline"
                className={cn(
                  "font-mono text-xs w-24 justify-center flex-shrink-0",
                  isExec ? "border-primary/40 text-primary" : ""
                )}
              >
                {role}
              </Badge>

              {/* Label input */}
              <Input
                value={custom}
                onChange={(e) => setLabel(role, e.target.value)}
                placeholder={DEFAULT_ROLE_LABELS[role] ?? role}
                className="flex-1 max-w-xs h-9 text-sm"
              />

              {/* Reset */}
              {custom && (
                <button
                  onClick={() => setLabel(role, "")}
                  className="text-muted-foreground hover:text-foreground transition-colors p-1"
                  title="Reset to default"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
              )}

              {/* Live preview arrow */}
              <span className="text-xs text-muted-foreground flex items-center gap-1 ml-auto flex-shrink-0">
                <span className="opacity-50">→</span>
                <span className="font-medium text-foreground">{displayName}</span>
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Custom Roles Panel ─────────────────────────────────────────────────────

type CustomRoleData = {
  id: string;
  name: string;
  color: string;
  description: string | null;
  createdAt: string;
  createdBy: string;
  _count: { users: number };
};

type UserData = {
  id: string;
  name: string;
  email: string;
  image: string | null;
  role: string;
  jobTitle: string | null;
  department: string | null;
};

function CustomRolesPanel() {
  const [roles, setRoles] = useState<CustomRoleData[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [newForm, setNewForm] = useState({ name: "", color: "#6366f1", description: "" });
  const [savingNew, setSavingNew] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const fetchRoles = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/custom-roles");
      const data = await res.json();
      if (data.data) setRoles(data.data);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchRoles(); }, [fetchRoles]);

  const handleCreate = async () => {
    if (!newForm.name.trim()) return;
    setSavingNew(true);
    try {
      const res = await fetch("/api/custom-roles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newForm),
      });
      const data = await res.json();
      if (data.error) { alert(data.error); return; }
      setCreating(false);
      setNewForm({ name: "", color: "#6366f1", description: "" });
      await fetchRoles();
    } finally { setSavingNew(false); }
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-muted-foreground py-6">
        <RefreshCw className="w-4 h-4 animate-spin" />
        <span className="text-sm">Loading custom roles...</span>
      </div>
    );
  }

  return (
    <div className="space-y-4 mt-8 pt-8 border-t border-border">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-bold text-base flex items-center gap-2">
            <UserCog className="w-4 h-4 text-muted-foreground" /> Custom Roles
          </h3>
          <p className="text-sm text-muted-foreground mt-0.5">
            Create custom roles with specific feature access, independent of system roles.
          </p>
        </div>
        {!creating && (
          <Button size="sm" onClick={() => setCreating(true)}>
            <Plus className="w-3.5 h-3.5 mr-1.5" /> Create Custom Role
          </Button>
        )}
      </div>

      {/* Create form */}
      {creating && (
        <div className="border border-border rounded-xl p-4 bg-muted/10 space-y-3">
          <p className="text-sm font-medium">New Custom Role</p>
          <div className="flex gap-3 flex-wrap">
            <Input
              placeholder="Role name (e.g. Marketing Lead)"
              value={newForm.name}
              onChange={(e) => setNewForm((f) => ({ ...f, name: e.target.value }))}
              className="flex-1 min-w-[200px]"
            />
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={newForm.color}
                onChange={(e) => setNewForm((f) => ({ ...f, color: e.target.value }))}
                className="h-9 w-14 rounded-lg border border-border cursor-pointer bg-transparent p-0.5"
                title="Pick a colour"
              />
              <span className="text-xs text-muted-foreground">Color</span>
            </div>
          </div>
          <Input
            placeholder="Description (optional)"
            value={newForm.description}
            onChange={(e) => setNewForm((f) => ({ ...f, description: e.target.value }))}
          />
          <div className="flex gap-2 justify-end">
            <Button variant="outline" size="sm" onClick={() => { setCreating(false); setNewForm({ name: "", color: "#6366f1", description: "" }); }}>
              Cancel
            </Button>
            <Button size="sm" onClick={handleCreate} disabled={savingNew || !newForm.name.trim()}>
              {savingNew && <RefreshCw className="w-3.5 h-3.5 animate-spin mr-1.5" />}
              Save
            </Button>
          </div>
        </div>
      )}

      {/* Role cards */}
      {roles.length === 0 && !creating && (
        <div className="text-center py-8 text-muted-foreground text-sm border border-dashed border-border rounded-xl">
          No custom roles yet. Create one to get started.
        </div>
      )}

      <div className="space-y-3">
        {roles.map((role) => (
          <CustomRoleCard
            key={role.id}
            role={role}
            expanded={expandedId === role.id}
            onToggle={() => setExpandedId((prev) => (prev === role.id ? null : role.id))}
            onRefresh={fetchRoles}
          />
        ))}
      </div>
    </div>
  );
}

function CustomRoleCard({
  role, expanded, onToggle, onRefresh,
}: {
  role: CustomRoleData;
  expanded: boolean;
  onToggle: () => void;
  onRefresh: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({ name: role.name, color: role.color, description: role.description ?? "" });
  const [savingEdit, setSavingEdit] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Feature access state
  const [featureLoading, setFeatureLoading] = useState(false);
  const [featureList, setFeatureList] = useState<string[]>([]);
  const [featureSaving, setFeatureSaving] = useState(false);
  const [featuresLoaded, setFeaturesLoaded] = useState(false);

  // Users state
  const [usersPanel, setUsersPanel] = useState(false);
  const [allUsers, setAllUsers] = useState<UserData[]>([]);
  const [assignedUserIds, setAssignedUserIds] = useState<string[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [userSearch, setUserSearch] = useState("");
  const [usersSaving, setUsersSaving] = useState(false);
  const [confirmUsers, setConfirmUsers] = useState(false);

  useEffect(() => {
    if (expanded && !featuresLoaded) {
      setFeatureLoading(true);
      fetch(`/api/custom-roles/${role.id}/features`)
        .then((r) => r.json())
        .then((d) => { if (d.data) setFeatureList(d.data.features ?? []); })
        .finally(() => { setFeatureLoading(false); setFeaturesLoaded(true); });
    }
  }, [expanded, featuresLoaded, role.id]);

  const toggleFeature = async (key: string) => {
    const next = featureList.includes(key)
      ? featureList.filter((f) => f !== key)
      : [...featureList, key];
    setFeatureList(next);
    setFeatureSaving(true);
    try {
      await fetch(`/api/custom-roles/${role.id}/features`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ features: next }),
      });
    } finally { setFeatureSaving(false); }
  };

  const openUsersPanel = async () => {
    setUsersPanel(true);
    setUsersLoading(true);
    try {
      const [allRes, assignedRes] = await Promise.all([
        fetch("/api/users?status=ACTIVE&limit=200"),
        fetch(`/api/custom-roles/${role.id}/users`),
      ]);
      const [allData, assignedData] = await Promise.all([allRes.json(), assignedRes.json()]);
      if (allData.data) setAllUsers(allData.data.users ?? allData.data);
      if (assignedData.data) setAssignedUserIds((assignedData.data as UserData[]).map((u) => u.id));
    } finally { setUsersLoading(false); }
  };

  const saveUsers = async () => {
    setUsersSaving(true);
    try {
      const res = await fetch(`/api/custom-roles/${role.id}/users`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userIds: assignedUserIds }),
      });
      const data = await res.json();
      if (data.error) { alert(data.error); return; }
      setConfirmUsers(false);
      setUsersPanel(false);
      await onRefresh();
    } finally { setUsersSaving(false); }
  };

  const saveEdit = async () => {
    setSavingEdit(true);
    try {
      const res = await fetch(`/api/custom-roles/${role.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editForm),
      });
      const data = await res.json();
      if (data.error) { alert(data.error); return; }
      setEditing(false);
      await onRefresh();
    } finally { setSavingEdit(false); }
  };

  const deleteRole = async () => {
    setDeleting(true);
    try {
      const res = await fetch(`/api/custom-roles/${role.id}`, { method: "DELETE" });
      const data = await res.json();
      if (data.error) { alert(data.error); return; }
      setConfirmDelete(false);
      await onRefresh();
    } finally { setDeleting(false); }
  };

  const filteredUsers = allUsers.filter((u) =>
    userSearch
      ? u.name.toLowerCase().includes(userSearch.toLowerCase()) ||
        u.email.toLowerCase().includes(userSearch.toLowerCase())
      : true
  );

  return (
    <div className="border border-border rounded-xl overflow-hidden">
      {/* Card header */}
      <div className="flex items-center gap-3 p-4 bg-card">
        <div
          className="w-4 h-4 rounded-full flex-shrink-0"
          style={{ background: role.color }}
        />
        {editing ? (
          <div className="flex-1 flex gap-2 flex-wrap items-center">
            <Input
              value={editForm.name}
              onChange={(e) => setEditForm((f) => ({ ...f, name: e.target.value }))}
              className="w-48 h-8 text-sm"
              placeholder="Role name"
            />
            <input
              type="color"
              value={editForm.color}
              onChange={(e) => setEditForm((f) => ({ ...f, color: e.target.value }))}
              className="h-8 w-12 rounded border border-border cursor-pointer bg-transparent p-0.5"
            />
            <Input
              value={editForm.description}
              onChange={(e) => setEditForm((f) => ({ ...f, description: e.target.value }))}
              className="flex-1 min-w-[180px] h-8 text-sm"
              placeholder="Description (optional)"
            />
            <Button size="sm" variant="outline" onClick={() => setEditing(false)} disabled={savingEdit}>Cancel</Button>
            <Button size="sm" onClick={saveEdit} disabled={savingEdit || !editForm.name.trim()}>
              {savingEdit && <RefreshCw className="w-3.5 h-3.5 animate-spin mr-1.5" />}
              Save
            </Button>
          </div>
        ) : (
          <>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-sm">{role.name}</span>
                <Badge variant="outline" className="text-[10px]">
                  {role._count.users} user{role._count.users !== 1 ? "s" : ""}
                </Badge>
              </div>
              {role.description && (
                <p className="text-xs text-muted-foreground mt-0.5 truncate">{role.description}</p>
              )}
            </div>
            <button
              onClick={() => { setEditing(true); setEditForm({ name: role.name, color: role.color, description: role.description ?? "" }); }}
              className="p-1.5 text-muted-foreground hover:text-foreground transition-colors"
              title="Edit role"
            >
              <Pencil className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setConfirmDelete(true)}
              className="p-1.5 text-muted-foreground hover:text-red-500 transition-colors"
              title="Delete role"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={onToggle}
              className="p-1.5 text-muted-foreground hover:text-foreground transition-colors"
              title={expanded ? "Collapse" : "Expand"}
            >
              {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          </>
        )}
      </div>

      {/* Expanded content */}
      {expanded && !editing && (
        <div className="border-t border-border divide-y divide-border/60">
          {/* Features section */}
          <div className="p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Shield className="w-3.5 h-3.5 text-muted-foreground" />
                <span className="text-sm font-medium">Feature Access</span>
                {featureSaving && <RefreshCw className="w-3 h-3 animate-spin text-muted-foreground" />}
              </div>
            </div>
            {featureLoading ? (
              <div className="flex items-center gap-2 text-muted-foreground text-xs py-2">
                <RefreshCw className="w-3 h-3 animate-spin" /> Loading features...
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {FEATURES.map((feat) => {
                  const checked = featureList.includes(feat.key);
                  return (
                    <label
                      key={feat.key}
                      className={cn(
                        "flex items-center gap-2 px-2.5 py-1.5 rounded-lg border cursor-pointer text-xs transition-colors select-none",
                        checked
                          ? "border-primary/50 bg-primary/8 text-foreground"
                          : "border-border hover:border-border/80 hover:bg-muted/30 text-muted-foreground"
                      )}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleFeature(feat.key)}
                        className="w-3 h-3 accent-primary"
                      />
                      {feat.label}
                    </label>
                  );
                })}
              </div>
            )}
          </div>

          {/* Users section */}
          <div className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="w-3.5 h-3.5 text-muted-foreground" />
                <span className="text-sm font-medium">Assigned Users</span>
                <Badge variant="outline" className="text-[10px]">
                  {role._count.users}
                </Badge>
              </div>
              {!usersPanel && (
                <Button size="sm" variant="outline" onClick={openUsersPanel}>
                  Manage
                </Button>
              )}
            </div>

            {usersPanel && (
              <div className="mt-3 space-y-3">
                {usersLoading ? (
                  <div className="flex items-center gap-2 text-muted-foreground text-xs py-2">
                    <RefreshCw className="w-3 h-3 animate-spin" /> Loading users...
                  </div>
                ) : (
                  <>
                    <Input
                      placeholder="Search users..."
                      value={userSearch}
                      onChange={(e) => setUserSearch(e.target.value)}
                      className="h-8 text-sm"
                    />
                    <div className="max-h-52 overflow-y-auto space-y-1 border border-border rounded-lg p-2">
                      {filteredUsers.length === 0 && (
                        <p className="text-xs text-muted-foreground text-center py-4">No users found.</p>
                      )}
                      {filteredUsers.map((u) => {
                        const assigned = assignedUserIds.includes(u.id);
                        return (
                          <label
                            key={u.id}
                            className={cn(
                              "flex items-center gap-2.5 px-2 py-1.5 rounded-lg cursor-pointer transition-colors select-none text-sm",
                              assigned ? "bg-primary/8" : "hover:bg-muted/30"
                            )}
                          >
                            <input
                              type="checkbox"
                              checked={assigned}
                              onChange={() =>
                                setAssignedUserIds((prev) =>
                                  assigned ? prev.filter((id) => id !== u.id) : [...prev, u.id]
                                )
                              }
                              className="w-3.5 h-3.5 accent-primary"
                            />
                            <div className="flex-1 min-w-0">
                              <span className="font-medium truncate block">{u.name}</span>
                              <span className="text-xs text-muted-foreground truncate block">{u.email}</span>
                            </div>
                            <Badge variant="outline" className="text-[10px] flex-shrink-0">{u.role}</Badge>
                          </label>
                        );
                      })}
                    </div>
                    <div className="flex gap-2 justify-end">
                      <Button size="sm" variant="outline" onClick={() => { setUsersPanel(false); setUserSearch(""); }}>
                        Cancel
                      </Button>
                      <Button size="sm" onClick={() => setConfirmUsers(true)}>
                        <Check className="w-3.5 h-3.5 mr-1.5" /> Save Assignments
                      </Button>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Delete confirm */}
      <ConfirmDialog
        open={confirmDelete}
        title={`Delete "${role.name}"?`}
        message="This custom role will be permanently deleted and removed from all feature access settings. Users assigned this role will lose it."
        confirmLabel="Delete Role"
        saving={deleting}
        onCancel={() => setConfirmDelete(false)}
        onConfirm={deleteRole}
      />

      {/* Users save confirm */}
      <ConfirmDialog
        open={confirmUsers}
        title="Save user assignments?"
        message={`${assignedUserIds.length} user${assignedUserIds.length !== 1 ? "s" : ""} will be assigned to "${role.name}". Previous assignments will be replaced.`}
        confirmLabel="Save Assignments"
        saving={usersSaving}
        onCancel={() => setConfirmUsers(false)}
        onConfirm={saveUsers}
      />
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
  const toggle = (role: string) =>
    onChange(
      currentRoles.includes(role)
        ? currentRoles.filter((r) => r !== role)
        : [...currentRoles, role]
    );

  return (
    <div className="space-y-4">
      <div className="bg-muted/20 border border-border rounded-lg p-3 text-sm text-muted-foreground">
        Select which roles can access and use the Portal Design Studio. At least one executive role (CEO, CMO, or CTO) should always be included to avoid losing access.
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {ALL_ROLES.map((role) => {
          const checked = currentRoles.includes(role);
          const isExec  = ["CEO", "CMO", "CTO"].includes(role);
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
              <span className="text-sm font-medium flex-1">
                {DEFAULT_ROLE_LABELS[role] ?? role}
              </span>
              {isExec && (
                <Badge variant="outline" className="text-[10px] px-1 py-0 text-primary border-primary/30">
                  Exec
                </Badge>
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
  designRoles:   string[];
  companyName:   string;
}

export function DesignStudio({ initialConfig, designRoles, companyName }: Props) {
  const [tab, setTab] = useState<"brand" | "nav" | "roles" | "access">("brand");
  const [saving, setSaving] = useState(false);

  // ── Brand state ──────────────────────────────────────────────────────────
  const [brand, setBrand] = useState<DesignConfig>({
    portalTitle:  initialConfig.portalTitle  ?? "",
    logoUrl:      initialConfig.logoUrl      ?? "",
    faviconUrl:   initialConfig.faviconUrl   ?? "",
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
  const [hiddenSections, setHiddenSections] = useState<string[]>(
    initialConfig.hiddenSections ?? []
  );
  const [sectionOrder, setSectionOrder] = useState<string[]>(
    initialConfig.sectionOrder?.length
      ? initialConfig.sectionOrder
      : DEFAULT_SECTION_ORDER
  );
  const [hiddenNavItems, setHiddenNavItems] = useState<string[]>(
    initialConfig.hiddenNavItems ?? []
  );
  const [customNavItems, setCustomNavItems] = useState<CustomNavItem[]>(
    initialConfig.customNavItems ?? []
  );
  const [confirmNav, setConfirmNav] = useState(false);

  // ── Role labels state ─────────────────────────────────────────────────────
  const [roleLabels, setRoleLabels] = useState<Record<string, string>>(
    initialConfig.roleLabels ?? {}
  );
  const [confirmRoles, setConfirmRoles] = useState(false);

  // ── Access state ─────────────────────────────────────────────────────────
  const [roles, setRoles] = useState<string[]>(designRoles);
  const [confirmAccess, setConfirmAccess] = useState(false);

  // ── Navigation helpers ────────────────────────────────────────────────────

  const patchSection = (key: string, patch: { label?: string; iconName?: string }) => {
    setSectionOverrides((prev) => {
      const merged = { ...(prev[key] ?? {}), ...patch };
      if (!merged.label)    delete merged.label;
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

  const toggleSection = (key: string) =>
    setHiddenSections((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );

  const moveSection = (key: string, dir: "up" | "down") => {
    setSectionOrder((prev) => {
      const idx = prev.indexOf(key);
      if (idx === -1) return prev;
      const swap = dir === "up" ? idx - 1 : idx + 1;
      if (swap < 0 || swap >= prev.length) return prev;
      const next = [...prev];
      [next[idx], next[swap]] = [next[swap], next[idx]];
      return next;
    });
  };

  const toggleNavItem = (href: string) =>
    setHiddenNavItems((prev) =>
      prev.includes(href) ? prev.filter((h) => h !== href) : [...prev, href]
    );

  // ── Save handlers ─────────────────────────────────────────────────────────

  const saveBrand = async () => {
    setSaving(true);
    try {
      const current = await fetchCurrentConfig();
      const merged  = { ...current, ...brand };
      if (!merged.portalTitle) delete merged.portalTitle;
      if (!merged.logoUrl)     delete merged.logoUrl;
      if (!merged.faviconUrl)  delete merged.faviconUrl;
      await saveDesignConfig(merged);
      setConfirmBrand(false);
    } finally { setSaving(false); }
  };

  const saveNav = async () => {
    setSaving(true);
    try {
      const current = await fetchCurrentConfig();
      await saveDesignConfig({
        ...current,
        sections:       sectionOverrides,
        navItems:       navItemOverrides,
        hiddenSections,
        sectionOrder,
        hiddenNavItems,
        customNavItems,
      });
      setConfirmNav(false);
    } finally { setSaving(false); }
  };

  const saveRoleLabels = async () => {
    setSaving(true);
    try {
      const current = await fetchCurrentConfig();
      await saveDesignConfig({ ...current, roleLabels });
      setConfirmRoles(false);
    } finally { setSaving(false); }
  };

  const saveAccess = async () => {
    setSaving(true);
    try {
      const res  = await fetch("/api/design", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roles }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setConfirmAccess(false);
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : "Failed to save access settings");
    } finally { setSaving(false); }
  };

  // ── Counts for tab badges ─────────────────────────────────────────────────

  const navChanges =
    Object.keys(sectionOverrides).length +
    Object.keys(navItemOverrides).length +
    hiddenSections.length +
    hiddenNavItems.length +
    customNavItems.length;

  const roleChanges = Object.keys(roleLabels).length;

  return (
    <div>
      {/* ── Page header ───────────────────────────────────────────────────── */}
      <div className="flex items-start justify-between gap-4 mb-6 pb-4 border-b border-border">
        <div>
          <h1 className="text-2xl font-bold gradient-text flex items-center gap-2">
            <Palette className="w-6 h-6" /> Portal Design Studio
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Customise every visual aspect of{" "}
            <span className="font-medium text-foreground">{companyName}</span>
            {"'"}s portal. Changes apply to all users instantly.
          </p>
        </div>
      </div>

      {/* ── Tabs ──────────────────────────────────────────────────────────── */}
      <div className="flex gap-1 mb-6 p-1 bg-muted/30 rounded-lg w-fit border border-border flex-wrap">
        {([
          { key: "brand",  label: "Brand",      icon: Monitor,     count: 0 },
          { key: "nav",    label: "Navigation",  icon: Navigation2, count: navChanges },
          { key: "roles",  label: "Roles",       icon: Tag,         count: roleChanges },
          { key: "access", label: "Access",      icon: Users,       count: 0 },
        ] as const).map(({ key, label, icon: Icon, count }) => (
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
            {count > 0 && (
              <span className="ml-0.5 px-1.5 py-0.5 rounded-full bg-primary/15 text-primary text-[10px] font-bold leading-none">
                {count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ── Panel content ─────────────────────────────────────────────────── */}
      <div className="bg-card border border-border rounded-xl p-6">

        {/* Brand */}
        {tab === "brand" && (
          <>
            <h2 className="text-base font-bold mb-1 flex items-center gap-2">
              <ImageIcon className="w-4 h-4 text-muted-foreground" /> Brand Identity
            </h2>
            <p className="text-sm text-muted-foreground mb-6">
              Logo appears in the sidebar. Favicon appears in the browser tab. Accent colour is applied globally.
            </p>
            <BrandPanel config={brand} onChange={(p) => setBrand((b) => ({ ...b, ...p }))} />
            <div className="flex justify-end mt-8 pt-4 border-t border-border">
              <Button onClick={() => setConfirmBrand(true)}>
                <Check className="w-4 h-4 mr-1.5" /> Apply Brand Changes
              </Button>
            </div>
          </>
        )}

        {/* Navigation */}
        {tab === "nav" && (
          <>
            <h2 className="text-base font-bold mb-1 flex items-center gap-2">
              <Navigation2 className="w-4 h-4 text-muted-foreground" /> Navigation
            </h2>
            <p className="text-sm text-muted-foreground mb-6">
              Reorder, rename, and show/hide sidebar sections and nav items. Add custom links to external tools or internal pages.
            </p>
            <NavigationPanel
              sectionOverrides={sectionOverrides}
              navItemOverrides={navItemOverrides}
              hiddenSections={hiddenSections}
              sectionOrder={sectionOrder}
              hiddenNavItems={hiddenNavItems}
              customNavItems={customNavItems}
              onSectionChange={patchSection}
              onNavItemChange={patchNavItem}
              onToggleSection={toggleSection}
              onMoveSection={moveSection}
              onToggleNavItem={toggleNavItem}
              onCustomNavItemsChange={setCustomNavItems}
            />
            <div className="flex justify-end mt-8 pt-4 border-t border-border">
              <Button onClick={() => setConfirmNav(true)}>
                <Check className="w-4 h-4 mr-1.5" /> Apply Navigation Changes
              </Button>
            </div>
          </>
        )}

        {/* Roles */}
        {tab === "roles" && (
          <>
            <h2 className="text-base font-bold mb-1 flex items-center gap-2">
              <Tag className="w-4 h-4 text-muted-foreground" /> Role Display Labels
            </h2>
            <p className="text-sm text-muted-foreground mb-6">
              Rename how each role is displayed in the UI. Permissions are unaffected.
            </p>
            <RolesPanel roleLabels={roleLabels} onChange={setRoleLabels} />
            <div className="flex justify-end mt-8 pt-4 border-t border-border">
              <Button onClick={() => setConfirmRoles(true)}>
                <Check className="w-4 h-4 mr-1.5" /> Apply Role Labels
              </Button>
            </div>
            <CustomRolesPanel />
          </>
        )}

        {/* Access */}
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
        message="This updates the portal title, logo, favicon, and accent colour for all users immediately."
        confirmLabel="Apply Changes"
        saving={saving}
        onCancel={() => setConfirmBrand(false)}
        onConfirm={saveBrand}
      />
      <ConfirmDialog
        open={confirmNav}
        title="Apply navigation changes?"
        message="Section order, labels, icons, visibility, and custom links will update in the sidebar for all users immediately."
        confirmLabel="Apply Changes"
        saving={saving}
        onCancel={() => setConfirmNav(false)}
        onConfirm={saveNav}
      />
      <ConfirmDialog
        open={confirmRoles}
        title="Apply role label changes?"
        message="Role display names will update across the portal for all users. Permissions are not changed."
        confirmLabel="Apply Labels"
        saving={saving}
        onCancel={() => setConfirmRoles(false)}
        onConfirm={saveRoleLabels}
      />
      <ConfirmDialog
        open={confirmAccess}
        title="Save access settings?"
        message={`The Design Studio will be accessible to: ${roles.join(", ") || "no one"}. Ensure at least one exec role is included.`}
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
  window.location.reload();
}
