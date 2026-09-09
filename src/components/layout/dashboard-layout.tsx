import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import {
  Bell,
  ChevronRight,
  LogOut,
  Menu,
  PanelLeftClose,
  PanelLeftOpen,
  Search,
  Settings,
  User as UserIcon,
} from "lucide-react";
import { useEffect, useState } from "react";
import type { ReactNode } from "react";

import { Logo } from "@/components/layout/logo";
import { mobileNav, navConfig, roleLabels } from "@/components/layout/nav-config";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { initials, timeAgo } from "@/lib/format";
import { cn } from "@/lib/utils";
import { useApp } from "@/store/app-store";
import type { Role } from "@/types";

function NavList({ role, onNavigate }: { role: Role; onNavigate?: () => void }) {
  return (
    <nav aria-label="Dashboard" className="flex flex-col gap-1 p-3">
      {navConfig[role].map((item) => (
        <Link
          key={item.to}
          to={item.to}
          onClick={onNavigate}
          className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-sidebar-foreground transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground data-[status=active]:bg-sidebar-accent data-[status=active]:text-sidebar-accent-foreground"
        >
          <item.icon className="h-4.5 w-4.5 shrink-0" aria-hidden="true" />
          <span className="truncate">{item.label}</span>
        </Link>
      ))}
    </nav>
  );
}

function Crumbs() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const parts = pathname.split("/").filter(Boolean);
  return (
    <nav aria-label="Breadcrumb" className="hidden min-w-0 items-center gap-1.5 text-sm md:flex">
      {parts.map((p, i) => (
        <span key={`${p}-${i}`} className="flex min-w-0 items-center gap-1.5">
          {i > 0 ? (
            <ChevronRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground" aria-hidden="true" />
          ) : null}
          <span
            className={cn(
              "truncate capitalize",
              i === parts.length - 1 ? "font-medium text-foreground" : "text-muted-foreground",
            )}
          >
            {p.replace(/-/g, " ")}
          </span>
        </span>
      ))}
    </nav>
  );
}

export function DashboardLayout({ role, children }: { role: Role; children: ReactNode }) {
  const { user, notifications, unreadCount, markRead, logout, loginAs, apiMode, authReady } = useApp();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  const handleLogout = async () => {
    await logout();
    await navigate({ to: "/login" });
  };

  useEffect(() => {
    // Demo mode auto-signs into the matching role; with the real API the
    // session comes from the backend, so unauthenticated users go to login.
    if (!authReady) return undefined;
    if (user && user.role === role) return undefined;
    if (apiMode) {
      if (user === null) void navigate({ to: "/login", replace: true });
      else {
        const dashboardByRole: Record<Role, string> = {
          citizen: "/citizen/dashboard",
          rescuer: "/rescuer/dashboard",
          ngo: "/ngo/dashboard",
          admin: "/admin/dashboard",
        };
        void navigate({ to: dashboardByRole[user.role], replace: true });
      }
      return undefined;
    }
    void loginAs(role);
    return undefined;
  }, [user, role, loginAs, apiMode, authReady, navigate]);

  if (!authReady || !user || user.role !== role) {
    return (
      <div className="grid min-h-dvh place-items-center bg-background px-4">
        <p className="text-sm text-muted-foreground">Restoring your session...</p>
      </div>
    );
  }

  const roleNotifications = notifications
    .filter((n) => n.role === role || n.role === "all")
    .slice(0, 5);
  const displayName = user?.name ?? roleLabels[role];

  return (
    <div className="flex min-h-dvh bg-background">
      <aside
        className={cn(
          "sticky top-0 hidden h-dvh shrink-0 flex-col border-r border-sidebar-border bg-sidebar transition-[width] duration-200 lg:flex",
          collapsed ? "w-[76px]" : "w-[264px]",
        )}
      >
        <div className="flex h-16 items-center justify-between gap-2 border-b border-sidebar-border px-4">
          <Logo compact={collapsed} />
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto">
          {collapsed ? (
            <nav aria-label="Dashboard" className="flex flex-col items-center gap-1 p-2">
              {navConfig[role].map((item) => (
                <Link
                  key={item.to}
                  to={item.to}
                  title={item.label}
                  aria-label={item.label}
                  className="grid h-10 w-10 place-items-center rounded-lg text-sidebar-foreground hover:bg-sidebar-accent data-[status=active]:bg-sidebar-accent data-[status=active]:text-sidebar-accent-foreground"
                >
                  <item.icon className="h-5 w-5" aria-hidden="true" />
                </Link>
              ))}
            </nav>
          ) : (
            <NavList role={role} />
          )}
        </div>
        <div className="border-t border-sidebar-border p-3">
          <Button
            variant="ghost"
            className="w-full justify-start gap-3"
            onClick={() => setCollapsed((c) => !c)}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? (
              <PanelLeftOpen className="h-4.5 w-4.5" />
            ) : (
              <>
                <PanelLeftClose className="h-4.5 w-4.5" />
                Collapse
              </>
            )}
          </Button>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-40 border-b border-border bg-background/90 backdrop-blur">
          <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 px-4 py-3 sm:px-6">
            <div className="flex min-w-0 items-center gap-3">
              <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
                <SheetTrigger asChild>
                  <Button variant="outline" size="icon" className="lg:hidden" aria-label="Open navigation">
                    <Menu className="h-5 w-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="z-[100] h-dvh w-[280px] overflow-y-auto bg-background p-0">
                  <SheetTitle className="sr-only">Dashboard navigation</SheetTitle>
                  <div className="border-b border-border p-4">
                    <Logo />
                  </div>
                  <NavList role={role} onNavigate={() => setMobileOpen(false)} />
                </SheetContent>
              </Sheet>
              <Crumbs />
              <label className="relative hidden min-w-0 flex-1 xl:block">
                <span className="sr-only">Search rescues</span>
                <Search
                  className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground"
                  aria-hidden="true"
                />
                <Input
                  type="search"
                  placeholder="Search rescues, rescuers, locations…"
                  className="max-w-sm bg-card pl-9"
                />
              </label>
            </div>

            <div className="flex items-center gap-1.5">
              <DropdownMenu
                onOpenChange={(open) => {
                  if (!open) return;
                  roleNotifications.filter((notification) => !notification.read).forEach((notification) => {
                    markRead(notification.id);
                  });
                }}
              >
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="relative" aria-label={`Notifications, ${unreadCount} unread`}>
                    <Bell className="h-5 w-5" />
                    {unreadCount > 0 ? (
                      <span className="absolute top-1 right-1 grid h-4 min-w-4 place-items-center rounded-full bg-critical px-1 text-[10px] font-bold text-critical-foreground">
                        {unreadCount > 9 ? "9+" : unreadCount}
                      </span>
                    ) : null}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-[320px]">
                  <DropdownMenuLabel>Notifications</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {roleNotifications.length === 0 ? (
                    <p className="p-4 text-sm text-muted-foreground">You are all caught up.</p>
                  ) : (
                    roleNotifications.map((n) => (
                      <DropdownMenuItem
                        key={n.id}
                        className="flex-col items-start gap-0.5 py-2.5"
                        onClick={() => markRead(n.id)}
                      >
                        <span className="flex w-full items-center gap-2">
                          {!n.read ? (
                            <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-primary" aria-label="Unread" />
                          ) : null}
                          <span className="truncate text-sm font-medium">{n.title}</span>
                        </span>
                        <span className="line-clamp-2 text-xs text-muted-foreground">{n.body}</span>
                        <span className="text-[11px] text-muted-foreground">{timeAgo(n.at)}</span>
                      </DropdownMenuItem>
                    ))
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link to={`/${role}/notifications`}>View all notifications</Link>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    className="flex items-center gap-2 rounded-full border border-border bg-card py-1 pr-3 pl-1 transition-colors hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                    aria-label="Open user menu"
                  >
                    <Avatar className="h-7 w-7">
                      <AvatarFallback className="bg-primary text-xs text-primary-foreground">
                        {initials(displayName)}
                      </AvatarFallback>
                    </Avatar>
                    <span className="hidden text-left sm:block">
                      <span className="block max-w-[140px] truncate text-xs font-semibold text-foreground">
                        {displayName}
                      </span>
                      <span className="block text-[11px] text-muted-foreground">{roleLabels[role]}</span>
                    </span>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel className="font-normal">
                    <span className="block text-sm font-semibold">{displayName}</span>
                    <span className="block text-xs text-muted-foreground">{user?.email}</span>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link to={`/${role}/profile`}>
                      <UserIcon className="h-4 w-4" /> Profile
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to={`/${role}/settings`}>
                      <Settings className="h-4 w-4" /> Settings
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onSelect={() => void handleLogout()}>
                    <LogOut className="h-4 w-4" /> Log out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </header>

        <main className="min-w-0 flex-1 px-4 py-6 pb-24 sm:px-6 lg:pb-8">{children}</main>

        <nav
          aria-label="Quick navigation"
          className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-4 border-t border-border bg-card/95 backdrop-blur lg:hidden"
        >
          {mobileNav[role].map((item) => {
            const active = pathname === item.to;
            return (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  "flex min-h-[56px] flex-col items-center justify-center gap-1 text-[11px] font-medium",
                  active ? "text-primary" : "text-muted-foreground",
                )}
                aria-current={active ? "page" : undefined}
              >
                <item.icon className="h-5 w-5" aria-hidden="true" />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
