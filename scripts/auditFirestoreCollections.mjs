#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

let repoRoot = process.cwd();
if (!fs.existsSync(path.join(repoRoot, 'Demo_200Rooms')) && path.basename(repoRoot) === 'Demo_200Rooms') {
    repoRoot = path.dirname(repoRoot);
}

const CODEBASES = [
    {
        name: 'root',
        baseDir: repoRoot,
        rulesPath: path.join(repoRoot, 'firestore.rules'),
        ignoreTopLevel: new Set(['node_modules', '.git', 'dist', 'test-results', 'Demo_200Rooms']),
    },
    {
        name: 'demo_200rooms',
        baseDir: path.join(repoRoot, 'Demo_200Rooms'),
        rulesPath: path.join(repoRoot, 'Demo_200Rooms', 'firestore.rules'),
        ignoreTopLevel: new Set(['node_modules', '.git', 'dist', 'test-results']),
    },
];

const COLLECTION_CALL_PATTERNS = [
    /\bcollection\s*\(\s*db\s*,\s*['"`]([^'"`/${}]+)['"`]/g,
    /\bdoc\s*\(\s*db\s*,\s*['"`]([^'"`/${}]+)['"`]/g,
    /\b(?:subscribeToItems|fetchItems|fetchItem|queryItems|addItem|updateItem|deleteItem|ensureDocument|sub)\s*(?:<[^>]*>)?\s*\(\s*['"`]([^'"`/${}]+)['"`]/g,
    /\b(?:listen|write)\s*\(\s*['"`]([^'"`/${}]+)['"`]/g,
];

const FILE_EXTENSIONS = new Set(['.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs']);
const GLOBAL_IGNORE_DIRS = new Set(['node_modules', '.git', 'dist', 'test-results', '.firebase']);

const walkFiles = (dir, ignoreTopLevel) => {
    const files = [];

    const walk = (current, depth) => {
        const entries = fs.readdirSync(current, { withFileTypes: true });
        for (const entry of entries) {
            const abs = path.join(current, entry.name);

            if (entry.isDirectory()) {
                if (GLOBAL_IGNORE_DIRS.has(entry.name)) continue;
                if (depth === 0 && ignoreTopLevel.has(entry.name)) continue;
                if (entry.name === 'functions' && path.basename(abs) === 'functions') {
                    // Keep functions/src in the audit surface, ignore compiled output.
                    walk(abs, depth + 1);
                    continue;
                }
                if (entry.name === 'lib' && path.basename(path.dirname(abs)) === 'functions') continue;
                walk(abs, depth + 1);
                continue;
            }

            if (!FILE_EXTENSIONS.has(path.extname(entry.name))) continue;
            files.push(abs);
        }
    };

    walk(dir, 0);
    return files;
};

const extractCollectionsFromFile = (source) => {
    const collections = new Set();
    for (const pattern of COLLECTION_CALL_PATTERNS) {
        pattern.lastIndex = 0;
        let match;
        while ((match = pattern.exec(source))) {
            const name = match[1]?.trim();
            if (!name) continue;
            if (name.includes('/')) continue;
            if (name.includes('${')) continue;
            collections.add(name);
        }
    }
    return collections;
};

const extractRuleCollections = (rulesText) => {
    const collections = new Set();
    const pattern = /match\s+\/([A-Za-z0-9_]+)\/\{/g;
    let match;
    while ((match = pattern.exec(rulesText))) {
        collections.add(match[1]);
    }
    return collections;
};

const auditCodebase = ({ name, baseDir, rulesPath, ignoreTopLevel }) => {
    if (!fs.existsSync(rulesPath)) {
        return {
            name,
            error: `Rules file missing: ${rulesPath}`,
            missingCollections: ['<rules file missing>'],
            referencedCollections: [],
            coveredCollections: [],
        };
    }

    const files = walkFiles(baseDir, ignoreTopLevel);
    const referencedCollections = new Set();

    for (const file of files) {
        const source = fs.readFileSync(file, 'utf8');
        const fileCollections = extractCollectionsFromFile(source);
        fileCollections.forEach((c) => referencedCollections.add(c));
    }

    const rulesText = fs.readFileSync(rulesPath, 'utf8');
    const coveredCollections = extractRuleCollections(rulesText);

    const missing = [...referencedCollections]
        .filter((c) => !coveredCollections.has(c))
        .sort((a, b) => a.localeCompare(b));

    return {
        name,
        missingCollections: missing,
        referencedCollections: [...referencedCollections].sort((a, b) => a.localeCompare(b)),
        coveredCollections: [...coveredCollections].sort((a, b) => a.localeCompare(b)),
    };
};

const results = CODEBASES.map(auditCodebase);
let hasFailures = false;

for (const result of results) {
    if (result.error) {
        hasFailures = true;
        console.error(`\n[${result.name}] ERROR: ${result.error}`);
        continue;
    }

    if (result.missingCollections.length > 0) {
        hasFailures = true;
        console.error(`\n[${result.name}] Missing Firestore rules coverage for collections:`);
        result.missingCollections.forEach((name) => console.error(`  - ${name}`));
    } else {
        console.log(`\n[${result.name}] OK: rules cover all detected collections (${result.referencedCollections.length} referenced).`);
    }
}

if (hasFailures) {
    process.exitCode = 1;
} else {
    console.log('\nFirestore collection audit passed for all codebases.');
}
