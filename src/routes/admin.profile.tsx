import { createFileRoute } from "@tanstack/react-router";

import { useApp } from "@/store/app-store";

export const Route = createFileRoute("/admin/profile")({
  head: () => ({
    meta: [
      { title: "Admin Profile · ResQ Paws" },
      { name: "description", content: "Your administrator account details on the ResQ Paws rescue network." },
      { property: "og:title", content: "Admin Profile · ResQ Paws" },
      { property: "og:description", content: "Your administrator account details on the ResQ Paws rescue network." },
    ],
  }),
  component: AdminProfile,
});

function AdminProfile() {
  const { user } = useApp();

  const rows: [string, string][] = [
    ["Name", user?.name ?? "—"],
    ["Email", user?.email ?? "—"],
    ["Phone", user?.phone ?? "—"],
    ["Role", "Administrator"],
    ["Location", user?.location ?? "—"],
    ["Joined", user?.joinedAt ?? "—"],
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-foreground">Admin profile</h1>
        <p className="mt-1 text-sm text-muted-foreground">Your administrator account details.</p>
      </div>
      <dl className="card-surface divide-y divide-border p-0">
        {rows.map(([label, value]) => (
          <div key={label} className="flex items-center justify-between gap-4 p-4">
            <dt className="text-sm text-muted-foreground">{label}</dt>
            <dd className="text-sm font-semibold text-foreground">{value}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
