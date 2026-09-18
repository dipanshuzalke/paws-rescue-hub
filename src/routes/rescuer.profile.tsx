import { createFileRoute } from "@tanstack/react-router";
import { Star } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { useCurrentRescuer } from "@/components/rescuer/use-current-rescuer";
import { PageHeader, SectionHeading } from "@/components/shared/page-header";
import { StatCard } from "@/components/shared/stat-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { initials } from "@/lib/format";
import { authService } from "@/services/authService";
import { useApp } from "@/store/app-store";

export const Route = createFileRoute("/rescuer/profile")({
  head: () => ({
    meta: [
      { title: "My Profile · ResQ Paws" },
      { name: "description", content: "Manage your rescuer profile, skills and service area." },
      { property: "og:title", content: "My Profile · ResQ Paws" },
      {
        property: "og:description",
        content: "Manage your rescuer profile, skills and service area.",
      },
    ],
  }),
  component: RescuerProfile,
});

function RescuerProfile() {
  const rescuer = useCurrentRescuer();
  const { apiMode, updateProfile } = useApp();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: rescuer.name,
    phone: rescuer.phone,
    email: rescuer.email,
    location: rescuer.location,
    vehicle: rescuer.vehicle ?? "",
    bio: rescuer.bio ?? "",
  });

  useEffect(() => {
    setForm({
      name: rescuer.name ?? "",
      phone: rescuer.phone ?? "",
      email: rescuer.email ?? "",
      location: rescuer.location ?? "",
      vehicle: rescuer.vehicle ?? "",
      bio: rescuer.bio ?? "",
    });
  }, [rescuer.name, rescuer.phone, rescuer.email, rescuer.location, rescuer.vehicle, rescuer.bio]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const location = await new Promise<{
        address: string;
        coordinates?: [number, number];
      }>((resolve) => {
        if (!navigator.geolocation) {
          return resolve({
            address: form.location,
          });
        }

        navigator.geolocation.getCurrentPosition(
          (position) =>
            resolve({
              address: form.location,
              coordinates: [position.coords.longitude, position.coords.latitude],
            }),
          () =>
            resolve({
              address: form.location,
            }),
          {
            enableHighAccuracy: true,
            timeout: 8000,
          },
        );
      });

      const updated = await updateProfile({
        name: form.name.trim(),
        phone: form.phone.trim(),
        email: form.email.trim(),
        vehicle: form.vehicle.trim(),
        bio: form.bio.trim(),
        location
      });

      if (!updated) {
        throw new Error("Could not update profile.");
      }

      toast.success("Profile updated successfully.");
    } catch (error) {
      console.error("Profile update error:", error);

      toast.error(
        error instanceof Error ? error.message : "Could not update your profile. Please try again.",
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader title="My Profile" description="Your public rescuer profile and details." />

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard
          label="Rating"
          value={rescuer.rating > 0 ? rescuer.rating.toFixed(1) : "—"}
          icon={Star}
          tone="neutral"
          animate={false}
        />
        <StatCard label="Completed" value={rescuer.completedCases} tone="success" />
        <StatCard label="Active" value={rescuer.activeCases} tone="warning" />
        <StatCard
          label="Avg Response"
          value={`${rescuer.avgResponseMins}m`}
          tone="info"
          animate={false}
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <section className="card-surface p-5 lg:col-span-1">
          <div className="flex flex-col items-center text-center">
            <span className="grid h-20 w-20 place-items-center rounded-full bg-primary-soft text-2xl font-bold text-primary">
              {initials(rescuer.name)}
            </span>
            <p className="mt-3 font-semibold text-foreground">{rescuer.name}</p>
            <p className="text-sm text-muted-foreground">{rescuer.organization}</p>
            <p className="text-xs text-muted-foreground">NGO ID: {rescuer.ngoId}</p>
          </div>
          <div className="mt-5">
            <SectionHeading title="Skills" />
            <p className="text-sm text-muted-foreground">No skills added yet.</p>
          </div>
          <div className="mt-5">
            <SectionHeading title="Service area" />
            <p className="text-sm text-muted-foreground">{rescuer.location} · within 8 km radius</p>
          </div>
        </section>

        <form onSubmit={handleSave} className="card-surface space-y-4 p-5 lg:col-span-2">
          <SectionHeading title="Personal information" description="Editable profile details." />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="p-name">Full name</Label>
              <Input
                id="p-name"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="p-phone">Phone</Label>
              <Input
                id="p-phone"
                value={form.phone}
                onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="p-email">Email</Label>
              <Input
                id="p-email"
                type="email"
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="p-location">Location</Label>
              <Input
                id="p-location"
                value={form.location}
                onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="p-vehicle">Vehicle</Label>
              <Input
                id="p-vehicle"
                value={form.vehicle}
                onChange={(e) => setForm((f) => ({ ...f, vehicle: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="p-bio">Bio</Label>
              <Textarea
                id="p-bio"
                rows={3}
                value={form.bio}
                onChange={(e) => setForm((f) => ({ ...f, bio: e.target.value }))}
              />
            </div>
          </div>
          <div className="flex justify-end">
            <Button type="submit" disabled={saving}>
              {saving ? "Saving..." : "Save changes"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
