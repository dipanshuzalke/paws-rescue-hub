import { createFileRoute } from "@tanstack/react-router";
import { CheckCircle2, Clock, Loader2, Mail, MapPin, Phone } from "lucide-react";
import { useState } from "react";
import type { LucideIcon } from "lucide-react";

import { PublicShell } from "@/components/layout/public-shell";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Contact Us — ResQ Paws" },
      {
        name: "description",
        content:
          "Get in touch with the ResQ Paws team for support, partnerships or press enquiries across Nagpur.",
      },
      { property: "og:title", content: "Contact Us — ResQ Paws" },
      {
        property: "og:description",
        content: "Reach the ResQ Paws team — support, partnerships and general enquiries.",
      },
    ],
  }),
  component: Contact,
});

const infoCards: { icon: LucideIcon; title: string; lines: string[] }[] = [
  { icon: Phone, title: "Call us", lines: ["+91 712 456 7890", "Mon–Sat, 9am–7pm"] },
  { icon: Mail, title: "Email us", lines: ["support@resqpaws.org", "We reply within 24 hours"] },
  { icon: MapPin, title: "Visit us", lines: ["Civil Lines, Nagpur", "Maharashtra 440001"] },
  { icon: Clock, title: "Emergency line", lines: ["24x7 for critical rescues", "Use in-app report for fastest response"] },
];

const faqs = [
  {
    q: "How quickly will a rescuer respond?",
    a: "Median response time across our network is about 18 minutes for critical cases, depending on rescuer availability nearby.",
  },
  {
    q: "Is ResQ Paws free to use?",
    a: "Yes, reporting an animal and tracking a rescue is completely free for citizens. NGOs can join our partner network at no cost.",
  },
  {
    q: "How do I become a verified rescuer?",
    a: "Sign up via the registration page, select 'Rescuer', and your application will be reviewed by a partner NGO or our team.",
  },
  {
    q: "What happens after I submit a report?",
    a: "Nearby verified rescuers and NGOs are notified instantly. You'll be able to follow the status from Reported through to Recovered.",
  },
  {
    q: "Can NGOs outside Nagpur join?",
    a: "This phase focuses on Nagpur, but we're actively onboarding partner organisations in nearby cities — reach out via this form.",
  },
];

function Contact() {
  const [form, setForm] = useState({ name: "", email: "", subject: "", message: "" });
  const [errors, setErrors] = useState<Partial<typeof form>>({});
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const next: Partial<typeof form> = {};
    if (!form.name.trim()) next.name = "Name is required.";
    if (!/^\S+@\S+\.\S+$/.test(form.email)) next.email = "Enter a valid email address.";
    if (!form.subject.trim()) next.subject = "Subject is required.";
    if (!form.message.trim() || form.message.trim().length < 10)
      next.message = "Please share a few more details (min 10 characters).";
    setErrors(next);
    if (Object.keys(next).length) return;
    setLoading(true);
    window.setTimeout(() => {
      setLoading(false);
      setSent(true);
    }, 800);
  };

  return (
    <PublicShell>
      <section className="border-b border-border bg-primary-soft/40">
        <div className="mx-auto max-w-4xl px-4 py-16 text-center sm:px-6 lg:px-8 lg:py-20">
          <h1 className="font-display text-4xl font-extrabold tracking-tight text-foreground sm:text-5xl">
            Get in touch
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-base text-muted-foreground sm:text-lg">
            Questions, partnership ideas or feedback — we'd love to hear from you. For an animal in
            distress right now, please use the in-app report form instead.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {infoCards.map((c) => (
            <Card key={c.title}>
              <CardContent className="p-6">
                <span className="grid h-11 w-11 place-items-center rounded-2xl bg-success-soft text-success">
                  <c.icon className="h-5.5 w-5.5" aria-hidden="true" />
                </span>
                <h3 className="mt-4 text-sm font-semibold text-foreground">{c.title}</h3>
                {c.lines.map((line) => (
                  <p key={line} className="mt-0.5 text-xs text-muted-foreground">
                    {line}
                  </p>
                ))}
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="mt-14 grid gap-10 lg:grid-cols-[1.1fr_0.9fr]">
          <Card>
            <CardContent className="p-6 sm:p-8">
              <h2 className="font-display text-xl font-bold text-foreground">Send us a message</h2>
              {sent ? (
                <div className="mt-6 flex flex-col items-center gap-3 rounded-xl border border-success/25 bg-success-soft/50 px-6 py-10 text-center">
                  <span className="grid h-12 w-12 place-items-center rounded-full bg-success-soft text-success">
                    <CheckCircle2 className="h-6 w-6" aria-hidden="true" />
                  </span>
                  <p className="text-sm font-semibold text-foreground">Message sent!</p>
                  <p className="max-w-sm text-sm text-muted-foreground">
                    Thanks for reaching out — our team will get back to you within 24 hours.
                  </p>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setSent(false);
                      setForm({ name: "", email: "", subject: "", message: "" });
                    }}
                  >
                    Send another message
                  </Button>
                </div>
              ) : (
                <form onSubmit={onSubmit} noValidate className="mt-6 space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="name">Name</Label>
                      <Input
                        id="name"
                        value={form.name}
                        onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                      />
                      {errors.name ? <p className="text-xs text-destructive">{errors.name}</p> : null}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        value={form.email}
                        onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                      />
                      {errors.email ? <p className="text-xs text-destructive">{errors.email}</p> : null}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="subject">Subject</Label>
                    <Input
                      id="subject"
                      value={form.subject}
                      onChange={(e) => setForm((f) => ({ ...f, subject: e.target.value }))}
                    />
                    {errors.subject ? <p className="text-xs text-destructive">{errors.subject}</p> : null}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="message">Message</Label>
                    <Textarea
                      id="message"
                      rows={5}
                      value={form.message}
                      onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))}
                    />
                    {errors.message ? <p className="text-xs text-destructive">{errors.message}</p> : null}
                  </div>
                  <Button type="submit" className="w-full sm:w-auto" disabled={loading}>
                    {loading ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : null}
                    Send message
                  </Button>
                </form>
              )}
            </CardContent>
          </Card>

          <div>
            <h2 className="font-display text-xl font-bold text-foreground">Frequently asked questions</h2>
            <Accordion type="single" collapsible className="mt-4">
              {faqs.map((faq, i) => (
                <AccordionItem key={faq.q} value={`item-${i}`}>
                  <AccordionTrigger className="text-left text-sm font-semibold">
                    {faq.q}
                  </AccordionTrigger>
                  <AccordionContent className="text-sm text-muted-foreground">{faq.a}</AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </div>
      </section>
    </PublicShell>
  );
}
