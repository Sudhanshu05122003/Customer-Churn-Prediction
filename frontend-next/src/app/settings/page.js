'use client';
import { useState, useEffect } from 'react';
import { churnApi } from '@/lib/api';
import { Settings, Globe, DollarSign, Sliders, RefreshCw } from 'lucide-react';
import styles from './settings.module.css';

export default function SettingsPage() {
  const [currency, setCurrency] = useState('₹');
  const [timezone, setTimezone] = useState('Asia/Kolkata');
  const [threshold, setThreshold] = useState(0.5);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const data = await churnApi.getOrgSettings();
      setCurrency(data.currency || '₹');
      setTimezone(data.timezone || 'Asia/Kolkata');
      setThreshold(data.threshold || 0.5);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    try {
      await churnApi.updateOrgSettings({ currency, timezone, threshold });
      setMessage({ type: 'success', text: 'Organization configurations successfully updated!' });
    } catch (err) {
      setMessage({ type: 'error', text: err.message || 'Failed to update settings.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.heading}>Organization Settings</h1>
        <p className={styles.subheading}>Customize global settings, active time zones, billing currencies, and risk thresholds.</p>
      </div>

      {message && (
        <div className={`${styles.alert} ${message.type === 'success' ? styles.alertSuccess : styles.alertError}`}>
          {message.text}
        </div>
      )}

      <div className={styles.card}>
        <div className={styles.cardHeader}>
          <Settings size={20} className={styles.activeIcon} />
          <h2>Global Configurations</h2>
        </div>

        <form onSubmit={handleSave} className={styles.form}>
          <div className={styles.formGroup}>
            <label className={styles.label}>
              <DollarSign size={16} /> Dashboard Billing Currency
            </label>
            <select 
              value={currency} 
              onChange={(e) => setCurrency(e.target.value)}
              className={styles.select}
            >
              <option value="₹">Rupee (₹)</option>
              <option value="$">US Dollar ($)</option>
              <option value="€">Euro (€)</option>
              <option value="£">Pound (£)</option>
            </select>
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>
              <Globe size={16} /> Core Operational Time Zone
            </label>
            <select 
              value={timezone} 
              onChange={(e) => setTimezone(e.target.value)}
              className={styles.select}
            >
              <option value="Asia/Kolkata">India (UTC+5:30) - Asia/Kolkata</option>
              <option value="America/New_York">Eastern Time (EST) - America/New_York</option>
              <option value="Europe/London">Greenwich Mean Time (GMT) - Europe/London</option>
              <option value="Asia/Singapore">Singapore Time (SGT) - Asia/Singapore</option>
            </select>
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>
              <Sliders size={16} /> Churn Risk Score Threshold
            </label>
            <div className={styles.sliderRow}>
              <input 
                type="range" 
                min="0.1" 
                max="0.9" 
                step="0.05"
                value={threshold} 
                onChange={(e) => setThreshold(parseFloat(e.target.value))}
                className={styles.slider}
              />
              <span className={styles.sliderVal}>{Math.round(threshold * 100)}%</span>
            </div>
            <p className={styles.hint}>Predictions exceeding this threshold will automatically flag customers as "High Risk".</p>
          </div>

          <button type="submit" className={styles.saveBtn} disabled={loading}>
            {loading ? <RefreshCw className={styles.spin} size={16} /> : 'Save Configurations'}
          </button>
        </form>
      </div>
    </div>
  );
}
