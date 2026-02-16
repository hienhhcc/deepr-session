"use client";

import { useEffect, useState, useCallback } from "react";
import { History, Loader2 } from "lucide-react";
import { getElectronAPI } from "@/lib/electron-api";
import { SessionList } from "@/components/history/session-list";
import {
  SessionFiltersBar,
  type SessionFilters,
} from "@/components/history/session-filters";
import { Badge } from "@/components/ui/badge";

interface Session {
  id: string;
  task: string;
  intention?: string;
  profileId?: string;
  focusDuration: number;
  breakDuration: number;
  longBreakDuration: number;
  sessionsBeforeLongBreak: number;
  completedPomodoros: number;
  totalFocusTime: number;
  focusRating?: number;
  notes?: string;
  status: "active" | "paused" | "completed" | "cancelled";
  startedAt: string;
  completedAt?: string;
}

interface Profile {
  id: string;
  name: string;
  color: string;
}

const defaultFilters: SessionFilters = {
  search: "",
  status: "all",
  profileId: "all",
  dateRange: "all",
};

function getDateRangeStart(range: SessionFilters["dateRange"]): Date | null {
  const now = new Date();
  if (range === "week") {
    const start = new Date(now);
    start.setDate(now.getDate() - now.getDay());
    start.setHours(0, 0, 0, 0);
    return start;
  }
  if (range === "month") {
    return new Date(now.getFullYear(), now.getMonth(), 1);
  }
  return null;
}

export default function HistoryPage() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [filters, setFilters] = useState<SessionFilters>(defaultFilters);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    const api = getElectronAPI();
    if (!api) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const [sessionData, profileData] = await Promise.all([
        api.session.list(
          filters.status !== "all" ? { status: filters.status } : undefined
        ),
        api.profile.list(),
      ]);
      setSessions(sessionData ?? []);
      setProfiles(profileData ?? []);
    } catch (err) {
      console.error("Failed to fetch session history:", err);
    } finally {
      setLoading(false);
    }
  }, [filters.status]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Client-side filtering for search, profile, and date range
  const filteredSessions = sessions.filter((session) => {
    // Search filter
    if (
      filters.search &&
      !session.task.toLowerCase().includes(filters.search.toLowerCase())
    ) {
      return false;
    }

    // Profile filter
    if (filters.profileId !== "all" && session.profileId !== filters.profileId) {
      return false;
    }

    // Date range filter
    const rangeStart = getDateRangeStart(filters.dateRange);
    if (rangeStart && new Date(session.startedAt) < rangeStart) {
      return false;
    }

    return true;
  });

  // Sort by most recent first
  const sortedSessions = [...filteredSessions].sort(
    (a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime()
  );

  const handleDelete = async (id: string) => {
    const api = getElectronAPI();
    if (!api) return;

    try {
      await api.session.delete(id);
      setSessions((prev) => prev.filter((s) => s.id !== id));
    } catch (err) {
      console.error("Failed to delete session:", err);
    }
  };

  return (
    <div className="animate-fade-in-up">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <History className="h-5 w-5 text-primary" />
          </div>
          <h1 className="text-2xl font-semibold">Session History</h1>
        </div>
        {!loading && (
          <Badge variant="secondary" className="text-xs font-medium px-3 py-1">
            {sortedSessions.length} session{sortedSessions.length !== 1 ? "s" : ""}
          </Badge>
        )}
      </div>

      {/* Filters */}
      <div className="mb-6">
        <SessionFiltersBar
          filters={filters}
          onChange={setFilters}
          profiles={profiles}
        />
      </div>

      {/* Loading state */}
      {loading && sessions.length === 0 && (
        <div className="flex flex-col items-center justify-center py-24 text-muted-foreground">
          <Loader2 className="h-8 w-8 animate-spin mb-4 text-primary/50" />
          <p className="text-sm">Loading sessions...</p>
        </div>
      )}

      {/* Session list */}
      {(!loading || sessions.length > 0) && (
        <SessionList
          sessions={sortedSessions}
          profiles={profiles}
          onDelete={handleDelete}
        />
      )}
    </div>
  );
}
