import React, { useMemo } from 'react';
import { BedDouble, Circle } from 'lucide-react';
import { usePms } from '../../services/kernel/persistence';
import { ROOM_TYPES } from '../../services/kernel/config';

const statusColor: Record<string, string> = {
  Occupied: 'var(--theme-accent)',
  'Clean/Ready': '#22c55e',
  'Dirty/Departure': '#f59e0b',
  'Dirty/Stayover': '#f59e0b',
  'Minibar/Pending': '#94a3b8',
  Maintenance: '#ef4444',
};

const RoomsView: React.FC = () => {
  const { rooms, reservations, guests, loading, error } = usePms();

  const rows = useMemo(() => {
    return rooms.map((r) => {
      const type = ROOM_TYPES.find((rt) => rt.id === r.typeId);
      const res = r.assignedReservationId
        ? reservations.find((rev) => rev.id === r.assignedReservationId)
        : null;
      const guest = res ? guests.find((g) => g.principal === res.guestId) : null;
      return {
        id: r.id,
        number: r.number,
        type: type?.name ?? r.typeId,
        status: r.status as string,
        guest: guest?.fullName ?? null,
      };
    });
  }, [rooms, reservations, guests]);

  if (loading) {
    return (
      <div className="page-view">
        <div className="content-card content-card--full" style={{ textAlign: 'center', padding: '2rem' }}>
          <p className="content-card__label">Loading rooms…</p>
        </div>
      </div>
    );
  }
  if (error) {
    return (
      <div className="page-view">
        <div className="content-card content-card--full" style={{ textAlign: 'center', padding: '2rem', color: 'var(--theme-accent)' }}>
          <p className="content-card__label">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page-view">
      <div className="content-card content-card--full">
        <h3 className="content-card__title">Room Status</h3>
        <div className="data-table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Room</th>
                <th>Type</th>
                <th>Status</th>
                <th>Guest</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={4} className="data-table__muted" style={{ textAlign: 'center', padding: '1.5rem' }}>
                    No rooms in database
                  </td>
                </tr>
              ) : (
                rows.map((r) => (
                  <tr key={r.id}>
                    <td>
                      <span className="data-table__room">
                        <BedDouble size={14} /> {r.number}
                      </span>
                    </td>
                    <td>{r.type}</td>
                    <td>
                      <span
                        className="data-table__status"
                        style={{ color: statusColor[r.status] ?? 'var(--theme-text-muted)' }}
                      >
                        <Circle size={8} fill="currentColor" /> {r.status}
                      </span>
                    </td>
                    <td className="data-table__muted">{r.guest ?? '—'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default RoomsView;
