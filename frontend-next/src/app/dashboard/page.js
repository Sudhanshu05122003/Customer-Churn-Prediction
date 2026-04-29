'use client';
import { useState, useEffect } from 'react';
import { churnApi } from '@/lib/api';
import { TrendingUp, Users, AlertTriangle, ShieldCheck, Activity, BarChart3, HeartPulse, Bell, ArrowUpRight, DollarSign, Lock, Info } from 'lucide-react';
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
  const [user, setUser] = useState(null);
  const [upgrading, setUpgrading] = useState(false);
  const [savingIds, setSavingIds] = useState(new Set());

  const fetchDashboardData = async () => {
    try {
      const [statsData, userData] = await Promise.all([
        churnApi.getStats(),
        fetch(process.env.NEXT_PUBLIC_API_URL ? `${process.env.NEXT_PUBLIC_API_URL}/auth/me` : 'http://127.0.0.1:5000/auth/me', {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        }).then(res => res.json()).then(data => data.success ? data.data : null).catch(()=>null)
      ]);
      setStats(statsData);
      if (userData) {
          setUser(userData);
          localStorage.setItem('user', JSON.stringify(userData));
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    const stored = localStorage.getItem('user');
    if (stored) setUser(JSON.parse(stored));
    fetchDashboardData().finally(() => setLoading(false));
  }, []);

  const handleToggleSave = async (id) => {
    setSavingIds(prev => new Set(prev).add(id));
    try {
      await churnApi.toggleSavedStatus(id);
      await fetchDashboardData();
    } catch (err) {
      console.error('Failed to toggle status', err);
    } finally {
      setSavingIds(prev => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  };

  const handleUpgrade = async () => {
    setUpgrading(true);
    try {
        const res = await fetch(process.env.NEXT_PUBLIC_API_URL ? `${process.env.NEXT_PUBLIC_API_URL}/auth/upgrade` : 'http://127.0.0.1:5000/auth/upgrade', {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });
        const data = await res.json();
        if (data.success) {
            const updatedUser = { ...user, plan: 'pro' };
            setUser(updatedUser);
            localStorage.setItem('user', JSON.stringify(updatedUser));
        }
    } catch(e) {}
    setUpgrading(false);
  };

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

      {/* REVENUE IMPACT LAYER */}
      <div className={styles.revenueGrid}>
        <div className={styles.revenueCard}>
          <div className={styles.revenueHeader}>
            <div className={styles.revenueTitleWrap}>
              <DollarSign size={24} className={styles.revenueIcon} />
              <h2>Estimated Revenue at Risk</h2>
              <div className={styles.tooltipWrap}>
                <Info size={16} className={styles.infoIcon} />
                <div className={styles.tooltip}>Potential loss from high-risk customers who haven't been retained yet.</div>
              </div>
            </div>
          </div>
          <div className={styles.revenueContent}>
            <div className={styles.revenueMain}>
              <span className={styles.currency}>₹</span>
              <span className={styles.amount}>{(stats.revenue_at_risk || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}</span>
            </div>
            <div className={styles.revenueMeta}>
              <div className={styles.metaItem}>
                <span className={styles.metaLabel}>At-Risk Users</span>
                <span className={styles.metaValue}>{stats.total_high_risk_customers || 0}</span>
              </div>
            </div>
          </div>
        </div>

        <div className={`${styles.revenueCard} ${styles.saved}`}>
          <div className={styles.revenueHeader}>
            <div className={styles.revenueTitleWrap}>
              <ShieldCheck size={24} style={{ color: '#10b981' }} />
              <h2>Revenue Saved (confidence-adjusted)</h2>
              <div className={styles.tooltipWrap}>
                <Info size={16} className={styles.infoIcon} />
                <div className={styles.tooltip}>Estimates are weighted based on churn probability to improve accuracy.</div>
              </div>
            </div>
            <div className={styles.retentionBadge} style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10b981' }}>
              {stats.total_saved_customers || 0} Retained
            </div>
          </div>
          <div className={styles.revenueContent}>
            <div className={styles.revenueMain}>
              <span className={styles.currency}>₹</span>
              <span className={styles.amount}>{(stats.adjusted_revenue_saved || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}</span>
            </div>
            <div className={styles.progressWrap} style={{ width: '100%' }}>
              <div className={styles.progressHeader}>
                <span>Recovery Progress</span>
                <span>{stats.recovered_percentage || 0}%</span>
              </div>
              <div className={styles.progressBar}>
                <div className={styles.progressFill} style={{ width: `${stats.recovered_percentage || 0}%` }} />
              </div>
            </div>
          </div>
        </div>

        <div className={`${styles.revenueCard} ${styles.verifiedCard}`}>
          <div className={styles.revenueHeader}>
            <div className={styles.revenueTitleWrap}>
              <CheckCircle2 size={24} style={{ color: '#3b82f6' }} />
              <h2>Verified Revenue Saved</h2>
              <div className={styles.tooltipWrap}>
                <Info size={16} className={styles.infoIcon} />
                <div className={styles.tooltip}>Revenue from customers who remained active for at least 7 days post-retention.</div>
              </div>
            </div>
            <div className={styles.retentionBadge} style={{ background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6' }}>
              {stats.verification_rate || 0}% Verified
            </div>
          </div>
          <div className={styles.revenueContent}>
            <div className={styles.revenueMain}>
              <span className={styles.currency}>₹</span>
              <span className={styles.amount}>{(stats.verified_revenue_saved || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}</span>
            </div>
            <div className={styles.revenueMeta} style={{ width: '100%', marginTop: '16px' }}>
               <div className={styles.metaItem}>
                <span className={styles.metaLabel}>Verified Accounts</span>
                <span className={styles.metaValue}>{stats.total_verified_customers || 0}</span>
              </div>
            </div>

            {stats.retention_distribution && stats.retention_distribution.length > 0 && (
              <div className={styles.retentionDistWrap} style={{ marginTop: '16px' }}>
                <span className={styles.metaLabel}>Retention Strength</span>
                <div className={styles.retentionDist}>
                  {stats.retention_distribution.map((d, i) => (
                    <div 
                      key={i} 
                      className={styles.distBar} 
                      style={{ 
                        width: `${d.pct}%`, 
                        background: d.label === 'Strong' ? '#10b981' : d.label === 'Moderate' ? '#f59e0b' : '#ef4444',
                        display: d.pct > 0 ? 'flex' : 'none'
                      }}
                    >
                      {d.pct > 15 ? d.label : ''}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
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

      {/* ADVANCED INSIGHTS - SOFT PAYWALL ZONE */}
      <div className={styles.secondaryGridWrapper} style={{ position: 'relative' }}>
        {user?.plan === 'free' && (
          <div className={styles.paywallOverlay}>
            <div className={styles.paywallContent}>
              <Lock size={32} className={styles.paywallIcon} />
              <h3>Unlock Advanced Business Insights</h3>
              <p>Get full access to top churn drivers, contextual strategy recommendations, and unlimited API calls.</p>
              <button className={styles.upgradeBtn} onClick={handleUpgrade} disabled={upgrading}>
                {upgrading ? 'Upgrading...' : 'Upgrade to Pro'}
              </button>
            </div>
          </div>
        )}

      <div className={`${styles.secondaryGrid} ${user?.plan === 'free' ? styles.blurred : ''}`}>
        <div className={styles.chartCard}>
          <div className={styles.chartHeader}>
            <Bell size={20} />
            <h3>Top Churn Drivers</h3>
          </div>
          {stats.top_reasons && stats.top_reasons.length > 0 ? (
            <div className={styles.driverList}>
              {stats.top_reasons.map((r, i) => (
                <div key={i} className={styles.driverItem}>
                  <span className={styles.driverReason}>{r.reason}</span>
                  <span className={styles.driverCount}>{r.count} accounts</span>
                </div>
              ))}
            </div>
          ) : (
            <div className={styles.noData}>Not enough data to identify drivers</div>
          )}
        </div>

        <div className={styles.chartCard}>
          <div className={styles.chartHeader}>
            <Activity size={20} />
            <h3>High-Risk Accounts</h3>
          </div>
          {stats.high_risk_users && stats.high_risk_users.length > 0 ? (
            <div className={styles.actionTableWrap}>
              <table className={styles.actionTable}>
                <thead>
                  <tr>
                    <th>User ID</th>
                    <th>Risk</th>
                    <th>Retention Status</th>
                  </tr>
                </thead>
                <tbody>
                  {(stats.high_risk_users || []).map(u => (
                    <tr key={u.id}>
                      <td>{u.id}</td>
                      <td>
                        <span style={{ 
                          color: RISK_COLORS[u.risk_level] || '#ef4444',
                          fontWeight: 600 
                        }}>
                          {u.risk_level} ({Math.round(u.probability * 100)}%)
                        </span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center' }}>
                          {u.saved_status === 1 ? (
                            <>
                              <div className={`${styles.actionBtn} ${styles.retained}`}>
                                <ShieldCheck size={14} /> Retained
                                <span 
                                  className={`${styles.vBadge} ${styles[u.retention_strength] || styles[u.validation_status] || styles.pending}`}
                                  title={u.retention_score ? `Retention Score: ${u.retention_score}/100` : ''}
                                >
                                  {u.retention_strength || u.validation_status || 'pending'}
                                </span>
                              </div>
                              <button 
                                className={styles.undoBtn}
                                onClick={() => handleToggleSave(u.id)}
                                disabled={savingIds.has(u.id)}
                              >
                                {savingIds.has(u.id) ? '...' : 'Undo'}
                              </button>
                            </>
                          ) : (
                            <button 
                              className={styles.actionBtn}
                              onClick={() => handleToggleSave(u.id)}
                              disabled={savingIds.has(u.id)}
                            >
                              {savingIds.has(u.id) ? (
                                <Activity size={14} className={styles.spinner} />
                              ) : (
                                <Zap size={14} />
                              )}
                              Mark as Retained
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className={styles.noData}>No high-risk accounts detected</div>
          )}
        </div>
      </div>
      </div>
    </div>
  );
}
