import { Reservation, ReservationJournalEntry, ReservationNote, ReservationStatus } from '../../types';

export type ReservationEventType = ReservationJournalEntry['eventType'];

interface JournalEntryInput {
    action: string;
    actor: string;
    message: string;
    eventType: ReservationEventType;
    timestamp?: string;
    metadata?: Record<string, string | number | boolean | null>;
}

interface NoteInput {
    text: string;
    createdBy: string;
    visibility: ReservationNote['visibility'];
    category?: ReservationNote['category'];
    pinned?: boolean;
}

const createId = (prefix: string) =>
    `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

const toIso = (value?: string) => {
    if (!value) return new Date().toISOString();
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return new Date().toISOString();
    return parsed.toISOString();
};

export const appendReservationJournalEntry = (
    reservation: Reservation,
    input: JournalEntryInput
): Pick<Reservation, 'journal' | 'history'> => {
    const timestamp = toIso(input.timestamp);
    const journalEntry: ReservationJournalEntry = {
        id: createId('jrnl'),
        timestamp,
        action: input.action,
        actor: input.actor,
        message: input.message,
        eventType: input.eventType,
        metadata: input.metadata
    };

    const historyEntry = {
        date: timestamp,
        action: input.action,
        user: input.actor,
        details: input.message
    };

    return {
        journal: [...(reservation.journal || []), journalEntry],
        history: [...(reservation.history || []), historyEntry]
    };
};

export const buildReservationStatusPatch = (
    reservation: Reservation,
    nextStatus: ReservationStatus,
    actor: string,
    message?: string
): Partial<Reservation> => {
    const statusLabel = nextStatus === ReservationStatus.CHECKED_IN
        ? 'Checked In'
        : nextStatus === ReservationStatus.CHECKED_OUT
            ? 'Checked Out'
            : `${nextStatus}`;

    const log = appendReservationJournalEntry(reservation, {
        action: `Status: ${statusLabel}`,
        actor,
        message: message || `Reservation moved to ${statusLabel}.`,
        eventType: nextStatus === ReservationStatus.CHECKED_IN
            ? 'check_in'
            : nextStatus === ReservationStatus.CHECKED_OUT
                ? 'check_out'
                : 'status_changed',
        metadata: {
            from: String(reservation.status || ''),
            to: String(nextStatus)
        }
    });

    return {
        status: nextStatus,
        ...log
    };
};

export const buildReservationNotePatch = (
    reservation: Reservation,
    input: NoteInput
): Partial<Reservation> => {
    const trimmed = (input.text || '').trim();
    if (!trimmed) return {};

    const note: ReservationNote = {
        id: createId('note'),
        createdAt: new Date().toISOString(),
        createdBy: input.createdBy,
        text: trimmed,
        visibility: input.visibility,
        category: input.category || 'General',
        pinned: !!input.pinned
    };

    const log = appendReservationJournalEntry(reservation, {
        action: 'Note Added',
        actor: input.createdBy,
        message: `${note.category || 'General'} note added (${note.visibility}).`,
        eventType: 'note_added',
        metadata: {
            visibility: note.visibility,
            category: note.category || 'General',
            pinned: !!note.pinned
        }
    });

    return {
        notes: [note, ...(reservation.notes || [])],
        ...log
    };
};
