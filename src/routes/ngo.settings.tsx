import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";

import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { PageHeader, SectionHeading } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";

export const Route = createFileRoute("/ngo/settings")({
  head: () => ({
    meta: [
      { title: "Settings · ResQ Paws NGO" },
      {
        name: "description",
        content: "Configure notification preferences and rescue assignment rules.",
      },
      { property: "og:title", content: "Settings · ResQ Paws NGO" },
      {
        property: "og:description",
        content: "Manage notification preferences, assignment rules and account settings.",
      },
    ],
  }),
  component: NgoSettings,
});

function NgoSettings() {
  const [notify, setNotify] = useState({
    critical: true,
    newRequests: true,
    assignmentUpdates: true,
    weeklyReports: false,
  });
  const [assignment, setAssignment] = useState({
    autoAssignNearest: true,
    requireAcceptance: true,
    allowSelfAssign: false,
  });
  const [maxRadius, setMaxRadius] = useState([10]);
  const [confirmDeactivate, setConfirmDeactivate] = useState(false);

  return (
    <div className="space-y-6">
      <PageHeader title="Settings" description="Notification preferences and assignment rules." />

      <section className="card-surface p-5">
        <SectionHeading title="Notifications" description="Choose what your organization gets alerted about." />
        <div className="space-y-3">
          {(
            [
              ["critical", "Critical emergency alerts"],
              ["newRequests", "New rescue requests"],
              ["assignmentUpdates", "Assignment status updates"],
              ["weeklyReports", "Weekly summary reports"],
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
        <SectionHeading title="Assignment preferences" description="How incoming requests get routed to rescuers." />
        <div className="space-y-3">
          {(
            [
              ["autoAssignNearest", "Auto-suggest the nearest available rescuer"],
              ["requireAcceptance", "Require rescuer acceptance before dispatch"],
              ["allowSelfAssign", "Allow rescuers to self-assign open requests"],
            ] as const
          ).map(([key, label]) => (
            <div key={key} className="flex items-center justify-between gap-3">
              <Label htmlFor={`assign-${key}`} className="font-normal text-foreground">
                {label}
              </Label>
              <Switch
                id={`assign-${key}`}
                checked={assignment[key]}
                onCheckedChange={(v) => setAssignment((s) => ({ ...s, [key]: v }))}
              />
            </div>
          ))}
        </div>
      </section>

      <section className="card-surface p-5">
        <SectionHeading
          title="Coverage radius"
          description={`Only surface requests within ${maxRadius[0]} km of your registered rescuers.`}
        />
        <Slider
          value={maxRadius}
          onValueChange={setMaxRadius}
          min={2}
          max={30}
          step={1}
          aria-label="Coverage radius"
        />
      </section>

      <div className="flex justify-end">
        <Button onClick={() => toast.success("Settings saved successfully.")}>Save settings</Button>
      </div>

      <section className="card-surface border-destructive/30 p-5">
        <SectionHeading title="Danger zone" description="Irreversible organization actions." />
        <Button variant="destructive" onClick={() => setConfirmDeactivate(true)}>
          Deactivate organization
        </Button>
      </section>

      <ConfirmDialog
        open={confirmDeactivate}
        onOpenChange={setConfirmDeactivate}
        title="Deactivate your organization?"
        description="Your NGO will stop receiving new rescue requests and your rescuer team will be hidden from citizens."
        confirmLabel="Deactivate"
        destructive
        onConfirm={() => {
          setConfirmDeactivate(false);
          toast("Organization deactivation is disabled in this demo.");
        }}
      />
    </div>
  );
}
