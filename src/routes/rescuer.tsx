import { Outlet, createFileRoute } from "@tanstack/react-router";
import { DashboardLayout } from "@/components/layout/dashboard-layout";

export const Route = createFileRoute("/rescuer")({
  component: RescuerLayout,
});

function RescuerLayout() {
  return (
    <DashboardLayout role="rescuer">
      <Outlet />
    </DashboardLayout>
  );
}
