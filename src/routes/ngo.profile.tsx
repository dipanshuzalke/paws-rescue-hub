import { createFileRoute } from "@tanstack/react-router";
import { Building2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { PageHeader, SectionHeading } from "@/components/shared/page-header";
import { UserStatusBadge } from "@/components/shared/status-badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ngoById } from "@/data/mockNGOs";
import { initials } from "@/lib/format";
import { useApp } from "@/store/app-store";

export const Route = createFileRoute("/ngo/profile")({
  head: () => ({
    meta: [
      { title: "Organization Profile · ResQ Paws" },
      { name: "description", content: "View and update your NGO's public profile details." },
      { property: "og:title", content: "Organization Profile · ResQ Paws" },
      {
        property: "og:description",
        content: "Manage your organization's contact details, areas served and description.",
      },
    ],
  }),
  component: NgoProfile,
});

function NgoProfile() {
  const { user } = useApp();
  const ngo = ngoById(user?.organization ? undefined : undefined) ?? ngoById("NGO-01");

  const [form, setForm] = useState({
    name: user?.organization ?? ngo?.name ?? "",
    regNumber: "REG-2023-00114",
    contactPerson: user?.name ?? ngo?.contactPerson ?? "",
    email: user?.email ?? ngo?.email ?? "",
    phone: user?.phone ?? ngo?.phone ?? "",
    areasServed: "Dharampeth, Sadar, Sitabuldi, Manish Nagar",
    description:
      ngo?.about ??
      "Nagpur-based animal welfare organisation coordinating field rescues and post-rescue care.",
  });

  const update = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success("Organization profile updated successfully.");
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Organization profile" description="Manage your NGO's public profile details." />

      <section className="card-surface flex flex-wrap items-center gap-4 p-5">
        <Avatar className="h-16 w-16">
          <AvatarFallback className="text-lg">
            <Building2 className="h-6 w-6" aria-hidden="true" />
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <p className="truncate text-lg font-semibold text-foreground">{form.name}</p>
          <p className="truncate text-sm text-muted-foreground">{form.contactPerson}</p>
        </div>
        {ngo ? <UserStatusBadge status={ngo.status} /> : null}
      </section>

      <form className="space-y-6" onSubmit={handleSave}>
        <section className="card-surface space-y-4 p-5">
          <SectionHeading title="Organization details" description="Public information shown to citizens." />
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="org-name">Organization name</Label>
              <Input id="org-name" value={form.name} onChange={update("name")} required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="org-reg">Registration number</Label>
              <Input id="org-reg" value={form.regNumber} onChange={update("regNumber")} required />
            </div>
          </div>
        </section>

        <section className="card-surface space-y-4 p-5">
          <SectionHeading title="Contact information" description="How rescuers and admins can reach you." />
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="org-contact">Contact person</Label>
              <Input id="org-contact" value={form.contactPerson} onChange={update("contactPerson")} required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="org-email">Email</Label>
              <Input id="org-email" type="email" value={form.email} onChange={update("email")} required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="org-phone">Phone</Label>
              <Input id="org-phone" value={form.phone} onChange={update("phone")} required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="org-areas">Areas served</Label>
              <Input id="org-areas" value={form.areasServed} onChange={update("areasServed")} required />
            </div>
          </div>
        </section>

        <section className="card-surface space-y-4 p-5">
          <SectionHeading title="About" description="Describe your organization's mission and capabilities." />
          <Textarea
            value={form.description}
            onChange={update("description")}
            rows={5}
            aria-label="Organization description"
          />
        </section>

        <div className="flex justify-end">
          <Button type="submit">Save changes</Button>
        </div>
      </form>
    </div>
  );
}
