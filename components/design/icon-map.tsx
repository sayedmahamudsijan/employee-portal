/**
 * Map of icon name strings → Lucide React components.
 * Used by the Sidebar to resolve stored icon names to components,
 * and by the Design Studio icon picker.
 */
import type { LucideIcon } from "lucide-react";
import {
  Layers, Sprout, Globe, Briefcase, ShieldCheck, UserCircle2,
  History, Building2, Zap, Compass, LayoutGrid, Rocket,
  BookOpen, Star, Heart, Flame, Award, Crown, Target,
  TrendingUp, Users, Settings, Bell, Palette, Coffee,
  Diamond, Headphones, Laptop, Map, Package, Boxes,
  FolderOpen, BarChart2, PieChart, Lock, Megaphone,
  Link2, ExternalLink, Tag, Hash, FileText, Calendar, ChevronRight,
} from "lucide-react";

export const DESIGN_ICON_MAP: Record<string, LucideIcon> = {
  Layers, Sprout, Globe, Briefcase, ShieldCheck, UserCircle2,
  History, Building2, Zap, Compass, LayoutGrid, Rocket,
  BookOpen, Star, Heart, Flame, Award, Crown, Target,
  TrendingUp, Users, Settings, Bell, Palette, Coffee,
  Diamond, Headphones, Laptop, Map, Package, Boxes,
  FolderOpen, BarChart2, PieChart, Lock, Megaphone,
  Link2, ExternalLink, Tag, Hash, FileText, Calendar, ChevronRight,
};
