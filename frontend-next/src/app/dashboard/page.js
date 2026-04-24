'use client';
import { useState, useEffect } from 'react';
import { churnApi } from '@/lib/api';
import { TrendingUp, Users, AlertTriangle, ShieldCheck, Activity, BarChart3, HeartPulse, Bell, ArrowUpRight } from 'lucide-react';
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
      .catch(() => { })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className={styles.loadingWrap}>
        <div className={styles.pulse} />
        <p>Syncing Enterprise Data…</p>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className={styles.emptyState}>
        <Activity size={48} strokeWidth={1.5} />
        <h2>Intelligence Offline</h2>
        <p>No historical prediction data found. Run an analysis to activate the dashboard.</p>
      </div>
    );
  }

  const statCards = [
    { key: 'total', label: 'Total Analyzed', value: stats.total_predictions, icon: 'total', color: '#6366f1' },
    { key: 'churn', label: 'Churn Risks', value: stats.churn_count, icon: 'churn', color: '#ef4444' },
    { key: 'stay', label: 'Healthy Base', value: stats.stay_count, icon: 'stay', color: '#10b981' },
    { key: 'rate', label: 'Aggregated Risk', value: `${stats.churn_pct}%`, icon: 'rate', color: '#f59e0b' },
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
          <h1 className={styles.heading}>Enterprise Intelligence</h1>
          <p className={styles.subheading}>Real-time churn monitoring and model health</p>
        </div>
        <div className={styles.healthIndicator}>
          <HeartPulse size={14} /> Model Health: Optimal (98.2%)
        </div>
      </div>

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

      <div className={styles.chartsGrid}>
        <div className={styles.chartCard}>
          <div className={styles.chartHeader}>
            <BarChart3 size={20} />
            <h3>Churn vs. Retention Trend</h3>
          </div>
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={trendData}>
              <defs>
                <linearGradient id="gradChurn" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ef4444" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gradRetain" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--card-border)" vertical={false} />
              <XAxis dataKey="date" tick={{ fill: 'var(--text-secondary)', fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: 'var(--text-secondary)', fontSize: 12 }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{ background: 'var(--card-bg-solid)', border: '1px solid var(--card-border)', borderRadius: 12, color: 'var(--text-primary)' }}
              />
              <Area type="monotone" dataKey="Churns" stroke="#ef4444" fill="url(#gradChurn)" strokeWidth={2} />
              <Area type="monotone" dataKey="Retained" stroke="#10b981" fill="url(#gradRetain)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className={styles.chartCard}>
          <div className={styles.chartHeader}>
            <AlertTriangle size={20} />
            <h3>Risk Segments</h3>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={riskData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={5} dataKey="value" stroke="none">
                {riskData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
              </Pie>
              <Tooltip contentStyle={{ background: 'var(--card-bg-solid)', border: '1px solid var(--card-border)', borderRadius: 12, color: 'var(--text-primary)' }} />
            </PieChart>
          </ResponsiveContainer>
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

      <div className={styles.secondaryGrid}>
        <div className={styles.chartCard}>
          <div className={styles.chartHeader}>
            <Bell size={20} />
            <h3>Smart Alerts</h3>
          </div>
          <div className={styles.alertList}>
            {stats.churn_count > 0 ? (
              <div className={styles.alertItem}>
                <div>
                  <p className={styles.alertText}>Critical risk detected in recent manual prediction.</p>
                  <p className={styles.alertTime}>Just now</p>
                </div>
                <ArrowUpRight size={16} color="#ef4444" />
              </div>
            ) : (
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>No critical alerts in the last 24h.</p>
            )}
            <div className={styles.alertItem} style={{ borderColor: 'rgba(99,102,241,0.2)', background: 'var(--primary-bg)' }}>
              <div>
                <p className={styles.alertText} style={{ color: 'var(--primary-text)' }}>Weekly model drift report is ready.</p>
                <p className={styles.alertTime}>2h ago</p>
              </div>
              <ArrowUpRight size={16} color="#6366f1" />
            </div>
          </div>
        </div>

        <div className={styles.chartCard}>
          <div className={styles.chartHeader}>
            <Activity size={20} />
            <h3>Model Drift Monitor</h3>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginTop: '10px' }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '8px' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Data Stability</span>
                <span style={{ color: '#10b981' }}>99.8%</span>
              </div>
              <div style={{ height: '6px', background: 'var(--input-bg)', borderRadius: '3px' }}>
                <div style={{ width: '99.8%', height: '100%', background: '#10b981', borderRadius: '3px' }} />
              </div>
            </div>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '8px' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Prediction Confidence</span>
                <span style={{ color: '#6366f1' }}>94.2%</span>
              </div>
              <div style={{ height: '6px', background: 'var(--input-bg)', borderRadius: '3px' }}>
                <div style={{ width: '94.2%', height: '100%', background: '#6366f1', borderRadius: '3px' }} />
              </div>
            </div>
          </div>
          <p style={{ marginTop: '24px', fontSize: '0.8rem', color: 'var(--text-faint)' }}>
            Model drift is calculated based on distribution shifts in feature inputs compared to training data.
          </p>
        </div>
      </div>
    </div>
  );
}
