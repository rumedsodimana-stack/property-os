/**
 * SINGULARITY KERNEL — Real-Time Code Modification Server
 *
 * A lightweight local Node.js server that receives file-write requests
 * from the browser (NeuralSidepanel AI) and applies them to real source
 * files on disk. Vite's Hot Module Replacement instantly picks up changes.
 *
 * Start with: node kernel.mjs
 * Runs on: http://localhost:4321
 */

import { createServer } from 'http';
import { writeFile, readFile, mkdir } from 'fs/promises';
import { dirname, resolve, extname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = resolve(__dirname, '..');
const PORT = 4321;

// ─── Hard Sandbox Policy ────────────────────────────────────────────────
const ALLOWED_PATH_PREFIXES = [
    'App.tsx',
    'index.css',
    'index.html',
    'components/',
    'services/',
    'context/',
    'src/',
    'types/',
    'docs/',
    'public/'
];

const BLOCKED_PATH_SEGMENTS = [
    '..',
    '.git',
    '.env',
    'node_modules',
    'dist/',
    '.firebase',
    '.singularity_backups',
    'edgeNode/'
];

const ALLOWED_WRITE_EXTENSIONS = new Set(['.ts', '.tsx', '.css', '.json', '.md', '.html']);
const MAX_CONTENT_BYTES = 300000;

const normalizePath = (filePath) =>
    String(filePath || '')
        .replace(/\\/g, '/')
        .replace(/^\.?\//, '')
        .trim();

const hasAllowedPrefix = (filePath) =>
    ALLOWED_PATH_PREFIXES.some(prefix => filePath === prefix || filePath.startsWith(prefix));

const hasBlockedSegment = (filePath) => {
    const lower = filePath.toLowerCase();
    return BLOCKED_PATH_SEGMENTS.some(seg => lower.includes(seg.toLowerCase()));
};

const isSafeResolvedPath = (filePath) => {
    const resolved = resolve(PROJECT_ROOT, filePath);
    return resolved.startsWith(PROJECT_ROOT);
};

const validatePath = (filePath) => {
    const normalized = normalizePath(filePath);
    if (!normalized) return { ok: false, error: 'filePath is required' };
    if (normalized.startsWith('/')) return { ok: false, error: 'Absolute paths are not allowed' };
    if (!isSafeResolvedPath(normalized)) return { ok: false, error: 'Path resolves outside project root' };
    if (hasBlockedSegment(normalized)) return { ok: false, error: 'Path blocked by hard sandbox policy' };
    if (!hasAllowedPrefix(normalized)) return { ok: false, error: 'Path is outside sandbox allowlist' };
    if (!ALLOWED_WRITE_EXTENSIONS.has(extname(normalized).toLowerCase())) {
        return { ok: false, error: `File extension is not allowed. Allowed: ${[...ALLOWED_WRITE_EXTENSIONS].join(', ')}` };
    }
    return { ok: true, normalized };
};

const validateWritePayload = (filePath, content) => {
    const pathResult = validatePath(filePath);
    if (!pathResult.ok) return pathResult;
    if (typeof content !== 'string') return { ok: false, error: 'content must be a string' };
    if (!content.trim()) return { ok: false, error: 'content cannot be empty' };
    const bytes = Buffer.byteLength(content, 'utf-8');
    if (bytes > MAX_CONTENT_BYTES) {
        return { ok: false, error: `content exceeds ${MAX_CONTENT_BYTES} bytes` };
    }
    return { ok: true, normalized: pathResult.normalized };
};

// ─── CORS headers ───────────────────────────────────────────────────────
const ALLOWED_ORIGINS = new Set([
    'http://localhost:5173',
    'http://127.0.0.1:5173',
    'http://localhost:3000',
    'http://127.0.0.1:3000',
    `http://localhost:${PORT}`,
    `http://127.0.0.1:${PORT}`
]);

const cors = (req, res) => {
    const origin = req.headers.origin;
    if (origin && ALLOWED_ORIGINS.has(origin)) {
        res.setHeader('Access-Control-Allow-Origin', origin);
    }
    res.setHeader('Vary', 'Origin');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
};

// ─── JSON body reader ────────────────────────────────────────────────────
const readBody = (req) =>
    new Promise((resolve, reject) => {
        let body = '';
        req.on('data', chunk => (body += chunk.toString()));
        req.on('end', () => {
            try { resolve(JSON.parse(body)); }
            catch { reject(new Error('Invalid JSON body')); }
        });
        req.on('error', reject);
    });

// ─── Backup system ───────────────────────────────────────────────────────
const BACKUP_DIR = resolve(PROJECT_ROOT, '.singularity_backups');

const createBackup = async (filePath) => {
    const resolved = resolve(PROJECT_ROOT, filePath);
    try {
        await mkdir(BACKUP_DIR, { recursive: true });
        const original = await readFile(resolved, 'utf-8');
        const backupName = filePath.replace(/\//g, '__') + '.' + Date.now() + '.bak';
        await writeFile(resolve(BACKUP_DIR, backupName), original, 'utf-8');
        return backupName;
    } catch {
        return null; // File doesn't exist yet — that's fine
    }
};

// ─── Request router ──────────────────────────────────────────────────────
const server = createServer(async (req, res) => {
    cors(req, res);

    // Preflight
    if (req.method === 'OPTIONS') {
        res.writeHead(204);
        res.end();
        return;
    }

    const url = new URL(req.url, `http://localhost:${PORT}`);

    // ── Health check
    if (url.pathname === '/health' && req.method === 'GET') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ status: 'online', projectRoot: PROJECT_ROOT, time: new Date().toISOString() }));
        return;
    }

    // ── Write a file: POST /write
    // Body: { filePath: "src/...", content: "...", description: "..." }
    if (url.pathname === '/write' && req.method === 'POST') {
        try {
            const { filePath, content, description, actor } = await readBody(req);

            if (!filePath || content === undefined) {
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: false, error: 'filePath and content are required' }));
                return;
            }

            const validation = validateWritePayload(filePath, content);
            if (!validation.ok) {
                res.writeHead(403, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: false, error: validation.error }));
                return;
            }

            const safePath = validation.normalized;
            const resolved = resolve(PROJECT_ROOT, safePath);

            // Create backup first
            const backupName = await createBackup(safePath);

            // Ensure directory exists
            await mkdir(dirname(resolved), { recursive: true });

            // Write the file
            await writeFile(resolved, content, 'utf-8');

            console.log(`[Kernel] ✅ WROTE ${safePath} — ${description || 'no description'}${actor ? ` [actor=${actor}]` : ''}`);
            if (backupName) console.log(`[Kernel] 📦 Backup: ${backupName}`);

            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: true, filePath: safePath, backupName, description }));

        } catch (err) {
            console.error('[Kernel] ❌ Write error:', err.message);
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: false, error: err.message }));
        }
        return;
    }

    // ── Read a file: POST /read
    // Body: { filePath: "src/..." }
    if (url.pathname === '/read' && req.method === 'POST') {
        try {
            const { filePath } = await readBody(req);
            const validation = validatePath(filePath);
            if (!validation.ok) {
                res.writeHead(403, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: false, error: validation.error }));
                return;
            }
            const safePath = validation.normalized;
            const resolved = resolve(PROJECT_ROOT, safePath);
            const content = await readFile(resolved, 'utf-8');
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: true, filePath: safePath, content }));
        } catch (err) {
            res.writeHead(404, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: false, error: err.message }));
        }
        return;
    }

    // ── List backups: GET /backups
    if (url.pathname === '/backups' && req.method === 'GET') {
        try {
            const { readdir } = await import('fs/promises');
            const files = await readdir(BACKUP_DIR).catch(() => []);
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: true, backups: files }));
        } catch (err) {
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: false, error: err.message }));
        }
        return;
    }

    // 404
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Not found', routes: ['GET /health', 'POST /write', 'POST /read', 'GET /backups'] }));
});

server.listen(PORT, () => {
    console.log('');
    console.log('╔═══════════════════════════════════════════════╗');
    console.log('║    ⚡ SINGULARITY KERNEL — ONLINE              ║');
    console.log(`║    Real-Time File Modification Server          ║`);
    console.log(`║    http://localhost:${PORT}                     ║`);
    console.log(`║    Project Root: ${PROJECT_ROOT.split('/').slice(-3).join('/')}  ║`);
    console.log('╚═══════════════════════════════════════════════╝');
    console.log('');
    console.log('  POST /write  → Write a source file to disk');
    console.log('  POST /read   → Read a source file');
    console.log('  GET  /health → Health check');
    console.log('');
    console.log('Waiting for AI modification requests...');
});
