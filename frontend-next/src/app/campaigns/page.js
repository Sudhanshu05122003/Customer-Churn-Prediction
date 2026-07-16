'use client';
import { useState, useEffect } from 'react';
import { churnApi } from '@/lib/api';
import { Megaphone, Mail, RefreshCw, Send, Plus, Award } from 'lucide-react';
import styles from './campaigns.module.css';

export default function CampaignsPage() {
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState('');
  const [target, setTarget] = useState('VIP customers');
  const [offer, setOffer] = useState('15% discount');
  const [channel, setChannel] = useState('Email');
  const [message, setMessage] = useState(null);

  const fetchCampaigns = async () => {
    setLoading(true);
    try {
      const data = await churnApi.getCampaigns();
      setCampaigns(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCampaigns();
  }, []);

  const handleLaunch = async (e) => {
    e.preventDefault();
    if (!name) return;

    setLoading(true);
    setMessage(null);
    try {
      await churnApi.launchCampaign({ name, target, offer, channel });
      setMessage({ type: 'success', text: `Campaign "${name}" successfully launched!` });
      setName('');
      fetchCampaigns();
    } catch (err) {
      setMessage({ type: 'error', text: err.message || 'Failed to launch campaign.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.heading}>Retention Campaigns</h1>
        <p className={styles.subheading}>Design, launch, and track marketing retention campaigns to mitigate customer churn risk.</p>
      </div>

      {message && (
        <div className={`${styles.alert} ${message.type === 'success' ? styles.alertSuccess : styles.alertError}`}>
          {message.text}
        </div>
      )}

      <div className={styles.grid}>
        {/* Campaign List */}
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <Megaphone size={20} className={styles.activeIcon} />
            <h2>Active Marketing Campaigns</h2>
            <button onClick={fetchCampaigns} className={styles.refreshBtn} disabled={loading}>
              <RefreshCw size={16} className={loading ? styles.spin : ''} /> Refresh
            </button>
          </div>

          <div className={styles.campaignList}>
            {campaigns.map((c) => (
              <div key={c.id} className={styles.campaignItem}>
                <div className={styles.cHeader}>
                  <strong className={styles.cName}>{c.name}</strong>
                  <span className={styles.cStatus}>{c.status}</span>
                </div>
                <div className={styles.cMeta}>
                  <div><strong>Target Segment:</strong> {c.target}</div>
                  <div><strong>Offer:</strong> {c.offer}</div>
                  <div><strong>Channel:</strong> {c.channel}</div>
                </div>
                <div className={styles.metricsRow}>
                  <div className={styles.metric}>
                    <span>Delivered</span>
                    <strong>{c.delivered}</strong>
                  </div>
                  <div className={styles.metric}>
                    <span>Opened</span>
                    <strong>{c.opened}</strong>
                  </div>
                  <div className={styles.metric}>
                    <span>Clicked</span>
                    <strong>{c.clicked}</strong>
                  </div>
                  <div className={styles.metric}>
                    <span>Converted</span>
                    <strong style={{color: '#10b981'}}>{c.converted}</strong>
                  </div>
                </div>
              </div>
            ))}
            {campaigns.length === 0 && (
              <div className={styles.empty}>
                <Megaphone size={40} />
                <p>No retention campaigns launched yet. Start by filling the launch form on the right.</p>
              </div>
            )}
          </div>
        </div>

        {/* Launch Form Card */}
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <Plus size={20} className={styles.activeIcon} />
            <h2>Launch Retention Campaign</h2>
          </div>

          <form onSubmit={handleLaunch} className={styles.form}>
            <div className={styles.formGroup}>
              <label className={styles.label}>Campaign Name</label>
              <input 
                type="text" 
                placeholder="e.g. VIP Loyalty Extension..." 
                value={name}
                onChange={(e) => setName(e.target.value)}
                className={styles.input}
                required
              />
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>Target Audience Segment</label>
              <select 
                value={target} 
                onChange={(e) => setTarget(e.target.value)}
                className={styles.select}
              >
                <option value="VIP customers">VIP Premium Customers</option>
                <option value="At Risk customers">At-Risk Segment (High Churn Probability)</option>
                <option value="Sleeping customers">Sleeping Segment (Inactive Users)</option>
                <option value="All users">All Customers</option>
              </select>
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>Incentive / Retention Offer</label>
              <select 
                value={offer} 
                onChange={(e) => setOffer(e.target.value)}
                className={styles.select}
              >
                <option value="15% discount">15% Bill/Plan Discount</option>
                <option value="Double Rewards">Double Loyalty Rewards Points</option>
                <option value="CSM Callout">Dedicated CS Callout Schedule</option>
                <option value="Free Month">1 Month Service Subscription Free</option>
              </select>
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>Delivery Channel</label>
              <select 
                value={channel} 
                onChange={(e) => setChannel(e.target.value)}
                className={styles.select}
              >
                <option value="Email">Automated Email Campaign</option>
                <option value="SMS">Direct SMS Messaging</option>
                <option value="Push">App Push Notification</option>
              </select>
            </div>

            <button type="submit" className={styles.submitBtn} disabled={loading}>
              <Send size={16} /> Deploy & Launch Campaign
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
