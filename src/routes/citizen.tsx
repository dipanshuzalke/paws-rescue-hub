import { Outlet, createFileRoute } from "@tanstack/react-router";
import { DashboardLayout } from "@/components/layout/dashboard-layout";

export const Route = createFileRoute("/citizen")({
  component: CitizenLayout,
});

function CitizenLayout() {
  return (
    <DashboardLayout role="citizen">
      <Outlet />
    </DashboardLayout>
  );
}
