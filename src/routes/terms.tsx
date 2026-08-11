import { createFileRoute } from "@tanstack/react-router";

import { PublicShell } from "@/components/layout/public-shell";

export const Route = createFileRoute("/terms")({
  head: () => ({
    meta: [
      { title: "Terms of Service — ResQ Paws" },
      { name: "description", content: "The terms and conditions for using the ResQ Paws platform." },
      { property: "og:title", content: "Terms of Service — ResQ Paws" },
      { property: "og:description", content: "The ResQ Paws terms of service." },
    ],
  }),
  component: Terms,
});

const sections = [
  {
    id: "acceptance",
    title: "1. Acceptance of terms",
    body: "By creating an account or using ResQ Paws, you agree to these Terms of Service. If you do not agree, please do not use the platform.",
  },
  {
    id: "accounts",
    title: "2. Accounts & roles",
    body: "ResQ Paws supports four account types — Citizen, Rescuer, NGO and Administrator. NGO accounts are subject to a verification process before they are activated. You are responsible for the accuracy of the information you provide and for keeping your login credentials secure.",
  },
  {
    id: "reports",
    title: "3. Rescue reports",
    body: "Reports must be filed in good faith and describe real animals in genuine need of assistance. Submitting false, duplicate or malicious reports may result in account suspension.",
  },
  {
    id: "conduct",
    title: "4. Rescuer & NGO conduct",
    body: "Rescuers and NGOs agree to act with care towards animals and reporters, to keep case statuses updated in a timely manner, and to treat all users respectfully.",
  },
  {
    id: "liability",
    title: "5. Limitation of liability",
    body: "ResQ Paws is a coordination platform and does not itself perform rescues. We are not liable for the actions, delays or outcomes of individual rescuers, NGOs or third parties using the platform.",
  },
  {
    id: "content",
    title: "6. User content",
    body: "By uploading photos or descriptions, you grant ResQ Paws a licence to display that content within the platform for the purpose of coordinating and reporting on rescues.",
  },
  {
    id: "termination",
    title: "7. Termination",
    body: "We may suspend or terminate accounts that violate these terms, misuse the platform, or submit fraudulent information.",
  },
  {
    id: "changes",
    title: "8. Changes to these terms",
    body: "We may revise these terms periodically. Continued use of ResQ Paws after changes constitutes acceptance of the updated terms.",
  },
  {
    id: "contact",
    title: "9. Contact",
    body: "Questions about these terms can be sent to support@resqpaws.org.",
  },
];

function Terms() {
  return (
    <PublicShell>
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-14 sm:px-6 lg:grid-cols-[220px_1fr] lg:px-8">
        <aside className="hidden lg:block">
          <nav aria-label="Terms of service sections" className="sticky top-24 space-y-1">
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
            Terms of Service
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
