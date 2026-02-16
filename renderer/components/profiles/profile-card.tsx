"use client";

import { useState } from "react";
import type { Profile } from "@shared/types/profile";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Pencil, Trash2, Clock, Coffee, Timer, Repeat } from "lucide-react";
import { useProfileStore } from "@/stores/profile.store";
import { ProfileForm } from "./profile-form";

interface ProfileCardProps {
  profile: Profile;
}

export function ProfileCard({ profile }: ProfileCardProps) {
  const [editOpen, setEditOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const deleteProfile = useProfileStore((s) => s.deleteProfile);

  const handleDelete = async () => {
    if (!confirmDelete) {
      setConfirmDelete(true);
      return;
    }
    await deleteProfile(profile.id);
  };

  return (
    <>
      <Card className="card-hover-lift group relative transition-shadow">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span
                className="inline-block h-4 w-4 rounded-full ring-2 ring-primary/20 ring-offset-2 ring-offset-background"
                style={{
                  backgroundColor: profile.color,
                  boxShadow: `0 0 0 2px ${profile.color}`,
                }}
              />
              <CardTitle className="text-base">{profile.name}</CardTitle>
            </div>
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => setEditOpen(true)}
              >
                <Pencil className="h-3.5 w-3.5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className={`h-8 w-8 transition-colors duration-200 ${
                  confirmDelete
                    ? "text-destructive hover:text-destructive hover:bg-destructive/10"
                    : ""
                }`}
                onClick={handleDelete}
                onBlur={() => setConfirmDelete(false)}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-x-4 gap-y-2.5">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="h-3.5 w-3.5 text-primary/70" />
              <span>{profile.focusDuration}m focus</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Coffee className="h-3.5 w-3.5 text-primary/70" />
              <span>{profile.breakDuration}m break</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Timer className="h-3.5 w-3.5 text-primary/70" />
              <span>{profile.longBreakDuration}m long</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Repeat className="h-3.5 w-3.5 text-primary/70" />
              <span>{profile.sessionsBeforeLongBreak} rounds</span>
            </div>
          </div>

          {(profile.blockedDomains.length > 0 ||
            profile.blockedApps.length > 0) && (
            <div className="flex flex-wrap gap-1.5 pt-1">
              {profile.blockedDomains.slice(0, 3).map((domain) => (
                <Badge
                  key={domain}
                  variant="secondary"
                  className="text-[10px] font-normal"
                >
                  {domain}
                </Badge>
              ))}
              {profile.blockedApps.slice(0, 2).map((app) => (
                <Badge
                  key={app}
                  variant="outline"
                  className="text-[10px] font-normal"
                >
                  {app}
                </Badge>
              ))}
              {profile.blockedDomains.length +
                profile.blockedApps.length >
                5 && (
                <Badge
                  variant="secondary"
                  className="text-[10px] font-normal"
                >
                  +
                  {profile.blockedDomains.length +
                    profile.blockedApps.length -
                    5}{" "}
                  more
                </Badge>
              )}
            </div>
          )}

          {confirmDelete && (
            <p className="text-xs text-destructive animate-fade-in transition-all duration-200">
              Click delete again to confirm
            </p>
          )}
        </CardContent>
      </Card>

      <ProfileForm
        profile={profile}
        open={editOpen}
        onOpenChange={setEditOpen}
      />
    </>
  );
}
