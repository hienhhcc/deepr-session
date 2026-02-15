"use client";

import { useState, useEffect } from "react";
import { Shield, ShieldOff, AlertTriangle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { getElectronAPI } from "@/lib/electron-api";
import { cn } from "@/lib/utils";

interface BlockerStatus {
  active: boolean;
  blockedDomains: string[];
  blockedApps: string[];
  detectedApps: string[];
}

export function BlockStatus() {
  const [status, setStatus] = useState<BlockerStatus | null>(null);
  const [unlockOpen, setUnlockOpen] = useState(false);
  const [unlockText, setUnlockText] = useState("");

  const fetchStatus = async () => {
    const api = getElectronAPI();
    if (!api) return;
    const data = (await api.blocker.status()) as BlockerStatus;
    setStatus(data);
  };

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleEmergencyUnlock = async () => {
    if (unlockText !== "UNLOCK") return;
    const api = getElectronAPI();
    if (!api) return;
    await api.blocker.stop();
    setUnlockOpen(false);
    setUnlockText("");
    await fetchStatus();
  };

  if (!status) return null;

  return (
    <>
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm flex items-center gap-2">
              {status.active ? (
                <Shield className="h-4 w-4 text-green-500" />
              ) : (
                <ShieldOff className="h-4 w-4 text-muted-foreground" />
              )}
              Blocking Status
            </CardTitle>
            <div
              className={cn(
                "h-2.5 w-2.5 rounded-full",
                status.active ? "bg-green-500" : "bg-muted-foreground/30"
              )}
            />
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {status.active ? (
            <>
              {status.blockedDomains.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-1">
                    Blocked domains
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {status.blockedDomains.map((d) => (
                      <Badge key={d} variant="secondary" className="text-[10px]">
                        {d}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {status.detectedApps.length > 0 && (
                <div className="flex items-center gap-2 text-xs text-amber-600">
                  <AlertTriangle className="h-3.5 w-3.5" />
                  Detected: {status.detectedApps.join(", ")}
                </div>
              )}

              <Button
                variant="destructive"
                size="sm"
                className="w-full"
                onClick={() => setUnlockOpen(true)}
              >
                Emergency Unlock
              </Button>
            </>
          ) : (
            <p className="text-xs text-muted-foreground">
              Blocking is not active. Start a focus session to enable blocking.
            </p>
          )}
        </CardContent>
      </Card>

      <Dialog open={unlockOpen} onOpenChange={setUnlockOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Emergency Unlock
            </DialogTitle>
            <DialogDescription>
              This will remove all website and app blocks immediately. Type
              &quot;UNLOCK&quot; to confirm.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 py-2">
            <Label htmlFor="unlock-confirm">Confirmation</Label>
            <Input
              id="unlock-confirm"
              value={unlockText}
              onChange={(e) => setUnlockText(e.target.value)}
              placeholder='Type "UNLOCK"'
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setUnlockOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              disabled={unlockText !== "UNLOCK"}
              onClick={handleEmergencyUnlock}
            >
              Unlock
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
