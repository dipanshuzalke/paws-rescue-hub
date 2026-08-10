import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";

import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { PageHeader, SectionHeading } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";

export const Route = createFileRoute("/rescuer/settings")({
  head: () => ({
    meta: [
      { title: "Settings · ResQ Paws" },
      { name: "description", content: "Manage your availability schedule and notification preferences." },
      { property: "og:title", content: "Settings · ResQ Paws" },
      {
        property: "og:description",
        content: "Manage your availability schedule and notification preferences.",
      },
    ],
  }),
  component: RescuerSettings,
});

function RescuerSettings() {
  const [schedule, setSchedule] = useState({
    weekdays: true,
    weekends: false,
    nightShift: false,
  });
  const [notify, setNotify] = useState({
    critical: true,
    assignments: true,
    system: false,
  });
  const [maxDistance, setMaxDistance] = useState([8]);
  const [confirmDeactivate, setConfirmDeactivate] = useState(false);

  return (
    <div className="space-y-6">
      <PageHeader title="Settings" description="Availability schedule and notification preferences." />

      <section className="card-surface p-5">
        <SectionHeading title="Availability schedule" description="When you're generally on duty." />
        <div className="space-y-3">
          {(
            [
              ["weekdays", "Weekdays (Mon–Fri)"],
              ["weekends", "Weekends (Sat–Sun)"],
              ["nightShift", "Night shift (10 PM – 6 AM)"],
            ] as const
          ).map(([key, label]) => (
            <div key={key} className="flex items-center justify-between gap-3">
              <Label htmlFor={`sched-${key}`} className="font-normal text-foreground">
                {label}
              </Label>
              <Switch
                id={`sched-${key}`}
                checked={schedule[key]}
                onCheckedChange={(v) => setSchedule((s) => ({ ...s, [key]: v }))}
              />
            </div>
          ))}
        </div>
      </section>

      <section className="card-surface p-5">
        <SectionHeading title="Notifications" description="Choose what you get notified about." />
        <div className="space-y-3">
          {(
            [
              ["critical", "Critical emergency alerts"],
              ["assignments", "New assignments"],
              ["system", "System announcements"],
            ] as const
          ).map(([key, label]) => (
            <div key={key} className="flex items-center justify-between gap-3">
              <Label htmlFor={`notif-${key}`} className="font-normal text-foreground">
                {label}
              </Label>
              <Switch
                id={`notif-${key}`}
                checked={notify[key]}
                onCheckedChange={(v) => setNotify((s) => ({ ...s, [key]: v }))}
              />
            </div>
          ))}
        </div>
      </section>

      <section className="card-surface p-5">
        <SectionHeading
          title="Maximum request distance"
          description={`Only show requests within ${maxDistance[0]} km.`}
        />
        <Slider
          value={maxDistance}
          onValueChange={setMaxDistance}
          min={1}
          max={20}
          step={1}
          aria-label="Maximum request distance"
        />
      </section>

      <div className="flex justify-end">
        <Button
          onClick={() => toast.success("Settings saved successfully.")}
        >
          Save settings
        </Button>
      </div>

      <section className="card-surface border-destructive/30 p-5">
        <SectionHeading title="Danger zone" description="Irreversible account actions." />
        <Button variant="destructive" onClick={() => setConfirmDeactivate(true)}>
          Deactivate my account
        </Button>
      </section>

      <ConfirmDialog
        open={confirmDeactivate}
        onOpenChange={setConfirmDeactivate}
        title="Deactivate your rescuer account?"
        description="You will stop receiving new assignments and your profile will be hidden from citizens and NGOs."
        confirmLabel="Deactivate"
        destructive
        onConfirm={() => {
          setConfirmDeactivate(false);
          toast("Account deactivation is disabled in this demo.");
        }}
      />
    </div>
  );
}
