import { Link } from "@tanstack/react-router";
import { CheckCircle2 } from "lucide-react";
import type { ReactNode } from "react";

import { Logo } from "@/components/layout/logo";

const highlights = [
  "Report a stray in under a minute with photo and location",
  "Automatic alerts to the nearest verified rescuers",
  "Live status timeline from alert to recovery",
  "Analytics that help NGOs cut response times",
];

export function AuthShell({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <div className="grid min-h-dvh lg:grid-cols-2">
      <div className="flex flex-col justify-center px-4 py-10 sm:px-8 lg:px-16">
        <div className="mx-auto w-full max-w-md">
          <Logo />
          <h1 className="mt-10 font-display text-3xl font-bold tracking-tight text-foreground">
            {title}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">{subtitle}</p>
          <div className="mt-8">{children}</div>
          {footer ? <div className="mt-6 text-sm text-muted-foreground">{footer}</div> : null}
          <p className="mt-10 text-xs text-muted-foreground">
            <Link to="/" className="underline underline-offset-4 hover:text-foreground">
              Back to home
            </Link>
          </p>
        </div>
      </div>

      <aside className="relative hidden h-dvh flex-col justify-center self-start bg-primary px-16 lg:sticky lg:top-0 lg:flex">
        <blockquote className="max-w-md">
          <p className="font-display text-3xl leading-tight font-bold text-primary-foreground">
            “The difference between a rescue and a tragedy is usually twenty minutes.”
          </p>
          <footer className="mt-4 text-sm text-primary-foreground/70">
            — Partner NGO coordinator, Nagpur
          </footer>
        </blockquote>
        <ul className="mt-12 space-y-4">
          {highlights.map((h) => (
            <li key={h} className="flex items-start gap-3 text-sm text-primary-foreground/90">
              <CheckCircle2 className="mt-0.5 h-4.5 w-4.5 shrink-0" aria-hidden="true" />
              <span>{h}</span>
            </li>
          ))}
        </ul>
      </aside>
    </div>
  );
}