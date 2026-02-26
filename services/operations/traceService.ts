import { Reservation, Trace, ReservationAlert } from '../../types';
import { updateItem } from '../kernel/firestoreService';

/**
 * Trace Service
 * Handles advanced communication between departments regarding reservations.
 */
class TraceService {
    async addTrace(resId: string, department: string, text: string, currentReservation: Reservation): Promise<void> {
        const newTrace: Trace = {
            id: `trc_${Date.now()}`,
            department,
            date: new Date().toISOString(),
            text,
            status: 'Pending'
        };

        const traces = currentReservation.traces || [];

        await updateItem('reservations', resId, {
            traces: [...traces, newTrace]
        });
    }

    async resolveTrace(resId: string, traceId: string, currentReservation: Reservation): Promise<void> {
        const traces = currentReservation.traces || [];
        const updatedTraces = traces.map(t =>
            t.id === traceId ? { ...t, status: 'Resolved' } : t
        );

        await updateItem('reservations', resId, {
            traces: updatedTraces
        });
    }

    async addAlert(resId: string, type: 'Check-In' | 'Check-Out' | 'In-House', severity: 'High' | 'Medium' | 'Low', message: string, currentReservation: Reservation): Promise<void> {
        const newAlert: ReservationAlert = {
            id: `alt_${Date.now()}`,
            type,
            severity,
            message,
            isActive: true
        };

        const alerts = currentReservation.alerts || [];

        await updateItem('reservations', resId, {
            alerts: [...alerts, newAlert]
        });
    }

    async clearAlert(resId: string, alertId: string, currentReservation: Reservation): Promise<void> {
        const alerts = currentReservation.alerts || [];
        const updatedAlerts = alerts.map(a =>
            a.id === alertId ? { ...a, isActive: false } : a
        );

        await updateItem('reservations', resId, {
            alerts: updatedAlerts
        });
    }
}

export const traceService = new TraceService();
