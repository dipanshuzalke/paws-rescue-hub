import { createFileRoute } from "@tanstack/react-router";
import { AlertTriangle, Ban, RefreshCw, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { PageHeader, SectionHeading } from "@/components/shared/page-header";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { apiErrorMessage } from "@/lib/api-client";
import { useApp } from "@/store/app-store";

export const Route = createFileRoute("/admin/settings")({
  head: () => ({
    meta: [
      { title: "Platform Settings · ResQ Paws Admin" },
      {
        name: "description",
        content: "Configure platform toggles, role permissions and danger zone actions.",
      },
      { property: "og:title", content: "Platform Settings · ResQ Paws Admin" },
      {
        property: "og:description",
        content: "Manage ResQ Paws platform-wide settings and access controls.",
      },
    ],
  }),
  component: AdminSettings,
});

const toggleDefaults = [
  {
    key: "autoAssign",
    label: "Auto-assign nearby rescuers",
    description: "Automatically notify the closest available rescuer when a new report is filed.",
    checked: true,
  },
  {
    key: "citizenReports",
    label: "Allow citizen self-reporting",
    description: "Let citizens submit rescue reports directly without NGO mediation.",
    checked: true,
  },
  {
    key: "ngoSignup",
    label: "Open NGO self-registration",
    description: "Allow new NGOs to sign up and request verification without an invite.",
    checked: false,
  },
  {
    key: "smsAlerts",
    label: "SMS emergency alerts",
    description: "Send SMS notifications for CRITICAL priority reports in addition to push alerts.",
    checked: true,
  },
  {
    key: "maintenance",
    label: "Maintenance mode",
    description: "Temporarily disable new report submissions platform-wide.",
    checked: false,
  },
];

const rolePermissions = [
  {
    role: "Citizen",
    permissions: ["Submit rescue reports", "Track own reports", "Rate rescuers"],
  },
  {
    role: "Rescuer",
    permissions: ["Accept/decline assignments", "Update case status", "Add case notes"],
  },
  {
    role: "NGO",
    permissions: ["Manage rescuer team", "Assign cases", "View NGO analytics"],
  },
  {
    role: "Admin",
    permissions: ["Manage all accounts", "Verify NGOs & rescuers", "Full platform analytics", "System configuration"],
  },
];

function AdminSettings() {
  const [toggles, setToggles] = useState(toggleDefaults);
  const [dangerAction, setDangerAction] = useState<"reset" | "purge" | "delete-account" | null>(null);
  const { deleteAccount } = useApp();

  const onToggle = (key: string, value: boolean) => {
    setToggles((prev) => prev.map((t) => (t.key === key ? { ...t, checked: value } : t)));
    toast.success(`Setting updated.`);
  };

  const confirmDanger = () => {
    if (dangerAction === "delete-account") {
      void deleteAccount()
        .then(() => toast.success("Account permanently deleted"))
        .catch((error) => toast.error(apiErrorMessage(error)));
    } else if (dangerAction === "reset") {
      toast.success("Demo data has been reset.");
    } else if (dangerAction === "purge") {
      toast.success("Closed cases older than 90 days have been purged.");
    }
    setDangerAction(null);
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Platform Settings" description="Configure platform behavior, roles and safety controls." />

      <div className="card-surface p-5">
        <SectionHeading title="Platform toggles" description="Feature switches that apply to all users." />
        <ul className="divide-y divide-border">
          {toggles.map((t) => (
            <li key={t.key} className="flex items-start justify-between gap-4 py-4 first:pt-0 last:pb-0">
              <div className="min-w-0">
                <Label htmlFor={t.key} className="text-sm font-semibold text-foreground">
                  {t.label}
                </Label>
                <p className="mt-1 text-sm text-muted-foreground">{t.description}</p>
              </div>
              <Switch
                id={t.key}
                checked={t.checked}
                onCheckedChange={(v) => onToggle(t.key, v)}
                aria-label={t.label}
              />
            </li>
          ))}
        </ul>
      </div>

      <div className="card-surface p-5">
        <SectionHeading title="Role permissions" description="Overview of what each role can do on ResQ Paws." />
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {rolePermissions.map((r) => (
            <div key={r.role} className="rounded-lg border border-border p-4">
              <p className="text-sm font-semibold text-foreground">{r.role}</p>
              <ul className="mt-2 space-y-1.5 text-xs text-muted-foreground">
                {r.permissions.map((p) => (
                  <li key={p} className="flex items-start gap-1.5">
                    <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-muted-foreground" aria-hidden="true" />
                    {p}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      <div className="card-surface border-critical/30 p-5">
        <SectionHeading
          title="Danger zone"
          description="Irreversible actions. Proceed with caution."
        />
        <ul className="space-y-3">
          <li className="flex flex-col gap-3 rounded-lg border border-destructive/25 bg-destructive/5 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-semibold text-foreground">Delete my account</p>
              <p className="text-sm text-muted-foreground">Permanently remove your admin account. You will not be able to log in again.</p>
            </div>
            <Button variant="destructive" onClick={() => setDangerAction("delete-account")}>
              <Trash2 className="h-4 w-4" aria-hidden="true" /> Delete account
            </Button>
          </li>
          <li className="flex flex-col gap-3 rounded-lg border border-critical/25 bg-critical-soft/40 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-semibold text-foreground">Purge closed cases</p>
              <p className="text-sm text-muted-foreground">Permanently delete closed/cancelled cases older than 90 days.</p>
            </div>
            <Button variant="destructive" onClick={() => setDangerAction("purge")}>
              <Trash2 className="h-4 w-4" aria-hidden="true" /> Purge cases
            </Button>
          </li>
        </ul>
      </div>

      <ConfirmDialog
        open={!!dangerAction}
        onOpenChange={(v) => !v && setDangerAction(null)}
        title={dangerAction === "delete-account" ? "Delete your admin account?" : dangerAction === "reset" ? "Reset all demo data?" : "Purge closed cases?"}
        description={
          dangerAction === "delete-account"
            ? "This permanently removes your account and ends your session. This cannot be undone."
            : dangerAction === "reset"
            ? "This will restore all mock data to its original state. Any changes made during this session will be lost."
            : "This will permanently delete all closed and cancelled cases older than 90 days. This cannot be undone."
        }
        confirmLabel={dangerAction === "delete-account" ? "Delete account" : dangerAction === "reset" ? "Reset" : "Purge"}
        destructive
        onConfirm={confirmDanger}
      >
        <div className="flex items-center gap-2 rounded-lg bg-critical-soft px-3 py-2 text-xs text-critical">
          <AlertTriangle className="h-4 w-4 shrink-0" aria-hidden="true" />
          This action affects live platform data and cannot be reversed.
        </div>
      </ConfirmDialog>
    </div>
  );
}
