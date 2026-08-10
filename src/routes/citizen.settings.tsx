import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";

import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useApp } from "@/store/app-store";

export const Route = createFileRoute("/citizen/settings")({
  head: () => ({
    meta: [
      { title: "Settings · ResQ Paws" },
      { name: "description", content: "Manage notification preferences and account settings." },
      { property: "og:title", content: "Settings · ResQ Paws" },
      { property: "og:description", content: "Manage notification preferences and account settings." },
    ],
  }),
  component: CitizenSettings,
});

function CitizenSettings() {
  const { logout } = useApp();
  const [prefs, setPrefs] = useState({
    push: true,
    email: true,
    sms: false,
    updates: true,
  });
  const [language, setLanguage] = useState("en");
  const [theme, setTheme] = useState("system");
  const [deleteOpen, setDeleteOpen] = useState(false);

  const toggle = (key: keyof typeof prefs) => {
    setPrefs((p) => ({ ...p, [key]: !p[key] }));
    toast.success("Preference updated");
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-foreground">Settings</h1>
        <p className="mt-1 text-sm text-muted-foreground">Control how ResQ Paws contacts you.</p>
      </div>

      <div className="card-surface p-6">
        <h2 className="font-display text-lg font-bold text-foreground">Notification preferences</h2>
        <div className="mt-4 space-y-4">
          {[
            { key: "push" as const, label: "Push notifications", desc: "Get alerts about your reports on this device." },
            { key: "email" as const, label: "Email notifications", desc: "Receive status updates via email." },
            { key: "sms" as const, label: "SMS alerts", desc: "Critical updates sent to your phone number." },
            { key: "updates" as const, label: "Product updates", desc: "News about new ResQ Paws features." },
          ].map((row) => (
            <div key={row.key} className="flex items-center justify-between gap-4">
              <div className="min-w-0">
                <p className="text-sm font-semibold text-foreground">{row.label}</p>
                <p className="text-xs text-muted-foreground">{row.desc}</p>
              </div>
              <Switch checked={prefs[row.key]} onCheckedChange={() => toggle(row.key)} aria-label={row.label} />
            </div>
          ))}
        </div>
      </div>

      <div className="card-surface p-6">
        <h2 className="font-display text-lg font-bold text-foreground">Preferences</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div>
            <Label className="mb-2 block">Language</Label>
            <Select value={language} onValueChange={setLanguage}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="en">English</SelectItem>
                <SelectItem value="hi">हिंदी</SelectItem>
                <SelectItem value="mr">मराठी</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="mb-2 block">Theme</Label>
            <Select value={theme} onValueChange={setTheme}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="system">System</SelectItem>
                <SelectItem value="light">Light</SelectItem>
                <SelectItem value="dark">Dark</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <div className="card-surface border-destructive/30 p-6">
        <h2 className="font-display text-lg font-bold text-destructive">Danger zone</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Deleting your account will remove your reports and profile data.
        </p>
        <Button variant="outline" className="mt-4 text-destructive" onClick={() => setDeleteOpen(true)}>
          Delete my account
        </Button>
      </div>

      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Delete account?"
        description="This will permanently remove your ResQ Paws account and log you out. This action cannot be undone."
        confirmLabel="Delete account"
        destructive
        onConfirm={() => {
          setDeleteOpen(false);
          toast.success("Account deleted");
          logout();
        }}
      />
    </div>
  );
}
