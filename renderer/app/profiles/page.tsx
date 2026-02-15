"use client";

import { useEffect, useState } from "react";
import { UserCircle, Plus, Leaf, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useProfileStore } from "@/stores/profile.store";
import { ProfileCard } from "@/components/profiles/profile-card";
import { ProfileForm } from "@/components/profiles/profile-form";

export default function ProfilesPage() {
  const { profiles, loading, fetchProfiles } = useProfileStore();
  const [createOpen, setCreateOpen] = useState(false);

  useEffect(() => {
    fetchProfiles();
  }, [fetchProfiles]);

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <UserCircle className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-semibold">Context Profiles</h1>
        </div>
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="h-4 w-4" />
          New Profile
        </Button>
      </div>

      {/* Loading state */}
      {loading && profiles.length === 0 && (
        <div className="flex flex-col items-center justify-center py-24 text-muted-foreground">
          <Loader2 className="h-8 w-8 animate-spin mb-4 text-primary/50" />
          <p className="text-sm">Loading profiles...</p>
        </div>
      )}

      {/* Empty state */}
      {!loading && profiles.length === 0 && (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
            <Leaf className="h-8 w-8 text-primary/60" />
          </div>
          <h2 className="text-lg font-medium mb-1">No profiles yet</h2>
          <p className="text-sm text-muted-foreground max-w-sm mb-6">
            Create your first focus profile to customize timer durations, blocked
            sites, and more for different contexts.
          </p>
          <Button onClick={() => setCreateOpen(true)}>
            <Plus className="h-4 w-4" />
            Create Your First Profile
          </Button>
        </div>
      )}

      {/* Profile grid */}
      {profiles.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {profiles.map((profile) => (
            <ProfileCard key={profile.id} profile={profile} />
          ))}
        </div>
      )}

      {/* Create dialog */}
      <ProfileForm open={createOpen} onOpenChange={setCreateOpen} />
    </div>
  );
}
