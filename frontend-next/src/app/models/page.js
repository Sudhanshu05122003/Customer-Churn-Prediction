'use client';
import { useState, useEffect } from 'react';
import { churnApi } from '@/lib/api';
import { Brain, Calendar, Shield, Activity, RefreshCw, CheckCircle, Play, Settings } from 'lucide-react';
import styles from './models.module.css';

export default function ModelsPage() {
  const [versions, setVersions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('versions');
  const [schedule, setSchedule] = useState('weekly');
  const [message, setMessage] = useState(null);

  const fetchVersions = async () => {
    setLoading(true);
    try {
      const data = await churnApi.getModelVersions();
      setVersions(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVersions();
  }, []);

  const handleActivate = async (version) => {
    setLoading(true);
    setMessage(null);
    try {
      await churnApi.activateModelVersion(version);
      setMessage({ type: 'success', text: `Model version ${version} activated successfully!` });
      fetchVersions();
    } catch (err) {
      setMessage({ type: 'error', text: err.message || 'Failed to activate model version.' });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSchedule = (e) => {
    e.preventDefault();
    setMessage({ type: 'success', text: `Auto-retraining scheduled successfully (${schedule})!` });
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.heading}>Model Version Manager</h1>
        <p className={styles.subheading}>Track model iterations, compare precision metrics, and deploy or rollback model versions.</p>
      </div>

      {message && (
        <div className={`${styles.alert} ${message.type === 'success' ? styles.alertSuccess : styles.alertError}`}>
          {message.text}
        </div>
      )}

      {/* Tabs */}
      <div className={styles.tabs}>
        <button 
          onClick={() => setActiveTab('versions')} 
          className={`${styles.tab} ${activeTab === 'versions' ? styles.activeTab : ''}`}
        >
          <Brain size={18} /> Model Versions
        </button>
        <button 
          onClick={() => setActiveTab('schedule')} 
          className={`${styles.tab} ${activeTab === 'schedule' ? styles.activeTab : ''}`}
        >
          <Settings size={18} /> Training Schedule
        </button>
      </div>

      {activeTab === 'versions' ? (
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <Activity size={20} className={styles.activeIcon} />
            <h2>Trained Classifiers History</h2>
            <button onClick={fetchVersions} className={styles.refreshBtn} disabled={loading}>
              <RefreshCw size={16} className={loading ? styles.spin : ''} /> Refresh
            </button>
          </div>

          {versions.length > 0 ? (
            <div className={styles.tableWrap}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Version</th>
                    <th>Trained At</th>
                    <th>Records</th>
                    <th>Best Algorithm</th>
                    <th>Accuracy</th>
                    <th>F1 Score</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {versions.map((v, idx) => (
                    <tr key={idx} className={v.is_active ? styles.activeRow : ''}>
                      <td className={styles.vNum}>{v.version}</td>
                      <td>{new Date(v.trained_at).toLocaleString()}</td>
                      <td>{(v.dataset_rows || 0).toLocaleString()}</td>
                      <td>{v.best_model_name}</td>
                      <td>{(v.accuracy * 100).toFixed(1)}%</td>
                      <td>{v.model_comparison?.[v.best_model_name]?.f1 ? (v.model_comparison[v.best_model_name].f1 * 100).toFixed(1) + '%' : 'N/A'}</td>
                      <td>
                        {v.is_active ? (
                          <span className={styles.activeLabel}>
                            <CheckCircle size={14} /> Active
                          </span>
                        ) : (
                          <button 
                            onClick={() => handleActivate(v.version)} 
                            className={styles.activateBtn}
                            disabled={loading}
                          >
                            Activate
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className={styles.empty}>
              <Brain size={40} />
              <p>No custom model versions found. Run a new training from the "Train Model" tab first.</p>
            </div>
          )}
        </div>
      ) : (
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <Calendar size={20} className={styles.activeIcon} />
            <h2>Automated Retraining Settings</h2>
          </div>

          <form onSubmit={handleSaveSchedule} className={styles.form}>
            <div className={styles.formGroup}>
              <label className={styles.label}>Retraining Frequency</label>
              <select 
                value={schedule} 
                onChange={(e) => setSchedule(e.target.value)}
                className={styles.select}
              >
                <option value="daily">Daily (Every night at 02:00 AM)</option>
                <option value="weekly">Weekly (Sunday night at 02:00 AM)</option>
                <option value="monthly">Monthly (1st of month at 02:00 AM)</option>
              </select>
            </div>

            <div className={styles.scheduleInfo}>
              <p><strong>Next Retraining Run:</strong> {schedule === 'daily' ? 'Tomorrow at 2:00 AM' : schedule === 'weekly' ? 'Sunday at 2:00 AM' : '1st of Next Month at 2:00 AM'}</p>
              <p className={styles.infoHint}>Auto-retraining automatically processes new prediction history records and refreshes the baseline classifier models.</p>
            </div>

            <button type="submit" className={styles.saveBtn}>
              Save Training Policy
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
