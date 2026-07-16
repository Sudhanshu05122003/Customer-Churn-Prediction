'use client';
import { useState } from 'react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { UserCheck, ShieldAlert, Award, FileSpreadsheet, LayoutGrid, Users } from 'lucide-react';
import styles from './executive.module.css';

export default function ExecutivePage() {
  const [role, setRole] = useState('CEO');

  // CEO metrics data
  const ceoData = [
    { month: 'Jan', Revenue: 450000, ChurnLoss: 12000 },
    { month: 'Feb', Revenue: 480000, ChurnLoss: 15000 },
    { month: 'Mar', Revenue: 510000, ChurnLoss: 18000 },
    { month: 'Apr', Revenue: 540000, ChurnLoss: 14000 }
  ];

  // CMO campaign ROI data
  const cmoData = [
    { name: 'Email Campaign', spend: 2000, saved: 15000 },
    { name: 'SMS Discount', spend: 1200, saved: 8500 },
    { name: 'RM Callout', spend: 4000, saved: 32000 }
  ];

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.heading}>Executive BI Center</h1>
        <p className={styles.subheading}>Switch executive profiles to focus on custom role-based KPIs and forecasting indicators.</p>
      </div>

      {/* Role Switcher */}
      <div className={styles.switcher}>
        {['CEO', 'CMO', 'Customer Success', 'Product Manager'].map((r) => (
          <button 
            key={r}
            onClick={() => setRole(r)}
            className={`${styles.switchBtn} ${role === r ? styles.activeSwitch : ''}`}
          >
            {r} Dashboard
          </button>
        ))}
      </div>

      <div className={styles.card}>
        <div className={styles.cardHeader}>
          <LayoutGrid size={20} className={styles.activeIcon} />
          <h2>{role} Analytics Panel</h2>
        </div>

        {role === 'CEO' && (
          <div className={styles.panelContent}>
            <div className={styles.metricsRow}>
              <div className={styles.miniCard}>
                <span>ARR Growth</span>
                <strong>₹5.4M</strong>
              </div>
              <div className={styles.miniCard}>
                <span>Churn Revenue Loss</span>
                <strong style={{color: '#ef4444'}}>₹14,000</strong>
              </div>
              <div className={styles.miniCard}>
                <span>Net Retention Rate (NRR)</span>
                <strong style={{color: '#10b981'}}>104.2%</strong>
              </div>
            </div>

            <div className={styles.chartWrap}>
              <h3>Revenue vs. Churn Financial Impact</h3>
              <ResponsiveContainer width="100%" height={260}>
                <LineChart data={ceoData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--card-border)" />
                  <XAxis dataKey="month" tick={{ fill: 'var(--text-secondary)' }} />
                  <YAxis tick={{ fill: 'var(--text-secondary)' }} />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="Revenue" stroke="#6366f1" strokeWidth={3} />
                  <Line type="monotone" dataKey="ChurnLoss" stroke="#ef4444" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {role === 'CMO' && (
          <div className={styles.panelContent}>
            <div className={styles.metricsRow}>
              <div className={styles.miniCard}>
                <span>Total Campaign Spend</span>
                <strong>₹7,200</strong>
              </div>
              <div className={styles.miniCard}>
                <span>Recovered ARR</span>
                <strong style={{color: '#10b981'}}>₹55,500</strong>
              </div>
              <div className={styles.miniCard}>
                <span>Average ROI</span>
                <strong style={{color: '#10b981'}}>7.7x</strong>
              </div>
            </div>

            <div className={styles.chartWrap}>
              <h3>Campaign Acquisition Spend vs Revenue Saved</h3>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={cmoData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--card-border)" />
                  <XAxis dataKey="name" tick={{ fill: 'var(--text-secondary)' }} />
                  <YAxis tick={{ fill: 'var(--text-secondary)' }} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="spend" fill="#ef4444" radius={[8, 8, 0, 0]} />
                  <Bar dataKey="saved" fill="#10b981" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {role === 'Customer Success' && (
          <div className={styles.panelContent}>
            <div className={styles.metricsRow}>
              <div className={styles.miniCard}>
                <span>At-Risk Accounts</span>
                <strong style={{color: '#ef4444'}}>14</strong>
              </div>
              <div className={styles.miniCard}>
                <span>Avg Customer Health</span>
                <strong style={{color: '#10b981'}}>82/100</strong>
              </div>
              <div className={styles.miniCard}>
                <span>Urgent Tickets Pending</span>
                <strong style={{color: '#f59e0b'}}>5</strong>
              </div>
            </div>
            <p className={styles.desc}>Customer Success Managers prioritize daily relationship reach-outs to critical priority high-CLV accounts.</p>
          </div>
        )}

        {role === 'Product Manager' && (
          <div className={styles.panelContent}>
            <div className={styles.metricsRow}>
              <div className={styles.miniCard}>
                <span>Feature Usage Frequency</span>
                <strong>88%</strong>
              </div>
              <div className={styles.miniCard}>
                <span>Avg Session Duration</span>
                <strong>42 mins</strong>
              </div>
              <div className={styles.miniCard}>
                <span>Active Member Ratio</span>
                <strong style={{color: '#10b981'}}>76.4%</strong>
              </div>
            </div>
            <p className={styles.desc}>Analyze telemetry metrics and login counts to check whether feature updates increase product stickiness.</p>
          </div>
        )}
      </div>
    </div>
  );
}
