"use client";

import { useState, useEffect } from "react";
import { Settings, Database, Volume2, Info, Leaf } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { getElectronAPI } from "@/lib/electron-api";

export default function SettingsPage() {
  const [dbPath, setDbPath] = useState<string>("");
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [minimizeToTray, setMinimizeToTray] = useState(true);

  useEffect(() => {
    const loadDbPath = async () => {
      const api = getElectronAPI();
      if (!api) return;
      const userDataPath = (await api.app.getPath("userData")) as string;
      setDbPath(`${userDataPath}/deepr.db`);
    };
    loadDbPath();

    // Load settings from localStorage
    setSoundEnabled(localStorage.getItem("soundEnabled") !== "false");
    setNotificationsEnabled(
      localStorage.getItem("notificationsEnabled") !== "false"
    );
    setMinimizeToTray(localStorage.getItem("minimizeToTray") !== "false");
  }, []);

  const toggleSetting = (key: string, value: boolean) => {
    localStorage.setItem(key, String(value));
    switch (key) {
      case "soundEnabled":
        setSoundEnabled(value);
        break;
      case "notificationsEnabled":
        setNotificationsEnabled(value);
        break;
      case "minimizeToTray":
        setMinimizeToTray(value);
        break;
    }
  };

  return (
    <div className="animate-fade-in-up space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
          <Settings className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-semibold">Settings</h1>
          <p className="text-sm text-muted-foreground">
            Configure your Deepr Session experience
          </p>
        </div>
      </div>

      {/* General */}
      <Card className="card-hover-lift">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">General</CardTitle>
          <p className="text-xs text-muted-foreground">
            App behavior and system preferences
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Minimize to tray</Label>
              <p className="text-xs text-muted-foreground">
                Keep the app running in the system tray when the window is
                closed
              </p>
            </div>
            <Switch
              checked={minimizeToTray}
              onCheckedChange={(v) => toggleSetting("minimizeToTray", v)}
            />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Notifications</Label>
              <p className="text-xs text-muted-foreground">
                Show desktop notifications when a timer phase ends
              </p>
            </div>
            <Switch
              checked={notificationsEnabled}
              onCheckedChange={(v) =>
                toggleSetting("notificationsEnabled", v)
              }
            />
          </div>
        </CardContent>
      </Card>

      {/* Sound */}
      <Card className="card-hover-lift">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Volume2 className="h-4 w-4" />
            Sound
          </CardTitle>
          <p className="text-xs text-muted-foreground">
            Audio feedback and alert preferences
          </p>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Timer completion sound</Label>
              <p className="text-xs text-muted-foreground">
                Play a sound when a focus or break period ends
              </p>
            </div>
            <Switch
              checked={soundEnabled}
              onCheckedChange={(v) => toggleSetting("soundEnabled", v)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Data */}
      <Card className="card-hover-lift">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Database className="h-4 w-4" />
            Data
          </CardTitle>
          <p className="text-xs text-muted-foreground">
            Storage and data management
          </p>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <Label>Database location</Label>
            <p className="text-xs text-muted-foreground font-mono mt-1 break-all">
              {dbPath || "Loading..."}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* About */}
      <Card className="card-hover-lift">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Info className="h-4 w-4" />
            About
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Leaf className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-sm font-medium">Deepr Session</p>
              <p className="text-xs text-muted-foreground">
                A deep work focus timer with distraction blocking, ambient sounds,
                and analytics.
              </p>
            </div>
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Version</span>
            <span className="text-xs font-mono text-muted-foreground bg-muted px-2 py-0.5 rounded-md">
              1.0.0
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
