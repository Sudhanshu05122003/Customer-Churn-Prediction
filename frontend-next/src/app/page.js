'use client';
import { useState, useEffect } from 'react';
import { churnApi } from '@/lib/api';
import { TrendingUp, Users, AlertTriangle, ShieldCheck, Activity, BarChart3 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area, CartesianGrid } from 'recharts';
import styles from './dashboard.module.css';

const RISK_COLORS = {
  Critical: '#ef4444',
  High: '#f59e0b',
  Medium: '#6366f1',
  Low: '#10b981',
};

const STAT_ICONS = {
  total: Users,
  churn: AlertTriangle,
  stay: ShieldCheck,
  rate: TrendingUp,
};

export default function DashboardPage() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    churnApi.getStats()
      .then(setStats)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className={styles.loadingWrap}>
        <div className={styles.pulse} />
        <p>Loading dashboard…</p>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className={styles.emptyState}>
        <Activity size={48} strokeWidth={1.5} />
        <h2>No Data Yet</h2>
        <p>Make some predictions to populate the dashboard.</p>
      </div>
    );
  }

  const statCards = [
    { key: 'total', label: 'Total Predictions', value: stats.total_predictions, icon: 'total', color: '#6366f1' },
    { key: 'churn', label: 'Churn Detected', value: stats.churn_count, icon: 'churn', color: '#ef4444' },
    { key: 'stay', label: 'Retained', value: stats.stay_count, icon: 'stay', color: '#10b981' },
    { key: 'rate', label: 'Churn Rate', value: `${stats.churn_pct}%`, icon: 'rate', color: '#f59e0b' },
  ];

  const trendData = (stats.trend || []).reverse().map(t => ({
    date: t.date?.slice(5) || '',
    Churns: t.churns,
    Retained: t.stays,
  }));

  const riskData = (stats.risk_distribution || []).map(r => ({
    name: r.risk_level,
    value: r.count,
    fill: RISK_COLORS[r.risk_level] || '#6366f1',
  }));

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.heading}>Dashboard</h1>
          <p className={styles.subheading}>Customer churn analytics overview</p>
        </div>
      </div>

      {/* Stat Cards — Bento Grid */}
      <div className={styles.statsGrid}>
        {statCards.map((card) => {
          const Icon = STAT_ICONS[card.icon];
          return (
            <div key={card.key} className={styles.statCard}>
              <div className={styles.statIconWrap} style={{ background: `${card.color}18` }}>
                <Icon size={22} style={{ color: card.color }} />
              </div>
              <div className={styles.statInfo}>
                <span className={styles.statLabel}>{card.label}</span>
                <span className={styles.statValue}>{card.value}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Charts Row */}
      <div className={styles.chartsGrid}>
        {/* Trend Chart */}
        <div className={`${styles.chartCard} ${styles.chartWide}`}>
          <div className={styles.chartHeader}>
            <BarChart3 size={20} />
            <h3>7-Day Trend</h3>
          </div>
          {trendData.length > 0 ? (
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={trendData}>
                <defs>
                  <linearGradient id="gradChurn" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gradRetain" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="date" tick={{ fill: '#94a3b8', fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#94a3b8', fontSize: 12 }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip
                  contentStyle={{ background: 'rgba(15,23,42,0.9)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, color: '#fff' }}
                />
                <Area type="monotone" dataKey="Churns" stroke="#ef4444" fillOpacity={1} fill="url(#gradChurn)" strokeWidth={2} />
                <Area type="monotone" dataKey="Retained" stroke="#10b981" fillOpacity={1} fill="url(#gradRetain)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <p className={styles.noData}>Not enough data for trend chart.</p>
          )}
        </div>

        {/* Risk Distribution Pie */}
        <div className={styles.chartCard}>
          <div className={styles.chartHeader}>
            <AlertTriangle size={20} />
            <h3>Risk Distribution</h3>
          </div>
          {riskData.length > 0 ? (
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie
                  data={riskData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={95}
                  paddingAngle={4}
                  dataKey="value"
                  stroke="none"
                >
                  {riskData.map((entry, i) => (
                    <Cell key={i} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ background: 'rgba(15,23,42,0.9)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, color: '#fff' }}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <p className={styles.noData}>No risk data available.</p>
          )}
          <div className={styles.legendWrap}>
            {riskData.map((r) => (
              <div key={r.name} className={styles.legendItem}>
                <span className={styles.legendDot} style={{ background: r.fill }} />
                <span>{r.name}</span>
                <span className={styles.legendCount}>{r.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
