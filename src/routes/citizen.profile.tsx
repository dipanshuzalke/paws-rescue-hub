import { createFileRoute } from "@tanstack/react-router";
import { Award, PawPrint, ShieldCheck } from "lucide-react";
import { useEffect, useState } from "react";
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
      {
        name: "description",
        content: "View and update your ResQ Paws citizen profile.",
      },
      {
        property: "og:title",
        content: "My Profile · ResQ Paws",
      },
      {
        property: "og:description",
        content: "View and update your ResQ Paws citizen profile.",
      },
    ],
  }),
  component: CitizenProfile,
});

const badges = [
  { label: "First Responder", icon: PawPrint },
  { label: "Verified Citizen", icon: ShieldCheck },
  { label: "5+ Reports", icon: Award },
];

/**
 * Converts the user's location into the string
 * displayed inside the Location input.
 */
function getLocationAddress(
  location:
    | string
    | {
        address?: string;
        coordinates?: [number, number];
      }
    | null
    | undefined,
): string {
  if (typeof location === "string") {
    return location;
  }

  return location?.address ?? "";
}

function CitizenProfile() {
  const { user, reports, updateProfile } = useApp();

  const [name, setName] = useState(user?.name ?? "");
  const [email, setEmail] = useState(user?.email ?? "");
  const [phone, setPhone] = useState(user?.phone ?? "");

  // The input contains only the address string.
  const [location, setLocation] = useState(
    getLocationAddress(user?.location),
  );

  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  /**
   * Keep local form state synchronized with
   * the logged-in user.
   */
  useEffect(() => {
    setName(user?.name ?? "");
    setEmail(user?.email ?? "");
    setPhone(user?.phone ?? "");
    setLocation(getLocationAddress(user?.location));
  }, [
    user?.name,
    user?.email,
    user?.phone,
    user?.location,
  ]);

  /**
   * Reports submitted by this citizen.
   */
  const myReports = reports.filter(
    (report) => report.reporterId === user?.id,
  );

  /**
   * Restore original user information when
   * Cancel is clicked.
   */
  const resetForm = () => {
    setName(user?.name ?? "");
    setEmail(user?.email ?? "");
    setPhone(user?.phone ?? "");
    setLocation(getLocationAddress(user?.location));
  };

  /**
   * Save profile changes.
   */
  const handleSave = async () => {
    setSaving(true);

    try {
      /**
       * Try to get the user's current GPS position.
       *
       * If GPS is unavailable or permission is denied,
       * we send only the address. The backend should
       * preserve existing coordinates in that case.
       */
      const locationData = await new Promise<{
        address: string;
        coordinates?: [number, number];
      }>((resolve) => {
        if (!navigator.geolocation) {
          resolve({
            address: location.trim(),
          });
          return;
        }

        navigator.geolocation.getCurrentPosition(
          (position) => {
            resolve({
              address: location.trim(),
              coordinates: [
                position.coords.longitude,
                position.coords.latitude,
              ],
            });
          },
          () => {
            /**
             * Location permission denied or
             * GPS could not be obtained.
             */
            resolve({
              address: location.trim(),
            });
          },
          {
            enableHighAccuracy: true,
            timeout: 8000,
            maximumAge: 5000,
          },
        );
      });

      /**
       * Send updated information to backend.
       */
      const updated = await updateProfile({
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim(),
        location: locationData,
      });

      if (!updated) {
        throw new Error("Could not update profile.");
      }

      setEditing(false);

      toast.success("Profile updated successfully.");
    } catch (error) {
      console.error("Profile update error:", error);

      toast.error(
        error instanceof Error
          ? error.message
          : "Could not update your profile. Please try again.",
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {/* =====================================================
          PAGE HEADER
      ====================================================== */}
      <div>
        <h1 className="font-display text-2xl font-bold text-foreground">
          My profile
        </h1>

        <p className="mt-1 text-sm text-muted-foreground">
          Manage your personal information.
        </p>
      </div>

      {/* =====================================================
          PROFILE INFORMATION
      ====================================================== */}
      <div className="card-surface p-6">
        {/* Profile header */}
        <div className="flex flex-wrap items-center gap-4">
          <Avatar className="h-16 w-16 text-lg">
            <AvatarFallback>
              {initials(user?.name ?? "Citizen")}
            </AvatarFallback>
          </Avatar>

          <div className="min-w-0">
            <p className="text-lg font-semibold text-foreground">
              {user?.name ?? "Citizen"}
            </p>

            <p className="text-sm text-muted-foreground">
              Member since{" "}
              {user ? formatDate(user.joinedAt) : "—"}
            </p>
          </div>

          {/* Edit button */}
          {!editing && (
            <Button
              type="button"
              variant="outline"
              className="ml-auto"
              onClick={() => setEditing(true)}
            >
              Edit Profile
            </Button>
          )}
        </div>

        {/* =================================================
            PROFILE FIELDS
        ================================================== */}
        <div className="mt-6 grid gap-5 sm:grid-cols-2">
          {/* Full name */}
          <div className="space-y-1.5">
            <Label htmlFor="citizen-name">
              Full name
            </Label>

            <Input
              id="citizen-name"
              value={name}
              disabled={!editing}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter your full name"
            />
          </div>

          {/* Email */}
          <div className="space-y-1.5">
            <Label htmlFor="citizen-email">
              Email
            </Label>

            <Input
              id="citizen-email"
              type="email"
              value={email}
              disabled={!editing}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
            />
          </div>

          {/* Phone */}
          <div className="space-y-1.5">
            <Label htmlFor="citizen-phone">
              Phone
            </Label>

            <Input
              id="citizen-phone"
              value={phone}
              disabled={!editing}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="Enter your phone number"
            />
          </div>

          {/* Location */}
          <div className="space-y-1.5">
            <Label htmlFor="citizen-location">
              Location
            </Label>

            <Input
              id="citizen-location"
              value={location}
              disabled={!editing}
              onChange={(e) =>
                setLocation(e.target.value)
              }
              placeholder="Enter your location"
            />
          </div>
        </div>

        {/* =================================================
            EDIT ACTIONS
        ================================================== */}
        {editing && (
          <div className="mt-6 flex justify-end gap-3 border-t pt-5">
            {/* Cancel */}
            <Button
              type="button"
              variant="outline"
              disabled={saving}
              onClick={() => {
                resetForm();
                setEditing(false);
              }}
            >
              Cancel
            </Button>

            {/* Save */}
            <Button
              type="button"
              disabled={saving}
              onClick={handleSave}
            >
              {saving
                ? "Saving..."
                : "Save Changes"}
            </Button>
          </div>
        )}
      </div>

      {/* =====================================================
          YOUR IMPACT
      ====================================================== */}
      <div className="card-surface p-6">
        <h2 className="font-display text-lg font-bold text-foreground">
          Your impact
        </h2>

        <div className="mt-3 grid gap-4 sm:grid-cols-3">
          {/* Reports */}
          <div>
            <p className="text-2xl font-bold text-foreground">
              {myReports.length}
            </p>

            <p className="text-xs text-muted-foreground">
              Reports submitted
            </p>
          </div>

          {/* Animals helped */}
          <div>
            <p className="text-2xl font-bold text-foreground">
              {
                myReports.filter(
                  (report) =>
                    report.status === "RESCUED" ||
                    report.status === "CLOSED",
                ).length
              }
            </p>

            <p className="text-xs text-muted-foreground">
              Animals helped
            </p>
          </div>

          {/* Active cases */}
          <div>
            <p className="text-2xl font-bold text-foreground">
              {
                myReports.filter((report) =>
                  [
                    "ASSIGNED",
                    "ACCEPTED",
                    "IN_PROGRESS",
                  ].includes(report.status),
                ).length
              }
            </p>

            <p className="text-xs text-muted-foreground">
              Active cases
            </p>
          </div>
        </div>
      </div>

      {/* =====================================================
          BADGES
      ====================================================== */}
      <div className="card-surface p-6">
        <h2 className="font-display text-lg font-bold text-foreground">
          Badges
        </h2>

        <div className="mt-3 flex flex-wrap gap-3">
          {badges.map(({ label, icon: Icon }) => (
            <span
              key={label}
              className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary-soft px-3 py-1.5 text-sm font-semibold text-primary"
            >
              <Icon
                className="h-4 w-4"
                aria-hidden="true"
              />

              {label}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}