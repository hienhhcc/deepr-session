export interface BlockRule {
  id: string;
  profileId: string;
  type: "domain" | "app";
  value: string;
  createdAt: string;
}

export interface BlockerStatus {
  active: boolean;
  blockedDomains: string[];
  blockedApps: string[];
  detectedApps: string[];
}
