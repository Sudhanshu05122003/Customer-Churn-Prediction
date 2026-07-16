'use client';
import { useState } from 'react';
import { churnApi } from '@/lib/api';
import { Link2, ShieldCheck, RefreshCw, AlertCircle, Sparkles } from 'lucide-react';
import styles from './integrations.module.css';

export default function IntegrationsPage() {
  const [activePlatform, setActivePlatform] = useState(null);
  const [syncData, setSyncData] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleSync = async (platform) => {
    setLoading(true);
    setActivePlatform(platform);
    setSyncData([]);
    try {
      const data = await churnApi.syncIntegration(platform);
      setSyncData(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.heading}>Integrations Hub</h1>
        <p className={styles.subheading}>Connect ChurnSense directly to HubSpot, Stripe, or Zendesk to automate pipeline intelligence scoring.</p>
      </div>

      <div className={styles.grid}>
        {/* Connection Cards */}
        <div className={styles.platformsCol}>
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <Link2 size={20} className={styles.activeIcon} />
              <h2>Available Integrations</h2>
            </div>
            
            <div className={styles.platformList}>
              {/* HubSpot */}
              <div className={styles.platformItem}>
                <div className={styles.pInfo}>
                  <strong className={styles.pName}>HubSpot CRM</strong>
                  <span className={styles.pDesc}>Pull deals and contacts to auto-score customer lifecycle health.</span>
                </div>
                <button 
                  onClick={() => handleSync('hubspot')} 
                  className={styles.syncBtn}
                  disabled={loading}
                >
                  {loading && activePlatform === 'hubspot' ? <RefreshCw className={styles.spin} size={14} /> : 'Sync Deals'}
                </button>
              </div>

              {/* Stripe */}
              <div className={styles.platformItem}>
                <div className={styles.pInfo}>
                  <strong className={styles.pName}>Stripe Subscriptions</strong>
                  <span className={styles.pDesc}>Analyze monthly recurring revenue (MRR) payments.</span>
                </div>
                <button 
                  onClick={() => handleSync('stripe')} 
                  className={styles.syncBtn}
                  disabled={loading}
                >
                  {loading && activePlatform === 'stripe' ? <RefreshCw className={styles.spin} size={14} /> : 'Sync MRR'}
                </button>
              </div>

              {/* Zendesk */}
              <div className={styles.platformItem}>
                <div className={styles.pInfo}>
                  <strong className={styles.pName}>Zendesk Tickets</strong>
                  <span className={styles.pDesc}>Monitor client conversation support sentiments.</span>
                </div>
                <button 
                  onClick={() => handleSync('zendesk')} 
                  className={styles.syncBtn}
                  disabled={loading}
                >
                  {loading && activePlatform === 'zendesk' ? <RefreshCw className={styles.spin} size={14} /> : 'Sync Tickets'}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Sync Data Panel */}
        <div className={styles.dataCol}>
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <Sparkles size={20} className={styles.activeIcon} />
              <h2>Synced Scoreboard Data</h2>
            </div>

            {loading ? (
              <div className={styles.syncPlaceholder}>
                <RefreshCw className={styles.spin} size={32} />
                <p>Establishing secure connection and scoring records...</p>
              </div>
            ) : syncData.length > 0 ? (
              <div className={styles.tableWrap}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      {activePlatform === 'hubspot' && (
                        <>
                          <th>Contact</th>
                          <th>Deal Value</th>
                          <th>Churn Risk</th>
                          <th>Action</th>
                        </>
                      )}
                      {activePlatform === 'stripe' && (
                        <>
                          <th>Customer</th>
                          <th>MRR</th>
                          <th>Payment Status</th>
                          <th>Risk</th>
                        </>
                      )}
                      {activePlatform === 'zendesk' && (
                        <>
                          <th>Ticket ID</th>
                          <th>Subject</th>
                          <th>Sentiment</th>
                          <th>Risk</th>
                        </>
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {syncData.map((row, idx) => (
                      <tr key={idx}>
                        {activePlatform === 'hubspot' && (
                          <>
                            <td>
                              <div style={{fontWeight: 600}}>{row.name}</div>
                              <div style={{fontSize: '11px', color: 'var(--text-muted)'}}>{row.email}</div>
                            </td>
                            <td>₹{row.deal_value.toLocaleString()}</td>
                            <td style={{color: row.churn_risk.includes('High') || row.churn_risk.includes('Critical') ? '#ef4444' : '#10b981', fontWeight: 600}}>{row.churn_risk}</td>
                            <td><span className={styles.actionBadge}>{row.action}</span></td>
                          </>
                        )}
                        {activePlatform === 'stripe' && (
                          <>
                            <td style={{fontWeight: 600}}>{row.customer}</td>
                            <td>₹{row.mrr.toLocaleString()}</td>
                            <td style={{color: row.payment_status.includes('Failed') ? '#ef4444' : '#10b981'}}>{row.payment_status}</td>
                            <td style={{color: '#ef4444', fontWeight: 600}}>{row.churn_risk}</td>
                          </>
                        )}
                        {activePlatform === 'zendesk' && (
                          <>
                            <td style={{fontWeight: 600}}>{row.ticket_id}</td>
                            <td>{row.subject}</td>
                            <td style={{color: row.sentiment.includes('Negative') ? '#ef4444' : '#64748b'}}>{row.sentiment}</td>
                            <td style={{color: '#ef4444', fontWeight: 600}}>{row.churn_risk}</td>
                          </>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className={styles.syncPlaceholder}>
                <Link2 size={32} />
                <p>Select an integration platform on the left to sync deals, subscriptions, or tickets.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
