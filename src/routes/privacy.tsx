import { createFileRoute } from "@tanstack/react-router";

import { PublicShell } from "@/components/layout/public-shell";

export const Route = createFileRoute("/privacy")({
  head: () => ({
    meta: [
      { title: "Privacy Policy — ResQ Paws" },
      { name: "description", content: "How ResQ Paws collects, uses and protects your information." },
      { property: "og:title", content: "Privacy Policy — ResQ Paws" },
      { property: "og:description", content: "The ResQ Paws privacy policy." },
    ],
  }),
  component: Privacy,
});

const sections = [
  {
    id: "collection",
    title: "1. Information we collect",
    body: "We collect information you provide when creating an account or filing a rescue report, including your name, phone number, email address, location and any photos you upload of an animal in distress. Rescuers and NGOs additionally provide organisation details for verification.",
  },
  {
    id: "use",
    title: "2. How we use your information",
    body: "Your information is used to route rescue reports to nearby verified rescuers and NGOs, to keep you updated on the status of a case, and to improve response times across the network. We do not sell your personal data to third parties.",
  },
  {
    id: "sharing",
    title: "3. Sharing with rescuers & NGOs",
    body: "When you submit a rescue report, your name, phone number and the report location are shared with the rescuer or NGO assigned to the case so they can coordinate the rescue and, if needed, contact you for more details.",
  },
  {
    id: "location",
    title: "4. Location data",
    body: "Location data is used solely to match reports with the nearest available rescuers and to display case locations on maps within the platform. We do not track your location outside of an active report.",
  },
  {
    id: "retention",
    title: "5. Data retention",
    body: "Rescue case records, including photos and status history, are retained to maintain an accurate outcome record for reporters, NGOs and administrators, and may be anonymised for aggregate analytics.",
  },
  {
    id: "security",
    title: "6. Security",
    body: "We apply reasonable technical and organisational measures to protect your data. As this is a Phase 1 demonstration build, no real personal data is collected or stored on external servers.",
  },
  {
    id: "rights",
    title: "7. Your rights",
    body: "You may request access to, correction of, or deletion of your personal information by contacting us at support@resqpaws.org.",
  },
  {
    id: "changes",
    title: "8. Changes to this policy",
    body: "We may update this policy from time to time. Material changes will be communicated via the platform or by email.",
  },
];

function Privacy() {
  return (
    <PublicShell>
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-14 sm:px-6 lg:grid-cols-[220px_1fr] lg:px-8">
        <aside className="hidden lg:block">
          <nav aria-label="Privacy policy sections" className="sticky top-24 space-y-1">
            <p className="mb-3 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
              On this page
            </p>
            {sections.map((s) => (
              <a
                key={s.id}
                href={`#${s.id}`}
                className="block rounded-lg px-3 py-1.5 text-sm text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                {s.title}
              </a>
            ))}
          </nav>
        </aside>
        <div>
          <h1 className="font-display text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Privacy Policy
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">Last updated: 1 January 2026</p>
          <div className="mt-8 space-y-8">
            {sections.map((s) => (
              <section key={s.id} id={s.id} className="scroll-mt-24">
                <h2 className="font-display text-lg font-bold text-foreground">{s.title}</h2>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{s.body}</p>
              </section>
            ))}
          </div>
        </div>
      </div>
    </PublicShell>
  );
}
