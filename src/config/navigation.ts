import React from "react";
import {
  LayoutDashboard,
  Image as ImageIcon,
  Images,
  Settings,
  History,
  ShieldCheck,
  Heart,
  Inbox,
} from "lucide-react";
import { ROUTES } from "@/constants/routes";

export interface NavigationItem {
  id: string;
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  route: string;
  enabled: boolean;
  badge?: string | null;
}

/**
 * Phase 7 Updated: Configuration-driven sidebar navigation items.
 * All phases 1–6 are active. Activity Log badge updated to "Active".
 */
export const navigationItems: NavigationItem[] = [
  {
    id: "dashboard",
    title: "Dashboard",
    icon: LayoutDashboard,
    route: ROUTES.ADMIN.DASHBOARD,
    enabled: true,
    badge: null,
  },
  {
    id: "images",
    title: "Website",
    icon: ImageIcon,
    route: ROUTES.ADMIN.IMAGES,
    enabled: true,
    badge: null,
  },
  {
    id: "gallery",
    title: "Gallery",
    icon: Images,
    route: ROUTES.ADMIN.GALLERY,
    enabled: true,
    badge: null,
  },
  {
    id: "wedding-stories",
    title: "Wedding Stories",
    icon: Heart,
    route: ROUTES.ADMIN.STORIES,
    enabled: true,
    badge: null,
  },
  {
    id: "settings",
    title: "Global Settings",
    icon: Settings,
    route: ROUTES.ADMIN.SETTINGS,
    enabled: true,
    badge: null,
  },
  {
    id: "inquiries",
    title: "Inquiries",
    icon: Inbox,
    route: ROUTES.ADMIN.INQUIRIES,
    enabled: true,
    badge: null,
  },
  {
    id: "activity",
    title: "Activity Log",
    icon: History,
    route: ROUTES.ADMIN.ACTIVITY,
    enabled: true,
    badge: null,
  },
  {
    id: "debug",
    title: "Diagnostics",
    icon: ShieldCheck,
    route: ROUTES.ADMIN.DEBUG,
    enabled: true,
    badge: null,
  },
];
