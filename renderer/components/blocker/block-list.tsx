"use client";

import { useState, useEffect } from "react";
import { Globe, AppWindow, Plus, Trash2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getElectronAPI } from "@/lib/electron-api";

interface BlockRule {
  id: string;
  profile_id: string;
  type: "domain" | "app";
  value: string;
  created_at: string;
}

interface BlockListProps {
  profileId: string;
}

export function BlockList({ profileId }: BlockListProps) {
  const [rules, setRules] = useState<BlockRule[]>([]);
  const [domainInput, setDomainInput] = useState("");
  const [appInput, setAppInput] = useState("");

  useEffect(() => {
    fetchRules();
  }, [profileId]);

  const fetchRules = async () => {
    const api = getElectronAPI();
    if (!api) return;
    const data = await api.blocker.listRules(profileId);
    setRules((data as BlockRule[]) || []);
  };

  const addRule = async (type: "domain" | "app", value: string) => {
    const api = getElectronAPI();
    if (!api || !value.trim()) return;
    await api.blocker.addRule({ profileId, type, value: value.trim() });
    if (type === "domain") setDomainInput("");
    else setAppInput("");
    await fetchRules();
  };

  const removeRule = async (id: string) => {
    const api = getElectronAPI();
    if (!api) return;
    await api.blocker.removeRule(id);
    setRules((prev) => prev.filter((r) => r.id !== id));
  };

  const domains = rules.filter((r) => r.type === "domain");
  const apps = rules.filter((r) => r.type === "app");

  return (
    <div className="space-y-4">
      {/* Blocked Websites */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Globe className="h-4 w-4 text-primary" />
            Blocked Websites
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex gap-2">
            <Input
              placeholder="e.g. twitter.com"
              value={domainInput}
              onChange={(e) => setDomainInput(e.target.value)}
              onKeyDown={(e) =>
                e.key === "Enter" && addRule("domain", domainInput)
              }
              className="flex-1"
            />
            <Button
              size="sm"
              onClick={() => addRule("domain", domainInput)}
              disabled={!domainInput.trim()}
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          {domains.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {domains.map((rule) => (
                <Badge
                  key={rule.id}
                  variant="secondary"
                  className="gap-1.5 pr-1"
                >
                  {rule.value}
                  <button
                    onClick={() => removeRule(rule.id)}
                    className="ml-1 hover:text-destructive"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
          ) : (
            <p className="text-xs text-muted-foreground">
              No blocked websites yet.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Blocked Apps */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <AppWindow className="h-4 w-4 text-primary" />
            Blocked Apps
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex gap-2">
            <Input
              placeholder="e.g. Slack"
              value={appInput}
              onChange={(e) => setAppInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addRule("app", appInput)}
              className="flex-1"
            />
            <Button
              size="sm"
              onClick={() => addRule("app", appInput)}
              disabled={!appInput.trim()}
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          {apps.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {apps.map((rule) => (
                <Badge
                  key={rule.id}
                  variant="outline"
                  className="gap-1.5 pr-1"
                >
                  {rule.value}
                  <button
                    onClick={() => removeRule(rule.id)}
                    className="ml-1 hover:text-destructive"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
          ) : (
            <p className="text-xs text-muted-foreground">
              No blocked apps yet.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
