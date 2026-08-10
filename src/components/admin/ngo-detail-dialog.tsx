import { Building2, Calendar, Mail, MapPin, Phone, User as UserIcon, Users } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { UserStatusBadge } from "@/components/shared/status-badge";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/format";
import type { NGO } from "@/types";

const verificationTone: Record<NGO["verification"], string> = {
  VERIFIED: "border-success/25 bg-success-soft text-success",
  PENDING: "border-caution/40 bg-caution-soft text-caution-foreground",
  REJECTED: "border-critical/30 bg-critical-soft text-critical",
};

export function NgoDetailDialog({
  ngo,
  open,
  onOpenChange,
}: {
  ngo: NGO | null;
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  if (!ngo) return null;
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{ngo.name}</DialogTitle>
        </DialogHeader>
        <div className="flex flex-wrap items-center gap-2">
          <UserStatusBadge status={ngo.status} />
          <Badge variant="outline" className={verificationTone[ngo.verification]}>
            {ngo.verification}
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground">{ngo.about}</p>
        <dl className="mt-1 space-y-3 text-sm">
          <div className="flex items-center gap-2">
            <UserIcon className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
            <dd className="text-foreground">{ngo.contactPerson} (contact person)</dd>
          </div>
          <div className="flex items-center gap-2">
            <Mail className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
            <dd className="min-w-0 truncate text-foreground">{ngo.email}</dd>
          </div>
          <div className="flex items-center gap-2">
            <Phone className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
            <dd className="text-foreground">{ngo.phone}</dd>
          </div>
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
            <dd className="min-w-0 truncate text-foreground">{ngo.location}</dd>
          </div>
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
            <dd className="text-foreground">Joined {formatDate(ngo.joinedAt)}</dd>
          </div>
        </dl>
        <div className="mt-2 grid grid-cols-2 gap-3">
          <div className="rounded-lg bg-muted p-3 text-center">
            <Users className="mx-auto h-4 w-4 text-muted-foreground" aria-hidden="true" />
            <p className="mt-1 text-xl font-bold text-foreground">{ngo.rescuers}</p>
            <p className="text-xs text-muted-foreground">Team size</p>
          </div>
          <div className="rounded-lg bg-muted p-3 text-center">
            <Building2 className="mx-auto h-4 w-4 text-muted-foreground" aria-hidden="true" />
            <p className="mt-1 text-xl font-bold text-foreground">{ngo.cases}</p>
            <p className="text-xs text-muted-foreground">Total cases</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
