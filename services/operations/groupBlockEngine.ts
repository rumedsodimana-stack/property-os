/**
 * Group Block Management Engine
 * Handles group reservations, rooming lists, pickup tracking, and master billing
 */

import { differenceInDays } from 'date-fns';
import { getCollectionRef } from '../kernel/firestoreService';
import { Timestamp, doc, setDoc, getDoc, getDocs, updateDoc, query, where } from 'firebase/firestore';

// Types
export interface GroupBlock {
    id: string;
    blockCode: string;              // "TECH2026"
    groupName: string;
    company: CompanyInfo;
    status: 'tentative' | 'definite' | 'actual' | 'cancelled';

    dates: {
        arrivalDate: Date;
        departureDate: Date;
        cutoffDate: Date;
        releaseDate?: Date;
    };

    roomBlocks: RoomBlock[];

    rateInfo: {
        rateCode: string;
        rateOverride?: number;
        commissionable: boolean;
        commissionPercentage?: number;
    };

    billing: {
        masterBilling: boolean;
        directBilling: boolean;
        creditLimit?: number;
    };

    contacts: Contact[];
    specialRequests?: string;

    stats: {
        totalRoomsBlocked: number;
        roomsPickedUp: number;
        roomsAvailable: number;
        pickupPercentage: number;
    };

    createdAt: Date;
    updatedAt: Date;
}

export interface RoomBlock {
    roomType: string;
    quantity: number;
    pickedUp: number;
    available: number;
}

export interface CompanyInfo {
    name: string;
    contactEmail: string;
    contactPhone?: string;
    billingAddress?: Address;
}

export interface Contact {
    name: string;
    email: string;
    phone?: string;
    role: string;
}

export interface Address {
    line1: string;
    line2?: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
}

export interface ImportResult {
    processed: number;
    created: number;
    errors: Array<{
        line: number;
        data: any;
        error: string;
    }>;
}

export interface PickupReport {
    blockId: string;
    blockCode: string;
    totalBlocked: number;
    totalPickedUp: number;
    totalAvailable: number;
    pickupPercentage: number;
    daysUntilCutoff: number;
    trend: 'ahead' | 'on_pace' | 'behind';
    byRoomType: Array<{
        roomType: string;
        blocked: number;
        pickedUp: number;
        available: number;
        pickupPercentage: number;
    }>;
    dailyPickup?: Array<{
        date: Date;
        count: number;
    }>;
}

/**
 * Group Block Management Engine
 */
export class GroupBlockEngine {
    constructor() {
        // initialization
    }

    private toDate(value: any): Date {
        if (value instanceof Date) return value;
        if (value instanceof Timestamp) return value.toDate();
        const parsed = new Date(value);
        return Number.isNaN(parsed.getTime()) ? new Date() : parsed;
    }

    private hydrateBlock(raw: any): GroupBlock {
        const roomBlocks = (raw?.roomBlocks ?? []).map((rb: any) => ({
            roomType: rb.roomType,
            quantity: Number(rb.quantity ?? 0),
            pickedUp: Number(rb.pickedUp ?? 0),
            available: Number(rb.available ?? rb.quantity ?? 0)
        }));

        const totalRoomsBlocked = roomBlocks.reduce((sum: number, rb: RoomBlock) => sum + rb.quantity, 0);
        const roomsPickedUp = roomBlocks.reduce((sum: number, rb: RoomBlock) => sum + rb.pickedUp, 0);

        return {
            ...raw,
            id: raw.id ?? raw.blockId ?? this.generateId(),
            dates: {
                arrivalDate: this.toDate(raw?.dates?.arrivalDate),
                departureDate: this.toDate(raw?.dates?.departureDate),
                cutoffDate: this.toDate(raw?.dates?.cutoffDate),
                releaseDate: raw?.dates?.releaseDate ? this.toDate(raw.dates.releaseDate) : undefined
            },
            roomBlocks,
            stats: {
                totalRoomsBlocked: totalRoomsBlocked || raw?.stats?.totalRoomsBlocked || 0,
                roomsPickedUp: roomsPickedUp || raw?.stats?.roomsPickedUp || 0,
                roomsAvailable: raw?.stats?.roomsAvailable ?? (totalRoomsBlocked - roomsPickedUp),
                pickupPercentage: raw?.stats?.pickupPercentage ?? (totalRoomsBlocked ? (roomsPickedUp / totalRoomsBlocked) * 100 : 0)
            }
        };
    }

    /**
     * Create a new group block
     */
    async createBlock(data: {
        groupName: string;
        company: CompanyInfo;
        dates: GroupBlock['dates'];
        roomBlocks: Array<{ roomType: string; quantity: number }>;
        rateInfo: GroupBlock['rateInfo'];
        billing: GroupBlock['billing'];
        contacts: Contact[];
        specialRequests?: string;
    }): Promise<GroupBlock> {
        console.log(`📋 Creating group block: ${data.groupName}`);

        // Generate unique block code
        const blockCode = this.generateBlockCode(data.groupName);

        // Create room blocks
        const roomBlocks: RoomBlock[] = data.roomBlocks.map(rb => ({
            roomType: rb.roomType,
            quantity: rb.quantity,
            pickedUp: 0,
            available: rb.quantity
        }));

        const block: GroupBlock = {
            id: this.generateId(),
            blockCode,
            groupName: data.groupName,
            company: data.company,
            status: 'tentative',
            dates: data.dates,
            roomBlocks,
            rateInfo: data.rateInfo,
            billing: data.billing,
            contacts: data.contacts,
            specialRequests: data.specialRequests,
            stats: {
                totalRoomsBlocked: roomBlocks.reduce((sum, rb) => sum + rb.quantity, 0),
                roomsPickedUp: 0,
                roomsAvailable: roomBlocks.reduce((sum, rb) => sum + rb.quantity, 0),
                pickupPercentage: 0
            },
            createdAt: new Date(),
            updatedAt: new Date()
        };

        // Save to database
        await setDoc(doc(getCollectionRef('groupBlocks'), block.id), block);

        // Reserve inventory
        await this.reserveInventory(block);

        console.log(`✅ Created block ${blockCode} for ${block.stats.totalRoomsBlocked} rooms`);

        return block;
    }

    /**
     * Import rooming list from CSV
     */
    async importRoomingList(
        blockId: string,
        csvData: string
    ): Promise<ImportResult> {
        console.log(' 📥 Importing rooming list...');

        const block = await this.getBlock(blockId);
        if (!block) {
            throw new Error('Block not found');
        }

        // Parse CSV
        const rows = this.parseCSV(csvData);

        const results: ImportResult = {
            processed: 0,
            created: 0,
            errors: []
        };

        for (const row of rows) {
            results.processed++;

            try {
                // Validate row
                this.validateRoomingListRow(row);

                const arrivalDate = row.arrivalDate ? this.toDate(row.arrivalDate) : block.dates.arrivalDate;
                const departureDate = row.departureDate ? this.toDate(row.departureDate) : block.dates.departureDate;

                // Create or find guest
                let guest = await this.findOrCreateGuest({
                    firstName: row.firstName,
                    lastName: row.lastName,
                    email: row.email,
                    phone: row.phone
                });

                // Create reservation
                const reservation = {
                    id: this.generateId(),
                    guestId: guest.id,
                    confirmationNumber: this.generateConfirmation(),
                    arrivalDate,
                    departureDate,
                    adults: Number(row.adults || 2),
                    children: Number(row.children || 0),
                    roomType: row.roomType.trim(),
                    rateCode: block.rateInfo.rateCode,
                    rateAmount: row.rateAmount ? Number(row.rateAmount) : block.rateInfo.rateOverride,
                    status: 'confirmed',
                    groupBlockId: blockId,
                    specialRequests: row.specialRequests,
                    createdAt: new Date()
                };

                await setDoc(doc(getCollectionRef('reservations'), reservation.id), reservation);

                // Update block pickup
                await this.updateBlockPickup(blockId, row.roomType, 1);

                results.created++;

            } catch (error) {
                results.errors.push({
                    line: results.processed,
                    data: row,
                    error: error.message
                });
            }
        }

        console.log(`✅ Imported ${results.created}/${results.processed} reservations`);

        return results;
    }

    /**
     * Get pickup report
     */
    async getPickupReport(blockId: string): Promise<PickupReport> {
        const block = await this.getBlock(blockId);
        if (!block) {
            throw new Error('Block not found');
        }

        // Get reservations for this block
        const q = query(
            getCollectionRef('reservations'),
            where('groupBlockId', '==', blockId),
            where('status', 'in', ['confirmed', 'checked_in'])
        );
        const reservations = await getDocs(q);

        const today = new Date();
        const daysUntilCutoff = differenceInDays(block.dates.cutoffDate, today);

        // Calculate pickup by room type
        const byRoomType = block.roomBlocks.map(rb => {
            const pickedUp = reservations.docs.filter(
                (doc: any) => doc.data().roomType === rb.roomType
            ).length;

            return {
                roomType: rb.roomType,
                blocked: rb.quantity,
                pickedUp,
                available: rb.quantity - pickedUp,
                pickupPercentage: rb.quantity ? (pickedUp / rb.quantity) * 100 : 0
            };
        });

        const totalPickedUp = reservations.docs.length;
        const totalBlocked = block.stats.totalRoomsBlocked || 1;
        const pickupPercentage = (totalPickedUp / totalBlocked) * 100;

        // Determine trend
        const expectedPickup = this.calculateExpectedPickup(
            block.stats.totalRoomsBlocked,
            daysUntilCutoff
        );

        let trend: 'ahead' | 'on_pace' | 'behind';
        if (pickupPercentage > expectedPickup + 10) {
            trend = 'ahead';
        } else if (pickupPercentage < expectedPickup - 10) {
            trend = 'behind';
        } else {
            trend = 'on_pace';
        }

        return {
            blockId,
            blockCode: block.blockCode,
            totalBlocked: block.stats.totalRoomsBlocked,
            totalPickedUp,
            totalAvailable: block.stats.totalRoomsBlocked - totalPickedUp,
            pickupPercentage,
            daysUntilCutoff,
            trend,
            byRoomType
        };
    }

    /**
     * Process cutoff date - release unpicked rooms
     */
    async processCutoffDate(blockId: string): Promise<void> {
        const block = await this.getBlock(blockId);
        if (!block) {
            throw new Error('Block not found');
        }

        const today = new Date();

        if (today < block.dates.cutoffDate) {
            console.log(`Cutoff date not reached for ${block.blockCode}`);
            return;
        }

        console.log(`🔓 Processing cutoff for block ${block.blockCode}`);

        // Calculate rooms to release
        const roomsToRelease = block.roomBlocks.map(rb => ({
            roomType: rb.roomType,
            quantity: rb.available
        }));

        // Release inventory
        for (const release of roomsToRelease) {
            if (release.quantity > 0) {
                await this.releaseInventory(blockId, release.roomType, release.quantity);
            }
        }

        // Update block status
        await updateDoc(doc(getCollectionRef('groupBlocks'), blockId), {
            status: 'actual',
            'dates.releaseDate': today.toISOString(),
            updatedAt: new Date().toISOString()
        });

        // Notify contacts
        await this.sendCutoffNotification(block);

        console.log(`✅ Released ${roomsToRelease.reduce((sum, r) => sum + r.quantity, 0)} rooms`);
    }

    /**
     * Create master folio for group billing
     */
    async createMasterFolio(blockId: string): Promise<any> {
        const block = await this.getBlock(blockId);
        if (!block) {
            throw new Error('Block not found');
        }

        const masterFolio = {
            id: this.generateId(),
            type: 'master',
            groupBlockId: blockId,
            name: `Master - ${block.groupName}`,
            balance: 0,
            status: 'open',
            createdAt: new Date()
        };

        await setDoc(doc(getCollectionRef('folios'), masterFolio.id), masterFolio);

        console.log(`✅ Created master folio for ${block.blockCode}`);

        return masterFolio;
    }

    // Helper methods

    private async getBlock(blockId: string): Promise<GroupBlock | null> {
        const docSnap = await getDoc(doc(getCollectionRef('groupBlocks'), blockId));
        return docSnap.exists() ? this.hydrateBlock({ id: docSnap.id, ...docSnap.data() }) : null;
    }

    private generateBlockCode(groupName: string): string {
        const consonants = groupName.replace(/[aeiou\s]/gi, '').toUpperCase();
        const year = new Date().getFullYear().toString().slice(-2);
        return (consonants.slice(0, 4) + year).padEnd(6, 'X');
    }

    private generateId(): string {
        return `block_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    }

    private generateConfirmation(): string {
        return `CONF-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
    }

    private parseCSV(csvData: string): any[] {
        const lines = csvData.trim().split(/\r?\n/).filter(Boolean);
        if (!lines.length) return [];
        const headers = lines[0].split(',').map(h => h.trim());

        return lines
            .slice(1)
            .filter(Boolean)
            .map(line => {
                const values = line.split(',').map(v => v.trim());
                const row: any = {};
                headers.forEach((header, i) => {
                    row[header] = values[i];
                });
                return row;
            });
    }

    private validateRoomingListRow(row: any): void {
        if (!row.firstName || !row.lastName) {
            throw new Error('Missing guest name');
        }
        if (!row.roomType) {
            throw new Error('Missing room type');
        }
    }

    private async findOrCreateGuest(guestData: any): Promise<any> {
        // Search for existing guest
        const q = query(getCollectionRef('guests'), where('email', '==', guestData.email));
        const existing = await getDocs(q);

        if (!existing.empty) {
            return { id: existing.docs[0].id, ...existing.docs[0].data() };
        }

        // Create new guest
        const guest = {
            id: this.generateId(),
            ...guestData,
            createdAt: new Date()
        };

        await setDoc(doc(getCollectionRef('guests'), guest.id), guest);

        return guest;
    }

    private async updateBlockPickup(blockId: string, roomType: string, increment: number): Promise<void> {
        const block = await this.getBlock(blockId);
        if (!block) return;

        const roomBlock = block.roomBlocks.find(rb => rb.roomType === roomType);
        if (!roomBlock) return;

        roomBlock.pickedUp += increment;
        roomBlock.available = roomBlock.quantity - roomBlock.pickedUp;

        // Update stats
        block.stats.roomsPickedUp += increment;
        const totalBlocked = block.stats.totalRoomsBlocked || roomBlock.quantity || 1;
        block.stats.roomsAvailable = totalBlocked - block.stats.roomsPickedUp;
        block.stats.pickupPercentage = (block.stats.roomsPickedUp / totalBlocked) * 100;

        await updateDoc(doc(getCollectionRef('groupBlocks'), blockId), {
            roomBlocks: block.roomBlocks,
            stats: block.stats,
            updatedAt: new Date().toISOString()
        });
    }

    private async reserveInventory(block: GroupBlock): Promise<void> {
        // Reserve inventory in the system
        console.log('Reserved inventory for block');
    }

    private async releaseInventory(blockId: string, roomType: string, quantity: number): Promise<void> {
        // Release inventory back to general pool
        console.log(`Released ${quantity} ${roomType} rooms from block ${blockId}`);
    }

    private calculateExpectedPickup(totalRooms: number, daysUntilCutoff: number): number {
        if (totalRooms <= 0) return 0;
        // Simple linear expectation - adjust based on historical data
        if (daysUntilCutoff <= 0) return 100;
        if (daysUntilCutoff >= 90) return 10;

        return Math.min(100, Math.max(0, 100 - (daysUntilCutoff / 90) * 90));
    }

    private async sendCutoffNotification(block: GroupBlock): Promise<void> {
        console.log(`📧 Sending cutoff notification for ${block.blockCode}`);
    }
}

export default GroupBlockEngine;
