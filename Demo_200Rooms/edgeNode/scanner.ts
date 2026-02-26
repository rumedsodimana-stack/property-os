import { exec } from 'child_process';
import * as admin from 'firebase-admin';
import * as path from 'path';
import * as os from 'os';

// ---------------------------------------------------------------------
// SINGULARITY OS: TRUE EDGE NODE
// ---------------------------------------------------------------------
// This script runs autonomously on the Hotel's Local Server (e.g., Mac/Linux).
// It bypasses the browser entirely to execute real system-level networking
// commands (`arp -a`) to discover physical IoT devices on the VLAN.
// It then pushes these physical devices securely to the database.

// Initialize Firebase Admin (Connecting to local emulator for MVP)
process.env.FIRESTORE_EMULATOR_HOST = '127.0.0.1:8085';

// Since we are running locally without a service account for this test,
// we initialize with a dummy project ID that matches the emulator.
admin.initializeApp({
    projectId: 'demo-hotel-singularity'
});

const db = admin.firestore();

// Known vendor prefix mapping for aesthetics
const VENDORS: Record<string, string> = {
    '00:1a:2b': 'Assa Abloy (Locks)',
    'f4:a2:00': 'Star Micronics (Printers)',
    'a1:b2:c3': '3M (Scanners)',
    'bc:a8:a6': 'Apple (iPhone/Mac)', // Common Apple prefix
    '00:25:9c': 'Cisco (Routers)',
};

const guessDeviceType = (mac: string): 'ENCODER' | 'PRINTER' | 'SCANNER' | 'PAYMENT' | 'UNKNOWN' => {
    const prefix = mac.substring(0, 8).toLowerCase();
    if (prefix === '00:1a:2b') return 'ENCODER';
    if (prefix === 'f4:a2:00') return 'PRINTER';
    if (prefix === 'a1:b2:c3') return 'SCANNER';
    // Let's assume some apple devices are temporary payment terminals for the demo
    if (prefix === 'bc:a8:a6') return 'PAYMENT';
    return 'UNKNOWN';
};

const guessModelName = (mac: string): string => {
    const prefix = mac.substring(0, 8).toLowerCase();
    return VENDORS[prefix] || `Unknown Device (${prefix})`;
};

async function scanNetwork() {
    console.log(`\n🔍 [Singularity Edge Node] Initiating Deep Network Scan (ARP Table)...`);

    // Determine command based on OS
    const cmd = os.platform() === 'win32' ? 'arp -a' : 'arp -a';

    exec(cmd, async (error, stdout, stderr) => {
        if (error) {
            console.error(`❌ [Singularity Edge Node] Failed to scan network: ${error.message}`);
            return;
        }

        // Parse ARP table output
        // Example Mac output: ? (192.168.1.1) at 0:25:9c:df:11:22 on en0 ifscope [ethernet]
        // Example Win output: 192.168.1.1       00-25-9c-df-11-22     dynamic

        const lines = stdout.split('\n');
        const discoveredDevices: { ip: string, mac: string }[] = [];

        for (const line of lines) {
            // Very rudimentary parsing to catch both Windows and Mac formats roughly
            const ipMatch = line.match(/(?:\d{1,3}\.){3}\d{1,3}/);
            const macMatch = line.match(/(?:[0-9a-fA-F]{1,2}[:-]){5}[0-9a-fA-F]{1,2}/);

            if (ipMatch && macMatch) {
                let mac = macMatch[0].replace(/-/g, ':').toLowerCase();
                // Normalize MAC (e.g. 0:a:b -> 00:0a:0b)
                mac = mac.split(':').map(part => part.length === 1 ? '0' + part : part).join(':');

                // Ignore multicast/broadcast addresses
                if (!mac.startsWith('ff:ff:') && !mac.startsWith('01:00:5e')) {
                    discoveredDevices.push({ ip: ipMatch[0], mac });
                }
            }
        }

        console.log(`✅ [Singularity Edge Node] Detected ${discoveredDevices.length} physical hardware devices.`);

        // 2. Synchronize with Firestore
        for (const device of discoveredDevices) {
            const deviceId = `dev_${device.mac.replace(/:/g, '')}`;
            const docRef = db.collection('hardware_devices').doc(deviceId);

            const existingDoc = await docRef.get();

            if (!existingDoc.exists) {
                // IT'S A NEW DEVICE! Throw it into Quarantine.
                console.log(`⚠️  [Singularity Edge Node] NEW ROGUE DEVICE DETECTED: IP ${device.ip}, MAC ${device.mac}. Sending to Quarantine Zone!`);
                await docRef.set({
                    type: guessDeviceType(device.mac),
                    ip: device.ip,
                    mac: device.mac.toUpperCase(),
                    model: guessModelName(device.mac),
                    status: 'QUARANTINE',
                    lastSeen: new Date().toISOString(),
                    mappedStation: null
                });
            } else {
                // Update last seen timestamp
                await docRef.update({
                    ip: device.ip, // IP might have changed via DHCP
                    lastSeen: new Date().toISOString()
                });
            }
        }

        console.log(`✅ [Singularity Edge Node] Database Sync Complete. Sleeping for 15 seconds...\n`);
    });
}

// Ensure the collection is empty for the demo so we see the dramatic effect
async function purgeDatabase() {
    console.log(`🧹 [Singularity Edge Node] Purging database for deep scan...`);
    const snapshot = await db.collection('hardware_devices').get();
    const batch = db.batch();
    snapshot.docs.forEach((doc) => {
        batch.delete(doc.ref);
    });
    await batch.commit();
}

// Run the scan loop
async function runDaemon() {
    console.log(`\n======================================================`);
    console.log(`⚡ SINGULARITY OS EDGE NODE DAEMON STARTED`);
    console.log(`======================================================`);

    await purgeDatabase();
    await scanNetwork();

    // Re-scan every 15 seconds
    setInterval(scanNetwork, 15000);
}

runDaemon();
