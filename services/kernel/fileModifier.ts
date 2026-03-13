/**
 * File Modifier — Real Disk Write Engine
 *
 * In dev mode: calls the Singularity Kernel (localhost:4321) to write
 * actual files to disk so Vite HMR picks them up instantly.
 *
 * Falls back to localStorage simulation if the Kernel is not running.
 */

import { FileChange } from '../brand/codeGenerator';
import { AgentPrincipal, validateCodeWriteRequest } from '../intelligence/agentSandbox';

export interface BackupMetadata {
    id: string;
    timestamp: string;
    description: string;
    files: { path: string; content: string; type: string }[];
}

export interface ApplyResult {
    success: boolean;
    filesModified: number;
    backupId: string;
    errors: string[];
    mode: 'kernel' | 'localStorage';
}

export interface ApplyOptions {
    actor?: AgentPrincipal;
}

const KERNEL_URL = '/kernel'; // Proxied by Vite → http://localhost:4321
const BACKUP_PREFIX = 'singularity_backup_';
const MAX_BACKUPS = 10;

// ─── Kernel availability check (cached 30s) ──────────────────────────────
let kernelAvailable: boolean | null = null;
let kernelCheckTime = 0;

const isKernelOnline = async (): Promise<boolean> => {
    const now = Date.now();
    if (kernelAvailable !== null && now - kernelCheckTime < 30000) {
        return kernelAvailable;
    }
    try {
        const res = await fetch(`${KERNEL_URL}/health`, { method: 'GET', signal: AbortSignal.timeout(2000) });
        kernelAvailable = res.ok;
    } catch {
        kernelAvailable = false;
    }
    kernelCheckTime = Date.now();
    console.log(`[FileModifier] Kernel status: ${kernelAvailable ? '🟢 ONLINE (real writes)' : '🟡 OFFLINE (localStorage fallback)'}`);
    return kernelAvailable;
};

// ─── Real disk write via Kernel ─────────────────────────────────────────
const writeFileToDisk = async (
    filePath: string,
    content: string,
    description: string,
    actor: AgentPrincipal
): Promise<void> => {
    const res = await fetch(`${KERNEL_URL}/write`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filePath, content, description, actor })
    });
    if (!res.ok) {
        const err = await res.json().catch(() => ({ error: res.statusText }));
        throw new Error(err.error || `Kernel write failed: ${res.status}`);
    }
};

// ─── Read a file from disk via Kernel ───────────────────────────────────
const readFileFromDisk = async (filePath: string): Promise<string | null> => {
    try {
        const res = await fetch(`${KERNEL_URL}/read`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ filePath })
        });
        if (!res.ok) return null;
        const data = await res.json();
        return data.content ?? null;
    } catch {
        return null;
    }
};

export class FileModifier {

    async applyChanges(
        changes: FileChange[],
        description: string,
        options: ApplyOptions = {}
    ): Promise<ApplyResult> {
        const actor = options.actor || 'SYSTEM';
        const kernelOnline = await isKernelOnline();
        const backupId = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const errors: string[] = [];
        let filesModified = 0;
        const validChanges: FileChange[] = [];

        for (const change of changes) {
            const gate = validateCodeWriteRequest(actor, {
                filePath: change.filePath,
                change: change.content
            });
            if (!gate.allowed) {
                const reason = gate.violations.map(v => v.message).join(' | ');
                errors.push(`${change.filePath}: blocked by sandbox (${reason})`);
                continue;
            }
            validChanges.push({
                ...change,
                filePath: gate.normalizedParams.filePath,
                content: gate.normalizedParams.change
            });
        }

        if (validChanges.length === 0) {
            return { success: false, filesModified: 0, backupId, errors, mode: kernelOnline ? 'kernel' : 'localStorage' };
        }

        if (kernelOnline) {
            // ── REAL MODE: Write to actual disk with backup + auto-rollback ──
            const beforeWrite = new Map<string, string | null>();
            const writtenPaths: string[] = [];

            for (const change of validChanges) {
                if (!beforeWrite.has(change.filePath)) {
                    beforeWrite.set(change.filePath, await readFileFromDisk(change.filePath));
                }
            }

            this.createBackupMetadata(
                validChanges.map(change => ({
                    path: change.filePath,
                    content: beforeWrite.get(change.filePath) ?? '',
                    type: change.type
                })),
                description,
                backupId
            );

            for (const change of validChanges) {
                try {
                    await writeFileToDisk(change.filePath, change.content, change.description, actor);
                    filesModified++;
                    writtenPaths.push(change.filePath);
                    console.log(`[FileModifier] 🟢 Wrote to disk: ${change.filePath}`);
                } catch (err: any) {
                    errors.push(`${change.filePath}: ${err.message}`);
                    console.error(`[FileModifier] ❌ Failed: ${change.filePath}`, err.message);
                    break;
                }
            }

            if (errors.length > 0 && writtenPaths.length > 0) {
                for (const path of writtenPaths) {
                    const original = beforeWrite.get(path);
                    if (original !== undefined && original !== null) {
                        try {
                            await writeFileToDisk(path, original, `Auto rollback after failed write (${backupId})`, 'SYSTEM');
                        } catch (rollbackErr: any) {
                            errors.push(`${path}: rollback failed (${rollbackErr.message})`);
                        }
                    }
                }
                filesModified = 0;
            }

            return { success: errors.length === 0, filesModified, backupId, errors, mode: 'kernel' };
        } else {
            // ── FALLBACK MODE: localStorage simulation ────────────────────
            console.warn('[FileModifier] 🟡 Kernel offline — using localStorage simulation. Start edgeNode/kernel.mjs for real writes.');
            const backupFiles = validChanges.map(c => ({
                path: c.filePath,
                content: localStorage.getItem(`file_${c.filePath}`) || '',
                type: c.type
            }));
            this.createBackupMetadata(backupFiles, description, backupId);

            for (const change of validChanges) {
                try {
                    localStorage.setItem(`file_${change.filePath}`, change.content);
                    filesModified++;
                } catch (err: any) {
                    errors.push(`${change.filePath}: ${err.message}`);
                    break;
                }
            }

            if (errors.length > 0) {
                for (const file of backupFiles) {
                    localStorage.setItem(`file_${file.path}`, file.content);
                }
                filesModified = 0;
            }

            return { success: filesModified > 0 && errors.length === 0, filesModified, backupId, errors, mode: 'localStorage' };
        }
    }

    private createBackupMetadata(
        files: { path: string; content: string; type: string }[],
        description: string,
        backupId: string
    ) {
        try {
            const backup: BackupMetadata = {
                id: backupId,
                timestamp: new Date().toISOString(),
                description,
                files
            };
            localStorage.setItem(`${BACKUP_PREFIX}${backupId}`, JSON.stringify(backup));
            this.cleanupOldBackups();
        } catch { /* storage full */ }
    }

    private cleanupOldBackups() {
        const keys: string[] = [];
        for (let i = 0; i < localStorage.length; i++) {
            const k = localStorage.key(i);
            if (k?.startsWith(BACKUP_PREFIX)) keys.push(k);
        }
        if (keys.length > MAX_BACKUPS) {
            keys.sort().slice(0, keys.length - MAX_BACKUPS).forEach(k => localStorage.removeItem(k));
        }
    }

    async rollback(backupId: string): Promise<boolean> {
        try {
            const data = localStorage.getItem(`${BACKUP_PREFIX}${backupId}`);
            if (!data) throw new Error(`Backup ${backupId} not found`);
            const backup: BackupMetadata = JSON.parse(data);
            const kernelOnline = await isKernelOnline();
            for (const file of backup.files) {
                if (kernelOnline) {
                    await writeFileToDisk(file.path, file.content, `Rollback to backup ${backupId}`, 'SYSTEM');
                } else {
                    localStorage.setItem(`file_${file.path}`, file.content);
                }
            }
            return true;
        } catch (err) {
            console.error('[FileModifier] Rollback failed:', err);
            return false;
        }
    }

    async readFile(filePath: string): Promise<string | null> {
        const kernelOnline = await isKernelOnline();
        if (kernelOnline) return readFileFromDisk(filePath);
        return localStorage.getItem(`file_${filePath}`);
    }

    async applyAndRefresh(
        changes: FileChange[],
        description: string,
        options: ApplyOptions = {}
    ): Promise<ApplyResult> {
        const result = await this.applyChanges(changes, description, options);
        if (result.success && result.mode === 'localStorage') {
            // CSS hot-reload for localStorage mode
            const hasCSSChanges = changes.some(c => c.type === 'css');
            if (hasCSSChanges) this.reloadCSS();
        }
        // In kernel mode, Vite HMR handles the refresh automatically.
        window.dispatchEvent(new CustomEvent('singularity:modified', { detail: { backupId: result.backupId, changes, mode: result.mode } }));
        return result;
    }

    private reloadCSS() {
        document.querySelectorAll<HTMLLinkElement>('link[rel="stylesheet"]').forEach(link => {
            link.href = link.href.split('?')[0] + '?reload=' + Date.now();
        });
    }

    getKernelStatus() { return { available: kernelAvailable, checkedAt: kernelCheckTime }; }
}

export const fileModifier = new FileModifier();
