import { Search, SlidersHorizontal } from "lucide-react";
import type { ReactNode } from "react";

import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function SearchBar({
  value,
  onChange,
  placeholder = "Search…",
  label = "Search",
  className,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  label?: string;
  className?: string;
}) {
  return (
    <div className={className}>
      <label className="relative block">
        <span className="sr-only">{label}</span>
        <Search
          className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground"
          aria-hidden="true"
        />
        <Input
          type="search"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="bg-card pl-9"
        />
      </label>
    </div>
  );
}

export interface FilterOption {
  value: string;
  label: string;
}

export function FilterSelect({
  value,
  onChange,
  options,
  label,
  allLabel = "All",
  className = "w-full sm:w-[170px]",
}: {
  value: string;
  onChange: (v: string) => void;
  options: FilterOption[];
  label: string;
  allLabel?: string;
  className?: string;
}) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className={`bg-card ${className}`} aria-label={label}>
        <SelectValue placeholder={label} />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">{allLabel}</SelectItem>
        {options.map((o) => (
          <SelectItem key={o.value} value={o.value}>
            {o.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

export function FilterBar({ children }: { children: ReactNode }) {
  return (
    <div className="card-surface flex flex-col gap-3 p-3 sm:flex-row sm:flex-wrap sm:items-center">
      <span className="hidden items-center gap-2 text-sm font-medium text-muted-foreground sm:inline-flex">
        <SlidersHorizontal className="h-4 w-4" aria-hidden="true" />
        Filters
      </span>
      {children}
    </div>
  );
}