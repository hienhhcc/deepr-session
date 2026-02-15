import sudoPrompt from 'sudo-prompt';
import { exec } from 'node:child_process';
import { promisify } from 'node:util';
import { Notification } from 'electron';
import fs from 'node:fs';

const execAsync = promisify(exec);

const HOSTS_PATH = '/etc/hosts';
const BLOCK_START_MARKER = '# DEEPR-SESSION-BLOCK-START';
const BLOCK_END_MARKER = '# DEEPR-SESSION-BLOCK-END';
const APP_CHECK_INTERVAL_MS = 10_000;

interface BlockerState {
  active: boolean;
  blockedDomains: string[];
  blockedApps: string[];
  detectedApps: string[];
  monitoringInterval: ReturnType<typeof setInterval> | null;
}

const state: BlockerState = {
  active: false,
  blockedDomains: [],
  blockedApps: [],
  detectedApps: [],
  monitoringInterval: null,
};

function sudoExec(command: string): Promise<string> {
  return new Promise((resolve, reject) => {
    sudoPrompt.exec(
      command,
      { name: 'Deepr Session' },
      (error, stdout, stderr) => {
        if (error) {
          reject(error);
          return;
        }
        resolve((stdout as string) || '');
      }
    );
  });
}

function buildHostsEntries(domains: string[]): string {
  const lines = domains.map((domain) => `127.0.0.1 ${domain}`);
  return [BLOCK_START_MARKER, ...lines, BLOCK_END_MARKER].join('\n');
}

function removeBlockEntriesFromContent(content: string): string {
  const startIdx = content.indexOf(BLOCK_START_MARKER);
  const endIdx = content.indexOf(BLOCK_END_MARKER);

  if (startIdx === -1 || endIdx === -1) {
    return content;
  }

  const before = content.substring(0, startIdx);
  const after = content.substring(endIdx + BLOCK_END_MARKER.length);

  // Clean up extra newlines at the junction
  return (before + after).replace(/\n{3,}/g, '\n\n').trimEnd() + '\n';
}

async function writeHostsFile(content: string): Promise<void> {
  // Write to a temp file, then move with sudo
  const tmpPath = '/tmp/deepr-session-hosts-tmp';
  fs.writeFileSync(tmpPath, content, 'utf-8');
  await sudoExec(`cp ${tmpPath} ${HOSTS_PATH} && rm ${tmpPath}`);
  // Flush DNS cache on macOS
  try {
    await sudoExec('dscacheutil -flushcache && killall -HUP mDNSResponder');
  } catch {
    // DNS flush is best-effort
  }
}

async function startAppMonitoring(): Promise<void> {
  stopAppMonitoring();

  state.monitoringInterval = setInterval(async () => {
    if (state.blockedApps.length === 0) return;

    try {
      const { stdout } = await execAsync('ps aux');
      const detected: string[] = [];

      for (const appName of state.blockedApps) {
        const lowerApp = appName.toLowerCase();
        const lines = stdout.split('\n');
        const found = lines.some((line) =>
          line.toLowerCase().includes(lowerApp)
        );

        if (found) {
          detected.push(appName);
        }
      }

      state.detectedApps = detected;

      if (detected.length > 0) {
        const notification = new Notification({
          title: 'Distraction Detected',
          body: `Blocked app${detected.length > 1 ? 's' : ''} running: ${detected.join(', ')}`,
          urgency: 'critical',
        });
        notification.show();
      }
    } catch (error) {
      console.error('App monitoring check failed:', error);
    }
  }, APP_CHECK_INTERVAL_MS);
}

function stopAppMonitoring(): void {
  if (state.monitoringInterval) {
    clearInterval(state.monitoringInterval);
    state.monitoringInterval = null;
  }
}

export async function startBlocking(
  domains: string[],
  apps: string[]
): Promise<void> {
  // Update hosts file with blocked domains
  if (domains.length > 0) {
    const currentHosts = fs.readFileSync(HOSTS_PATH, 'utf-8');
    const cleanedHosts = removeBlockEntriesFromContent(currentHosts);
    const newEntries = buildHostsEntries(domains);
    const updatedHosts = cleanedHosts.trimEnd() + '\n\n' + newEntries + '\n';
    await writeHostsFile(updatedHosts);
  }

  state.active = true;
  state.blockedDomains = [...domains];
  state.blockedApps = [...apps];
  state.detectedApps = [];

  // Start app monitoring
  if (apps.length > 0) {
    await startAppMonitoring();
  }
}

export async function stopBlocking(): Promise<void> {
  // Remove managed entries from hosts file
  if (state.blockedDomains.length > 0) {
    try {
      const currentHosts = fs.readFileSync(HOSTS_PATH, 'utf-8');
      const cleanedHosts = removeBlockEntriesFromContent(currentHosts);
      await writeHostsFile(cleanedHosts);
    } catch (error) {
      console.error('Failed to clean hosts file:', error);
    }
  }

  stopAppMonitoring();

  state.active = false;
  state.blockedDomains = [];
  state.blockedApps = [];
  state.detectedApps = [];
}

export function getStatus() {
  return {
    active: state.active,
    blockedDomains: [...state.blockedDomains],
    blockedApps: [...state.blockedApps],
    detectedApps: [...state.detectedApps],
  };
}

export async function emergencyUnlock(): Promise<void> {
  await stopBlocking();
}

export async function cleanup(): Promise<void> {
  if (state.active) {
    await stopBlocking();
  }
}
