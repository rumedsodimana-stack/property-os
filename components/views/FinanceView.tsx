import React, { useMemo } from 'react';
import { Wallet, TrendingUp, ArrowUpRight } from 'lucide-react';
import { usePms } from '../../services/kernel/persistence';
import { CURRENT_PROPERTY } from '../../services/kernel/config';

const FinanceView: React.FC = () => {
  const { folios, posOrders, ledgerEntries, loading, error } = usePms();

  const stats = useMemo(() => {
    const totalRevenue = folios.reduce(
      (sum, f) =>
        sum +
        f.charges.reduce((c, ch) => c + ch.amount, 0),
      0
    );
    const totalBalance = folios.reduce((sum, f) => sum + f.balance, 0);

    const todayStr = new Date().toISOString().slice(0, 10);
    const todayRevenue = ledgerEntries
      .filter((e) => e.businessDate === todayStr && (e.credit > 0 || (e.amount && e.amount > 0)))
      .reduce((sum, e) => sum + (e.credit || e.amount || 0), 0);

    return { totalRevenue, totalBalance, todayRevenue };
  }, [folios, ledgerEntries]);

  const transactions = useMemo(() => {
    const items: { desc: string; amt: number; time: string; ts: number }[] = [];
    folios.forEach((f) => {
      f.charges.slice(-3).forEach((ch) => {
        items.push({
          desc: ch.description,
          amt: ch.amount,
          time: new Date(ch.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          ts: ch.timestamp,
        });
      });
    });
    posOrders.forEach((o) => {
      items.push({
        desc: `POS ${o.outletId} #${o.id.slice(-4)}`,
        amt: o.total,
        time: new Date(o.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        ts: o.timestamp,
      });
    });
    return items
      .sort((a, b) => b.ts - a.ts)
      .slice(0, 10);
  }, [folios, posOrders]);

  const currency = CURRENT_PROPERTY.currency ?? 'BHD';
  const fmt = (n: number) =>
    n >= 1000 ? `${currency} ${(n / 1000).toFixed(1)}K` : `${currency} ${Math.round(n)}`;

  if (loading) {
    return (
      <div className="page-view">
        <div className="content-card content-card--full" style={{ textAlign: 'center', padding: '2rem' }}>
          <p className="content-card__label">Loading finance data…</p>
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
            <Wallet size={20} />
          </div>
          <div className="stat-card__content">
            <div className="stat-card__value">{fmt(stats.totalRevenue + stats.totalBalance)}</div>
            <div className="stat-card__label">Total Revenue</div>
            <div className="stat-card__trend">From folios & charges</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-card__icon">
            <TrendingUp size={20} />
          </div>
          <div className="stat-card__content">
            <div className="stat-card__value">{fmt(stats.todayRevenue)}</div>
            <div className="stat-card__label">Today (Ledger)</div>
            <div className="stat-card__trend">
              <ArrowUpRight size={12} /> Live
            </div>
          </div>
        </div>
      </div>

      <div className="content-grid">
        <div className="content-card content-card--wide">
          <h3 className="content-card__title">Revenue by Source</h3>
          <div className="content-card__placeholder">
            <Wallet size={32} />
            <p>
              {folios.length} folios · {posOrders.length} POS orders
            </p>
          </div>
        </div>
        <div className="content-card">
          <h3 className="content-card__title">Recent Transactions</h3>
          <div className="content-card__list">
            {transactions.length === 0 ? (
              <div className="content-card__list-item">
                <span className="content-card__list-meta">No recent transactions</span>
              </div>
            ) : (
              transactions.map((t, i) => (
                <div key={i} className="content-card__list-item">
                  <span>{t.desc}</span>
                  <span className="content-card__badge">{fmt(t.amt)}</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default FinanceView;
