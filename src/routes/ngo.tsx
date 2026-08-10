import { Outlet, createFileRoute } from "@tanstack/react-router";
import { DashboardLayout } from "@/components/layout/dashboard-layout";

export const Route = createFileRoute("/ngo")({
  component: NgoLayout,
});

function NgoLayout() {
  return (
    <DashboardLayout role="ngo">
      <Outlet />
    </DashboardLayout>
  );
}
