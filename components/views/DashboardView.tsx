import React, { useMemo } from 'react';
import { Activity, TrendingUp, Calendar } from 'lucide-react';
import { usePms } from '../../services/kernel/persistence';
import { ReservationStatus } from '../../types';
import { ROOM_TYPES } from '../../services/kernel/config';

const DashboardView: React.FC = () => {
  const { rooms, reservations, guests, folios, loading, error } = usePms();

  const stats = useMemo(() => {
    const totalRooms = rooms.length;
    const occupied = rooms.filter((r) => r.status === 'Occupied').length;
    const occupancyPct = totalRooms > 0 ? Math.round((occupied / totalRooms) * 100) : 0;

    const revenueTotal = folios.reduce(
      (sum, f) => sum + f.charges.reduce((c, ch) => c + ch.amount, 0),
      0
    );

    const today = new Date().toDateString();
    const arrivals = reservations.filter(
      (r) => r.status === ReservationStatus.CONFIRMED && new Date(r.checkIn).toDateString() === today
    );

    return {
      occupancy: occupancyPct,
      revenue: revenueTotal,
      arrivalsCount: arrivals.length,
    };
  }, [rooms, folios, reservations]);

  const occupancyHistory = useMemo(() => {
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Today'];
    const today = new Date();
    return days.map((label, i) => {
      const d = new Date(today);
      d.setDate(d.getDate() - (6 - i));
      const dayStart = d.toDateString();
      const occupied = reservations.filter(
        (r) =>
          r.status === ReservationStatus.CHECKED_IN &&
          new Date(r.checkIn).toDateString() <= dayStart &&
          new Date(r.checkOut).toDateString() > dayStart
      ).length;
      const pct = rooms.length > 0 ? Math.round((occupied / rooms.length) * 100) : 0;
      return { label, pct };
    });
  }, [rooms, reservations]);

  const arrivals = useMemo(() => {
    const today = new Date().toDateString();
    return reservations
      .filter(
        (r) => r.status === ReservationStatus.CONFIRMED && new Date(r.checkIn).toDateString() === today
      )
      .slice(0, 10)
      .map((r) => {
        const guest = guests.find((g) => g.principal === r.guestId);
        const room = rooms.find((ro) => ro.id === r.roomId);
        return {
          room: room?.number ?? r.roomId ?? '—',
          name: guest?.fullName ?? r.guestId,
          checkIn: r.checkIn,
        };
      });
  }, [reservations, guests, rooms]);

  const currency = 'BHD';
  const fmt = (n: number) => (n >= 1000 ? `${(n / 1000).toFixed(1)}K` : String(Math.round(n)));

  if (loading) {
    return (
      <div className="page-view">
        <div className="content-card content-card--full" style={{ textAlign: 'center', padding: '2rem' }}>
          <p className="content-card__label">Loading database…</p>
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

  const STATS = [
    { label: 'Occupancy', value: `${stats.occupancy}%`, trend: 'Live', icon: Activity },
    { label: 'Revenue', value: `${currency} ${fmt(stats.revenue)}`, trend: 'Total', icon: TrendingUp },
    { label: 'Arrivals', value: String(stats.arrivalsCount), trend: 'Today', icon: Calendar },
  ];

  return (
    <>
      <div className="stat-grid">
        {STATS.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.label} className="stat-card">
              <div className="stat-card__icon">
                <Icon size={20} />
              </div>
              <div className="stat-card__content">
                <div className="stat-card__value">{stat.value}</div>
                <div className="stat-card__label">{stat.label}</div>
                <div className="stat-card__trend">{stat.trend}</div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="content-grid">
        <div className="content-card content-card--wide">
          <h3 className="content-card__title">Occupancy Overview</h3>
          <div className="content-card__chart">
            <div className="chart-bars">
              {occupancyHistory.map((d, i) => (
                <div key={i} className="chart-bar-wrap">
                  <div className="chart-bar" style={{ height: `${d.pct}%` }} />
                </div>
              ))}
            </div>
            <div className="chart-labels">
              {occupancyHistory.map((d) => (
                <span key={d.label}>{d.label}</span>
              ))}
            </div>
          </div>
        </div>
        <div className="content-card">
          <h3 className="content-card__title">Today&apos;s Arrivals</h3>
          <div className="content-card__list">
            {arrivals.length === 0 ? (
              <div className="content-card__list-item content-card__list-item--stacked">
                <span className="content-card__list-meta">No arrivals today</span>
              </div>
            ) : (
              arrivals.map((a) => (
                <div key={a.room + a.name} className="content-card__list-item">
                  <span>Room {a.room} · {a.name}</span>
                  <span className="content-card__badge">
                    {a.checkIn ? new Date(a.checkIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default DashboardView;
