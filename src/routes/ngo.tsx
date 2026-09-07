import { Link, Outlet, createFileRoute, useLocation } from "@tanstack/react-router";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Button } from "@/components/ui/button";
import { useAsync } from "@/hooks/use-async";
import { ngoService } from "@/services/ngoService";
import { useApp } from "@/store/app-store";

export const Route = createFileRoute("/ngo")({
  component: NgoLayout,
});

function NgoLayout() {
  const { apiMode } = useApp();
  const location = useLocation();
  const { data: profile, loading, error, retry } = useAsync(
    () => (apiMode ? ngoService.getProfile() : Promise.resolve(null)),
    [apiMode],
  );
  const isProfileRoute = location.pathname === "/ngo/profile";
  const isPending = apiMode && profile && profile.verification !== "VERIFIED";

  return (
    <DashboardLayout role="ngo">
      {loading && !isProfileRoute ? (
        <p className="text-sm text-muted-foreground">Checking organization verification…</p>
      ) : error && !isProfileRoute ? (
        <div className="space-y-3">
          <p className="text-sm text-critical">Could not verify your organization access.</p>
          <Button variant="outline" onClick={retry}>Try again</Button>
        </div>
      ) : isPending && !isProfileRoute ? (
        <div className="mx-auto max-w-xl space-y-4 text-center">
          <h1 className="font-display text-2xl font-bold text-foreground">
            Organization verification pending
          </h1>
          <p className="text-sm text-muted-foreground">
            Admin approval is required before you can access NGO operations.
          </p>
          <Button asChild>
            <Link to="/ngo/profile">View organization profile</Link>
          </Button>
        </div>
      ) : (
        <Outlet />
      )}
    </DashboardLayout>
  );
}
