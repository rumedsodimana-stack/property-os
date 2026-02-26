import { otaAdapter, OTAChannel, OTAReservationPayload } from './otaAdapter';
import { addItem, updateItem, subscribeToItems } from '../kernel/firestoreService';
import { Reservation } from '../../types';

class ChannelManager {
    private channels: OTAChannel[] = [];
    private listeners: ((channels: OTAChannel[]) => void)[] = [];
    private unsubscribeFirestore: (() => void) | null = null;

    constructor() {
        // Initialize Firestore subscription
        this.unsubscribeFirestore = subscribeToItems<OTAChannel>(
            'ota_connections',
            (fetchedChannels) => {
                this.channels = fetchedChannels;
                this.notify();
            }
        );
    }

    subscribe(listener: (channels: OTAChannel[]) => void) {
        this.listeners.push(listener);
        listener(this.channels);
        return () => {
            this.listeners = this.listeners.filter(l => l !== listener);
        };
    }

    private notify() {
        this.listeners.forEach(l => l([...this.channels]));
    }

    async addConnection(channelData: Omit<OTAChannel, 'id'>) {
        console.log(`[ChannelManager] Adding new connection: ${channelData.name}`);
        await addItem('ota_connections', channelData);
    }

    async updateConnectionStatus(id: string, status: string, lastSync?: number) {
        const updateData: any = { status };
        if (lastSync) updateData.lastSync = lastSync;
        await updateItem('ota_connections', id, updateData);
    }

    async syncAvailability(roomTypeId: string, count: number) {
        console.log(`[ChannelManager] Syncing availability for ${roomTypeId}: ${count}`);

        for (const channel of this.channels.filter(c => c.status === 'Connected')) {
            // Update Firestore to 'Syncing'
            await this.updateConnectionStatus(channel.id, 'Syncing');

            // Simulate the network push
            await otaAdapter.pushAvailability(channel.id, roomTypeId, count);

            // Back to connected
            await this.updateConnectionStatus(channel.id, 'Connected', Date.now());
        }
    }

    /**
     * Simulates an incoming webhook from an OTA.
     */
    async simulateIncomingReservation(payload: OTAReservationPayload) {
        console.log(`[ChannelManager] Incoming reservation from ${payload.channelId}`);

        const reservation = otaAdapter.translatePayloadToReservation(payload);

        // Persist to local "PMS"
        await addItem('reservations', reservation);

        // Update channel sync time in Firestore
        const channel = this.channels.find(c => c.id === payload.channelId || c.name.toLowerCase().includes(payload.channelId.toLowerCase()));
        if (channel) {
            await this.updateConnectionStatus(channel.id, channel.status, Date.now());
        }

        return reservation;
    }

    getChannels() {
        return [...this.channels];
    }
}

export const channelManager = new ChannelManager();
export default ChannelManager;
