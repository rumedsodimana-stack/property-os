import { addItem, queryItems } from '../kernel/firestoreService';
import { OTA_CHANNELS } from '../../components/configuration/OTAChannels';

const MIGRATION_KEY = 'hs_otachannels_migrated_v1';

export const migrateInitialOTAChannels = async () => {
    if (typeof localStorage !== 'undefined' && localStorage.getItem(MIGRATION_KEY)) return;

    try {
        const existingChannels = await queryItems('ota_connections');
        if (existingChannels.length === 0) {
            console.log("[Migration] No OTA connections found in Firestore. Migrating defaults...");
            // Add defaults sequentially to avoid overwhelming rate limits/order issues
            for (const channel of OTA_CHANNELS) {
                // Ensure we omit 'id' if 'addItem' auto-generates it, 
                // or we adapt if OTA_CHANNELS has a strict 'id' that we want to keep.
                // Assuming firestoreService `addItem` generates its own document ID, we'll exclude the hardcoded 'id'.
                const { id, ...channelData } = channel;
                await addItem('ota_connections', channelData);
            }
            console.log("[Migration] Successfully migrated default OTA channels to Firestore.");
        } else {
            console.log("[Migration] OTA connections already exist in Firestore. Skipping defaults migration.");
        }
        if (typeof localStorage !== 'undefined') localStorage.setItem(MIGRATION_KEY, '1');
    } catch (error) {
        console.error("[Migration] Failed to migrate default OTA channels:", error);
    }
};
