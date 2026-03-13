import React, { useMemo } from 'react';
import { Users } from 'lucide-react';
import { usePms } from '../../services/kernel/persistence';
import { ReservationStatus } from '../../types';

const GuestsView: React.FC = () => {
  const { rooms, reservations, guests, loading, error } = usePms();

  const inHouse = useMemo(() => {
    const today = new Date().toDateString();
    return reservations.filter((r) => r.status === ReservationStatus.CHECKED_IN);
  }, [reservations]);

  const departuresToday = useMemo(() => {
    const today = new Date().toDateString();
    return reservations.filter(
      (r) =>
        r.status === ReservationStatus.CHECKED_IN &&
        new Date(r.checkOut).toDateString() === today
    ).length;
  }, [reservations]);

  const guestRows = useMemo(() => {
    return inHouse.map((r) => {
      const guest = guests.find((g) => g.principal === r.guestId);
      const room = rooms.find((ro) => ro.id === r.roomId);
      return {
        id: r.id,
        name: guest?.fullName ?? r.guestId,
        room: room?.number ?? r.roomId ?? '—',
        checkout: r.checkOut,
      };
    });
  }, [inHouse, guests, rooms]);

  if (loading) {
    return (
      <div className="page-view">
        <div className="content-card content-card--full" style={{ textAlign: 'center', padding: '2rem' }}>
          <p className="content-card__label">Loading guests…</p>
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
      <div className="stat-grid">
        <div className="stat-card">
          <div className="stat-card__icon">
            <Users size={20} />
          </div>
          <div className="stat-card__content">
            <div className="stat-card__value">{inHouse.length}</div>
            <div className="stat-card__label">In House</div>
            <div className="stat-card__trend">
              {departuresToday > 0 ? `${departuresToday} departures today` : 'No departures today'}
            </div>
          </div>
        </div>
      </div>

      <div className="content-card content-card--full">
        <h3 className="content-card__title">Current Guests</h3>
        <div className="content-card__list">
          {guestRows.length === 0 ? (
            <div className="content-card__list-item content-card__list-item--stacked">
              <span className="content-card__list-meta">No guests in house</span>
            </div>
          ) : (
            guestRows.map((g) => (
              <div key={g.id} className="content-card__list-item content-card__list-item--stacked">
                <div>
                  <span className="content-card__list-name">{g.name}</span>
                  <span className="content-card__list-meta">
                    Room {g.room} · Out {g.checkout ? new Date(g.checkout).toLocaleDateString() : '—'}
                  </span>
                </div>
                <span className="content-card__badge">In House</span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default GuestsView;
