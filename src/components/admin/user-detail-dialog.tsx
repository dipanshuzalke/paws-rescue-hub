import { Briefcase, Calendar, Mail, MapPin, Phone } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { UserStatusBadge } from "@/components/shared/status-badge";
import { formatDate, initials } from "@/lib/format";
import type { User } from "@/types";

export function UserDetailDialog({
  user,
  open,
  onOpenChange,
}: {
  user: User | null;
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  if (!user) return null;
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>User details</DialogTitle>
        </DialogHeader>
        <div className="flex items-center gap-3">
          <span className="grid h-14 w-14 shrink-0 place-items-center rounded-full bg-primary-soft text-lg font-bold text-primary">
            {initials(user.name)}
          </span>
          <div className="min-w-0">
            <p className="truncate text-base font-semibold text-foreground">{user.name}</p>
            <p className="truncate text-sm text-muted-foreground capitalize">{user.role}</p>
          </div>
          <UserStatusBadge status={user.status} className="ml-auto" />
        </div>
        <dl className="mt-2 space-y-3 text-sm">
          <div className="flex items-center gap-2">
            <Mail className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
            <dt className="sr-only">Email</dt>
            <dd className="min-w-0 truncate text-foreground">{user.email}</dd>
          </div>
          <div className="flex items-center gap-2">
            <Phone className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
            <dt className="sr-only">Phone</dt>
            <dd className="text-foreground">{user.phone}</dd>
          </div>
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
            <dt className="sr-only">Location</dt>
            <dd className="min-w-0 truncate text-foreground">
              {user.location || "Location not set"}
            </dd>
          </div>
          {user.organization ? (
            <div className="flex items-center gap-2">
              <Briefcase className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
              <dt className="sr-only">Organization</dt>
              <dd className="min-w-0 truncate text-foreground">{user.organization}</dd>
            </div>
          ) : null}
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
            <dt className="sr-only">Joined</dt>
            <dd className="text-foreground">Joined {formatDate(user.joinedAt)}</dd>
          </div>
        </dl>
        <div className="mt-2 grid min-w-0 grid-cols-2 gap-3">
          <div className="min-w-0 rounded-lg bg-muted p-3 text-center">
            <p className="text-xs font-medium text-muted-foreground">Total cases</p>
            <p className="mt-1 text-xl font-bold text-foreground">{user.cases}</p>
          </div>
          <div className="min-w-0 rounded-lg bg-muted p-3 text-center">
            <p className="text-xs font-medium text-muted-foreground">User ID</p>
            <p className="mt-1 break-all text-sm font-bold text-foreground">{user.id}</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}