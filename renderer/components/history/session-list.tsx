"use client";

import { useState } from "react";
import {
  History,
  Star,
  Clock,
  Target,
  Trash2,
  ChevronDown,
  TreePine,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDuration, cn } from "@/lib/utils";

interface SessionTask {
  id: string;
  name: string;
}

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
  tasks?: SessionTask[];
}

interface Profile {
  id: string;
  name: string;
  color: string;
}

interface SessionListProps {
  sessions: Session[];
  profiles: Profile[];
  onDelete: (id: string) => void;
}

const statusConfig: Record<
  Session["status"],
  { label: string; variant: "default" | "secondary" | "destructive" | "outline" }
> = {
  completed: { label: "Completed", variant: "default" },
  cancelled: { label: "Cancelled", variant: "destructive" },
  active: { label: "Active", variant: "secondary" },
  paused: { label: "Paused", variant: "outline" },
};

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={cn(
            "h-3.5 w-3.5",
            star <= rating
              ? "fill-primary text-primary"
              : "text-muted-foreground/30"
          )}
        />
      ))}
    </div>
  );
}

function formatSessionDate(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    return `Today at ${date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;
  }
  if (diffDays === 1) {
    return `Yesterday at ${date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;
  }
  if (diffDays < 7) {
    return `${date.toLocaleDateString([], { weekday: "long" })} at ${date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;
  }
  return date.toLocaleDateString([], {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function SessionCard({
  session,
  profiles,
  onDelete,
}: {
  session: Session;
  profiles: Profile[];
  onDelete: (id: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const profile = profiles.find((p) => p.id === session.profileId);
  const status = statusConfig[session.status];
  const durationMinutes = Math.round(session.totalFocusTime / 60);

  return (
    <Card
      className={cn(
        "card-hover-lift transition-all duration-200 cursor-pointer",
        expanded && "ring-1 ring-primary/20"
      )}
      onClick={() => setExpanded(!expanded)}
    >
      <CardContent className="p-4">
        {/* Main row */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            {/* Task name and profile */}
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-medium text-sm truncate">
                {session.tasks && session.tasks.length > 0
                  ? session.tasks.map((t) => t.name).join(" · ")
                  : session.task}
              </h3>
              {profile && (
                <span
                  className="inline-block h-2 w-2 rounded-full shrink-0"
                  style={{ backgroundColor: profile.color }}
                  title={profile.name}
                />
              )}
            </div>

            {/* Date */}
            <p className="text-xs text-muted-foreground/80 font-medium tracking-wide mb-2">
              {formatSessionDate(session.startedAt)}
            </p>

            {/* Stats row */}
            <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" />
                {formatDuration(durationMinutes)}
              </span>
              <span className="flex items-center gap-1">
                <Target className="h-3.5 w-3.5" />
                {session.completedPomodoros} pomodoro{session.completedPomodoros !== 1 ? "s" : ""}
              </span>
              {session.focusRating != null && session.focusRating > 0 && (
                <StarRating rating={session.focusRating} />
              )}
            </div>
          </div>

          {/* Right side: status badge and expand indicator */}
          <div className="flex flex-col items-end gap-2 shrink-0">
            <Badge variant={status.variant} className="text-[10px] px-2 py-0.5">
              {status.label}
            </Badge>
            <ChevronDown
              className={cn(
                "h-4 w-4 text-muted-foreground transition-transform duration-200",
                expanded && "rotate-180"
              )}
            />
          </div>
        </div>

        {/* Expanded details */}
        {expanded && (
          <div
            className="animate-fade-in-up mt-4 pt-3 border-t border-border space-y-3"
            onClick={(e) => e.stopPropagation()}
          >
            {session.intention && (
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-0.5">
                  Intention
                </p>
                <p className="text-sm">{session.intention}</p>
              </div>
            )}

            {session.notes && (
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-0.5">
                  Notes
                </p>
                <p className="text-sm whitespace-pre-wrap">{session.notes}</p>
              </div>
            )}

            {!session.intention && !session.notes && (
              <p className="text-xs text-muted-foreground italic">
                No additional details recorded for this session.
              </p>
            )}

            <div className="flex justify-end pt-1">
              <Button
                variant="destructive"
                size="sm"
                className="h-7 text-xs gap-1.5"
                onClick={() => onDelete(session.id)}
              >
                <Trash2 className="h-3.5 w-3.5" />
                Delete
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function SessionList({ sessions, profiles, onDelete }: SessionListProps) {
  if (sessions.length === 0) {
    return (
      <div className="animate-fade-in-up flex flex-col items-center justify-center py-24 text-center">
        <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
          <TreePine className="h-8 w-8 text-primary/60" />
        </div>
        <h2 className="text-lg font-medium mb-1">No sessions found</h2>
        <p className="text-sm text-muted-foreground max-w-sm">
          Your completed focus sessions will appear here. Start a timer to begin
          tracking your deep work.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-3">
      {sessions.map((session) => (
        <SessionCard
          key={session.id}
          session={session}
          profiles={profiles}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
}
