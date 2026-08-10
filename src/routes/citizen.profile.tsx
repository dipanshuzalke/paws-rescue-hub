import { createFileRoute } from "@tanstack/react-router";
import { Award, PawPrint, ShieldCheck } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatDate, initials } from "@/lib/format";
import { useApp } from "@/store/app-store";

export const Route = createFileRoute("/citizen/profile")({
  head: () => ({
    meta: [
      { title: "My Profile · ResQ Paws" },
      { name: "description", content: "View and update your ResQ Paws citizen profile." },
      { property: "og:title", content: "My Profile · ResQ Paws" },
      { property: "og:description", content: "View and update your ResQ Paws citizen profile." },
    ],
  }),
  component: CitizenProfile,
});

const badges = [
  { label: "First Responder", icon: PawPrint },
  { label: "Verified Citizen", icon: ShieldCheck },
  { label: "5+ Reports", icon: Award },
];

function CitizenProfile() {
  const { user, reports } = useApp();
  const [name, setName] = useState(user?.name ?? "");
  const [email, setEmail] = useState(user?.email ?? "");
  const [phone, setPhone] = useState(user?.phone ?? "");
  const [location, setLocation] = useState(user?.location ?? "");
  const [editing, setEditing] = useState(false);

  const myReports = reports.filter((r) => r.reporterId === user?.id);

  const handleSave = () => {
    setEditing(false);
    toast.success("Profile updated");
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-foreground">My profile</h1>
        <p className="mt-1 text-sm text-muted-foreground">Manage your personal information.</p>
      </div>

      <div className="card-surface p-6">
        <div className="flex flex-wrap items-center gap-4">
          <Avatar className="h-16 w-16 text-lg">
            <AvatarFallback>{initials(user?.name ?? "Citizen")}</AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <p className="text-lg font-semibold text-foreground">{user?.name}</p>
            <p className="text-sm text-muted-foreground">
              Member since {user ? formatDate(user.joinedAt) : "—"}
            </p>
          </div>
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
            <Label className="mb-2 block" htmlFor="name">Full name</Label>
            <Input id="name" value={name} disabled={!editing} onChange={(e) => setName(e.target.value)} />
          </div>
          <div>
            <Label className="mb-2 block" htmlFor="email">Email</Label>
            <Input id="email" value={email} disabled={!editing} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div>
            <Label className="mb-2 block" htmlFor="phone">Phone</Label>
            <Input id="phone" value={phone} disabled={!editing} onChange={(e) => setPhone(e.target.value)} />
          </div>
          <div>
            <Label className="mb-2 block" htmlFor="location">Location</Label>
            <Input id="location" value={location} disabled={!editing} onChange={(e) => setLocation(e.target.value)} />
          </div>
        </div>
      </div>

      <div className="card-surface p-6">
        <h2 className="font-display text-lg font-bold text-foreground">Your impact</h2>
        <div className="mt-3 grid gap-4 sm:grid-cols-3">
          <div>
            <p className="text-2xl font-bold text-foreground">{myReports.length}</p>
            <p className="text-xs text-muted-foreground">Reports submitted</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-foreground">
              {myReports.filter((r) => r.status === "RESCUED" || r.status === "CLOSED").length}
            </p>
            <p className="text-xs text-muted-foreground">Animals helped</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-foreground">
              {myReports.filter((r) => ["ASSIGNED", "ACCEPTED", "IN_PROGRESS"].includes(r.status)).length}
            </p>
            <p className="text-xs text-muted-foreground">Active cases</p>
          </div>
        </div>
      </div>

      <div className="card-surface p-6">
        <h2 className="font-display text-lg font-bold text-foreground">Badges</h2>
        <div className="mt-3 flex flex-wrap gap-3">
          {badges.map(({ label, icon: Icon }) => (
            <span
              key={label}
              className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary-soft px-3 py-1.5 text-sm font-semibold text-primary"
            >
              <Icon className="h-4 w-4" aria-hidden="true" />
              {label}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
