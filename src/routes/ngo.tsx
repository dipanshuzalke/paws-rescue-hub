import { Link, Outlet, createFileRoute, useLocation } from "@tanstack/react-router";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Button } from "@/components/ui/button";
import { useAsync } from "@/hooks/use-async";
import { ngoService } from "@/services/ngoService";
import { useApp } from "@/store/app-store";
import { useEffect } from "react";
import { Ban } from "lucide-react";

export const Route = createFileRoute("/ngo")({
  component: NgoLayout,
});

function NgoLayout() {
  const { apiMode } = useApp();
  const location = useLocation();
  const {
    data: profile,
    loading,
    error,
    retry,
  } = useAsync(() => (apiMode ? ngoService.getProfile() : Promise.resolve(null)), [apiMode]);
  const isProfileRoute = location.pathname === "/ngo/profile";
  const isPending = apiMode && profile?.verification === "PENDING";

  const isRejected = apiMode && profile?.verification === "REJECTED";

  useEffect(() => {
    if (!apiMode) return;

    const interval = window.setInterval(() => {
      retry();
    }, 10000);

    return () => window.clearInterval(interval);
  }, [apiMode, retry]);

  return (
    <DashboardLayout role="ngo">
      {loading && !isProfileRoute ? (
        <p className="text-sm text-muted-foreground">Checking organization verification…</p>
      ) : error && !isProfileRoute ? (
        <div className="space-y-3">
          <p className="text-sm text-critical">Could not verify your organization access.</p>

          <Button variant="outline" onClick={retry}>
            Try again
          </Button>
        </div>
      ) : isRejected && !isProfileRoute ? (
        <div className="mx-auto flex min-h-[60vh] max-w-lg items-center justify-center">
          <div className="w-full rounded-2xl border border-critical/20 bg-critical-soft/30 p-8 text-center">
            <div className="mx-auto mb-5 grid h-14 w-14 place-items-center rounded-full bg-critical/10 text-critical">
              <Ban className="h-7 w-7" />
            </div>

            <h1 className="font-display text-2xl font-bold text-foreground">
              Organization Profile Rejected
            </h1>

            <p className="mt-3 text-sm leading-6 text-muted-foreground">
              Your NGO profile has been rejected by the administrator. You can no longer access NGO
              operations using this profile.
            </p>

            <p className="mt-3 text-sm leading-6 text-muted-foreground">
              If you believe this was a mistake, please contact the administrator or create a new
              organization profile with the correct information.
            </p>
          </div>
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
