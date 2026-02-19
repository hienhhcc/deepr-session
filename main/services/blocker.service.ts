import sudoPrompt from '@vscode/sudo-prompt';
import { exec } from 'node:child_process';
import { promisify } from 'node:util';
import { Notification } from 'electron';
import fs from 'node:fs';
import os from 'node:os';

const execAsync = promisify(exec);

export const DEFAULT_BLOCKED_DOMAINS = [
  "facebook.com", "www.facebook.com",
  "youtube.com", "www.youtube.com",
  "discord.com", "www.discord.com",
];

export const DEFAULT_BLOCKED_APPS = ["Discord"];

const HOSTS_PATH = '/etc/hosts';
const BLOCK_START_MARKER = '# DEEPR-SESSION-BLOCK-START';
const BLOCK_END_MARKER = '# DEEPR-SESSION-BLOCK-END';
const APP_CHECK_INTERVAL_MS = 10_000;

const HELPER_SCRIPT_PATH = '/usr/local/bin/deepr-hosts-helper';
const SUDOERS_PATH = '/etc/sudoers.d/deepr-session';

interface BlockerState {
  active: boolean;
  blockedDomains: string[];
  blockedApps: string[];
  detectedApps: string[];
  monitoringInterval: ReturnType<typeof setInterval> | null;
  sudolessReady: boolean;
}

const state: BlockerState = {
  active: false,
  blockedDomains: [],
  blockedApps: [],
  detectedApps: [],
  monitoringInterval: null,
  sudolessReady: false,
};

// --- Sudo prompt (one-time setup only) ---

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

// --- Helper script for passwordless sudo ---

const HELPER_SCRIPT_CONTENT = `#!/bin/bash
# Deepr Session hosts file helper — only modifies /etc/hosts within marked blocks
set -euo pipefail

HOSTS_PATH="/etc/hosts"
START_MARKER="# DEEPR-SESSION-BLOCK-START"
END_MARKER="# DEEPR-SESSION-BLOCK-END"

case "\${1:-}" in
  block)
    TMPFILE="\$2"
    if [ ! -f "\$TMPFILE" ]; then
      echo "Temp file not found: \$TMPFILE" >&2
      exit 1
    fi
    cp "\$TMPFILE" "\$HOSTS_PATH"
    rm -f "\$TMPFILE"
    dscacheutil -flushcache 2>/dev/null || true
    killall -HUP mDNSResponder 2>/dev/null || true
    ;;
  unblock)
    TMPFILE="\$2"
    if [ ! -f "\$TMPFILE" ]; then
      echo "Temp file not found: \$TMPFILE" >&2
      exit 1
    fi
    cp "\$TMPFILE" "\$HOSTS_PATH"
    rm -f "\$TMPFILE"
    dscacheutil -flushcache 2>/dev/null || true
    killall -HUP mDNSResponder 2>/dev/null || true
    ;;
  *)
    echo "Usage: deepr-hosts-helper {block|unblock} <tmpfile>" >&2
    exit 1
    ;;
esac
`;

function isSudolessReady(): boolean {
  try {
    return fs.existsSync(HELPER_SCRIPT_PATH) && fs.existsSync(SUDOERS_PATH);
  } catch {
    return false;
  }
}

/**
 * One-time setup: installs a helper script and sudoers rule so future
 * hosts file modifications don't require a password prompt.
 * This is the ONLY time the user sees a sudo prompt.
 */
export async function setupSudoless(): Promise<void> {
  if (isSudolessReady()) {
    state.sudolessReady = true;
    return;
  }

  const username = os.userInfo().username;

  // Write helper script to temp, then install with sudo
  const tmpScript = '/tmp/deepr-hosts-helper-install';
  fs.writeFileSync(tmpScript, HELPER_SCRIPT_CONTENT, { mode: 0o755 });

  // Sudoers entry: allow this user to run ONLY the helper script without password
  const sudoersContent = `${username} ALL=(root) NOPASSWD: ${HELPER_SCRIPT_PATH}\n`;
  const tmpSudoers = '/tmp/deepr-sudoers-install';
  fs.writeFileSync(tmpSudoers, sudoersContent, { mode: 0o440 });

  // Install both with a single sudo prompt
  await sudoExec(
    `cp ${tmpScript} ${HELPER_SCRIPT_PATH} && ` +
    `chmod 755 ${HELPER_SCRIPT_PATH} && ` +
    `chown root:wheel ${HELPER_SCRIPT_PATH} && ` +
    `cp ${tmpSudoers} ${SUDOERS_PATH} && ` +
    `chmod 440 ${SUDOERS_PATH} && ` +
    `chown root:wheel ${SUDOERS_PATH} && ` +
    `rm -f ${tmpScript} ${tmpSudoers}`
  );

  state.sudolessReady = true;
}

// --- Hosts file operations (passwordless after setup) ---

async function runHelper(action: string, tmpFile: string): Promise<void> {
  await execAsync(`sudo ${HELPER_SCRIPT_PATH} ${action} ${tmpFile}`);
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
  const tmpPath = '/tmp/deepr-session-hosts-tmp';
  fs.writeFileSync(tmpPath, content, 'utf-8');

  if (state.sudolessReady) {
    // Passwordless path — no prompt
    await runHelper('block', tmpPath);
  } else {
    // Fallback to sudo-prompt (shows password dialog)
    await sudoExec(`cp ${tmpPath} ${HOSTS_PATH} && rm ${tmpPath}`);
    try {
      await sudoExec('dscacheutil -flushcache && killall -HUP mDNSResponder');
    } catch {
      // DNS flush is best-effort
    }
  }
}

// --- App monitoring ---

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
        // Force-quit detected apps
        for (const appName of detected) {
          try {
            await execAsync(`pkill -f "${appName}"`);
          } catch {
            // pkill returns non-zero if no process matched, ignore
          }
        }

        const notification = new Notification({
          title: 'Distraction Blocked',
          body: `Force-quit blocked app${detected.length > 1 ? 's' : ''}: ${detected.join(', ')}`,
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

// --- Public API ---

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
    sudolessReady: state.sudolessReady,
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

/**
 * Called once on app startup to remove any leftover block entries from a
 * previous session that crashed or was force-killed before cleanup ran.
 */
export async function startupCleanup(): Promise<void> {
  try {
    const currentHosts = fs.readFileSync(HOSTS_PATH, 'utf-8');
    if (!currentHosts.includes(BLOCK_START_MARKER)) return;
    const cleanedHosts = removeBlockEntriesFromContent(currentHosts);
    state.sudolessReady = isSudolessReady();
    await writeHostsFile(cleanedHosts);
    console.log('[deepr] Startup: removed leftover blocker entries from /etc/hosts');
  } catch (error) {
    console.error('[deepr] Startup cleanup failed:', error);
  }
}
