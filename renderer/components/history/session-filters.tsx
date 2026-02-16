"use client";

import { Search, Filter } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

export interface SessionFilters {
  search: string;
  status: "all" | "completed" | "cancelled";
  profileId: string;
  dateRange: "week" | "month" | "all";
}

interface Profile {
  id: string;
  name: string;
  color: string;
}

interface SessionFiltersProps {
  filters: SessionFilters;
  onChange: (filters: SessionFilters) => void;
  profiles: Profile[];
}

export function SessionFiltersBar({
  filters,
  onChange,
  profiles,
}: SessionFiltersProps) {
  const update = (patch: Partial<SessionFilters>) =>
    onChange({ ...filters, ...patch });

  return (
    <div className="rounded-xl border bg-card/50 p-4 space-y-4">
      {/* Search and selects row */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Search input */}
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by task name..."
            value={filters.search}
            onChange={(e) => update({ search: e.target.value })}
            className="pl-9 h-10"
          />
        </div>

        {/* Status filter */}
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground shrink-0" />
          <Select
            value={filters.status}
            onValueChange={(val) =>
              update({ status: val as SessionFilters["status"] })
            }
          >
            <SelectTrigger className="w-[140px] h-10">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Profile filter */}
        {profiles.length > 0 && (
          <Select
            value={filters.profileId}
            onValueChange={(val) => update({ profileId: val })}
          >
            <SelectTrigger className="w-[160px] h-10">
              <SelectValue placeholder="All profiles" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All profiles</SelectItem>
              {profiles.map((profile) => (
                <SelectItem key={profile.id} value={profile.id}>
                  <span className="flex items-center gap-2">
                    <span
                      className="inline-block h-2.5 w-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: profile.color }}
                    />
                    {profile.name}
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      {/* Divider */}
      <Separator className="opacity-50" />

      {/* Date range buttons */}
      <div className="flex items-center gap-2">
        <span className="text-xs text-muted-foreground mr-1">Period:</span>
        {(
          [
            { value: "week", label: "This week" },
            { value: "month", label: "This month" },
            { value: "all", label: "All time" },
          ] as const
        ).map((option) => (
          <Button
            key={option.value}
            variant={filters.dateRange === option.value ? "default" : "outline"}
            size="sm"
            onClick={() => update({ dateRange: option.value })}
            className={cn(
              "text-xs h-7 px-3 rounded-full",
              filters.dateRange === option.value &&
                "bg-primary text-primary-foreground"
            )}
          >
            {option.label}
          </Button>
        ))}
      </div>
    </div>
  );
}
