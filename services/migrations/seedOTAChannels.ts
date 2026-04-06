import { addItem, queryItems } from '../kernel/firestoreService';
import { OTA_CHANNELS } from '../../components/configuration/OTAChannels';

const MIGRATION_KEY = 'hs_otachannels_migrated_v2';

export const migrateInitialOTAChannels = async () => {
    try {
        const existingChannels = await queryItems('ota_connections') as any[];

        if (existingChannels.length === 0) {
            // Fresh install — seed all default channels (TravelBook is first)
            console.log("[Migration] No OTA connections found in Firestore. Migrating defaults...");
            for (const channel of OTA_CHANNELS) {
                const { id, ...channelData } = channel;
                await addItem('ota_connections', channelData);
            }
            console.log("[Migration] Successfully migrated default OTA channels to Firestore.");
        } else {
            // Existing install — ensure TravelBook native channel is present
            const hasTravelBook = existingChannels.some(
                (c: any) => c.name?.includes('TravelBook') || c.id === 'travelbook'
            );
            if (!hasTravelBook) {
                const tbChannel = OTA_CHANNELS.find(c => c.id === 'travelbook');
                if (tbChannel) {
                    const { id, ...channelData } = tbChannel;
                    await addItem('ota_connections', channelData);
                    console.log("[Migration] Inserted TravelBook native channel.");
                }
            } else {
                console.log("[Migration] OTA connections already include TravelBook. No action needed.");
            }
        }

        if (typeof localStorage !== 'undefined') localStorage.setItem(MIGRATION_KEY, '1');
    } catch (error) {
        console.error("[Migration] Failed to migrate default OTA channels:", error);
    }
};
