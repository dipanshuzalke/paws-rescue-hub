import {
  Activity,
  BarChart3,
  Bell,
  Building2,
  ClipboardList,
  FileText,
  Gauge,
  History,
  Inbox,
  Map,
  PlusCircle,
  Settings,
  Siren,
  User,
  UserCog,
  Users,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

import type { Role } from "@/types";

export interface NavItem {
  to: string;
  label: string;
  icon: LucideIcon;
  exact?: boolean;
}

export const navConfig: Record<Role, NavItem[]> = {
  citizen: [
    { to: "/citizen/dashboard", label: "Dashboard", icon: Gauge },
    { to: "/citizen/report", label: "Report Animal", icon: PlusCircle },
    { to: "/citizen/reports", label: "My Reports", icon: FileText },
    { to: "/citizen/rescues", label: "Active Rescues", icon: Siren },
    { to: "/citizen/history", label: "Rescue History", icon: History },
    { to: "/citizen/notifications", label: "Notifications", icon: Bell },
    { to: "/citizen/profile", label: "Profile", icon: User },
    { to: "/citizen/settings", label: "Settings", icon: Settings },
  ],
  rescuer: [
    { to: "/rescuer/dashboard", label: "Dashboard", icon: Gauge },
    { to: "/rescuer/requests", label: "Available Requests", icon: Inbox },
    { to: "/rescuer/active", label: "Active Rescues", icon: Siren },
    { to: "/rescuer/history", label: "Rescue History", icon: History },
    { to: "/rescuer/map", label: "Map", icon: Map },
    { to: "/rescuer/notifications", label: "Notifications", icon: Bell },
    { to: "/rescuer/profile", label: "Profile", icon: User },
    { to: "/rescuer/settings", label: "Settings", icon: Settings },
  ],
  ngo: [
    { to: "/ngo/dashboard", label: "Dashboard", icon: Gauge },
    { to: "/ngo/requests", label: "Rescue Requests", icon: Inbox },
    { to: "/ngo/assignments", label: "Assignments", icon: ClipboardList },
    { to: "/ngo/rescuers", label: "Rescuers", icon: Users },
    { to: "/ngo/active", label: "Active Rescues", icon: Siren },
    { to: "/ngo/history", label: "Completed Cases", icon: History },
    { to: "/ngo/analytics", label: "Analytics", icon: BarChart3 },
    { to: "/ngo/notifications", label: "Notifications", icon: Bell },
    { to: "/ngo/profile", label: "Organization Profile", icon: Building2 },
    { to: "/ngo/settings", label: "Settings", icon: Settings },
  ],
  admin: [
    { to: "/admin/dashboard", label: "Dashboard", icon: Gauge },
    { to: "/admin/users", label: "Users", icon: Users },
    { to: "/admin/citizens", label: "Citizens", icon: User },
    { to: "/admin/rescuers", label: "Rescuers", icon: UserCog },
    { to: "/admin/ngos", label: "NGOs", icon: Building2 },
    { to: "/admin/reports", label: "Rescue Reports", icon: FileText },
    { to: "/admin/active-rescues", label: "Active Rescues", icon: Siren },
    { to: "/admin/analytics", label: "Analytics", icon: BarChart3 },
    { to: "/admin/activity", label: "System Activity", icon: Activity },
    { to: "/admin/settings", label: "Settings", icon: Settings },
  ],
};

export const roleLabels: Record<Role, string> = {
  citizen: "Citizen",
  rescuer: "Rescuer",
  ngo: "NGO Coordinator",
  admin: "Administrator",
};

/** Mobile bottom-bar shortcuts per role (max 4 + more). */
export const mobileNav: Record<Role, NavItem[]> = {
  citizen: [
    { to: "/citizen/dashboard", label: "Home", icon: Gauge },
    { to: "/citizen/reports", label: "Reports", icon: FileText },
    { to: "/citizen/report", label: "Report", icon: PlusCircle },
    { to: "/citizen/notifications", label: "Alerts", icon: Bell },
  ],
  rescuer: [
    { to: "/rescuer/dashboard", label: "Home", icon: Gauge },
    { to: "/rescuer/requests", label: "Requests", icon: Inbox },
    { to: "/rescuer/active", label: "Active", icon: Siren },
    { to: "/rescuer/map", label: "Map", icon: Map },
  ],
  ngo: [
    { to: "/ngo/dashboard", label: "Home", icon: Gauge },
    { to: "/ngo/requests", label: "Requests", icon: Inbox },
    { to: "/ngo/active", label: "Active", icon: Siren },
    { to: "/ngo/analytics", label: "Analytics", icon: BarChart3 },
  ],
  admin: [
    { to: "/admin/dashboard", label: "Home", icon: Gauge },
    { to: "/admin/users", label: "Users", icon: Users },
    { to: "/admin/reports", label: "Reports", icon: FileText },
    { to: "/admin/activity", label: "Activity", icon: Activity },
  ],
};