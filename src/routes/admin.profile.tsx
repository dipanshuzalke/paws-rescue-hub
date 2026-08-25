import { createFileRoute } from "@tanstack/react-router";
import { ShieldCheck, Users, FileText, Activity } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { PageHeader } from "@/components/shared/page-header";
import { StatCard } from "@/components/shared/stat-card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatDate, initials } from "@/lib/format";
import { useApp } from "@/store/app-store";

export const Route = createFileRoute("/admin/profile")({
  head: () => ({
    meta: [
      { title: "Admin Profile · ResQ Paws" },
      { name: "description", content: "Your administrator account details on the ResQ Paws rescue network." },
      { property: "og:title", content: "Admin Profile · ResQ Paws" },
      { property: "og:description", content: "Manage your ResQ Paws administrator account and review platform oversight stats." },
    ],
  }),
  component: AdminProfile,
});

function AdminProfile() {
  const { user, reports, notifications } = useApp();
  const [name, setName] = useState(user?.name ?? "");
  const [email, setEmail] = useState(user?.email ?? "");
  const [phone, setPhone] = useState(user?.phone ?? "");
  const [location, setLocation] = useState(user?.location ?? "");
  const [editing, setEditing] = useState(false);

  const activeCases = reports.filter((r) =>
    ["ASSIGNED", "ACCEPTED", "IN_PROGRESS"].includes(r.status),
  ).length;

  const handleSave = () => {
    setEditing(false);
    toast.success("Profile updated");
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <PageHeader
        title="Admin profile"
        description="Your administrator account and platform oversight summary."
      />

      <div className="card-surface p-6">
        <div className="flex flex-wrap items-center gap-4">
          <Avatar className="h-16 w-16 text-lg">
            <AvatarFallback>{initials(user?.name ?? "Admin")}</AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <p className="text-lg font-semibold text-foreground">{user?.name ?? "Administrator"}</p>
            <p className="text-sm text-muted-foreground">
              Administrator · since {user ? formatDate(user.joinedAt) : "—"}
            </p>
          </div>
          <span className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary-soft px-3 py-1.5 text-sm font-semibold text-primary">
            <ShieldCheck className="h-4 w-4" aria-hidden="true" />
            Full access
          </span>
          <Button
            variant="outline"
            className="ml-auto"
            onClick={() => (editing ? handleSave() : setEditing(true))}
          >
            {editing ? "Save changes" : "Edit profile"}
          </Button>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <div>
            <Label className="mb-2 block" htmlFor="admin-name">Full name</Label>
            <Input id="admin-name" value={name} disabled={!editing} onChange={(e) => setName(e.target.value)} />
          </div>
          <div>
            <Label className="mb-2 block" htmlFor="admin-email">Email</Label>
            <Input id="admin-email" value={email} disabled={!editing} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div>
            <Label className="mb-2 block" htmlFor="admin-phone">Phone</Label>
            <Input id="admin-phone" value={phone} disabled={!editing} onChange={(e) => setPhone(e.target.value)} />
          </div>
          <div>
            <Label className="mb-2 block" htmlFor="admin-location">Location</Label>
            <Input id="admin-location" value={location} disabled={!editing} onChange={(e) => setLocation(e.target.value)} />
          </div>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Reports overseen" value={reports.length} icon={FileText} />
        <StatCard label="Active rescues" value={activeCases} icon={Activity} />
        <StatCard label="Alerts received" value={notifications.length} icon={Users} />
      </div>
    </div>
  );
}
