'use client';
import { useState, useEffect } from 'react';
import { churnApi } from '@/lib/api';
import { Code2, Play, RefreshCw, Plus, ShieldCheck, Clock } from 'lucide-react';
import styles from './webhooks.module.css';

export default function WebhooksPage() {
  const [subs, setSubs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [url, setUrl] = useState('');
  const [event, setEvent] = useState('customer.risk_changed');
  const [message, setMessage] = useState(null);

  const fetchWebhooks = async () => {
    setLoading(true);
    try {
      const data = await churnApi.getWebhooks();
      setSubs(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWebhooks();
  }, []);

  const handleRegister = async (e) => {
    e.preventDefault();
    if (!url) return;

    setLoading(true);
    setMessage(null);
    try {
      await churnApi.registerWebhook({ url, event });
      setMessage({ type: 'success', text: 'Webhook subscription registered successfully!' });
      setUrl('');
      fetchWebhooks();
    } catch (err) {
      setMessage({ type: 'error', text: err.message || 'Failed to register webhook.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.heading}>Webhooks Console</h1>
        <p className={styles.subheading}>Register endpoint URLs to receive instant HTTP POST payloads when critical customer risk thresholds trigger changes.</p>
      </div>

      {message && (
        <div className={`${styles.alert} ${message.type === 'success' ? styles.alertSuccess : styles.alertError}`}>
          {message.text}
        </div>
      )}

      <div className={styles.grid}>
        {/* Subscriptions list */}
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <Code2 size={20} className={styles.activeIcon} />
            <h2>Webhook Event Subscriptions</h2>
            <button onClick={fetchWebhooks} className={styles.refreshBtn} disabled={loading}>
              <RefreshCw size={16} className={loading ? styles.spin : ''} /> Refresh
            </button>
          </div>

          <div className={styles.webhookList}>
            {subs.map((s) => (
              <div key={s.id} className={styles.webhookItem}>
                <div className={styles.wHeader}>
                  <strong className={styles.wUrl} title={s.url}>{s.url}</strong>
                  <span className={styles.wStatus}>{s.status}</span>
                </div>
                <div className={styles.wMeta}>
                  <div><strong>Triggering Event:</strong> {s.event}</div>
                  <div className={styles.timeCell}><Clock size={12} /> {new Date(s.created_at).toLocaleDateString()}</div>
                </div>
              </div>
            ))}
            {subs.length === 0 && (
              <div className={styles.empty}>
                <Code2 size={40} />
                <p>No webhook subscriptions configured yet. Create one on the right.</p>
              </div>
            )}
          </div>
        </div>

        {/* Register card */}
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <Plus size={20} className={styles.activeIcon} />
            <h2>Register New Endpoint</h2>
          </div>

          <form onSubmit={handleRegister} className={styles.form}>
            <div className={styles.formGroup}>
              <label className={styles.label}>Destination Endpoint URL</label>
              <input 
                type="url" 
                placeholder="https://api.yourdomain.com/webhooks/churn" 
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                className={styles.input}
                required
              />
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>Event Type</label>
              <select 
                value={event} 
                onChange={(e) => setEvent(e.target.value)}
                className={styles.select}
              >
                <option value="customer.risk_changed">customer.risk_changed (Risk transitions to High)</option>
                <option value="model.rebuild_completed">model.rebuild_completed (Automated retraining completed)</option>
                <option value="campaign.completed">campaign.completed (Retention campaign finishes)</option>
              </select>
            </div>

            <button type="submit" className={styles.submitBtn} disabled={loading}>
              <Play size={14} /> Subscribe to Events
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
