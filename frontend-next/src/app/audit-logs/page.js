'use client';
import { useState, useEffect } from 'react';
import { churnApi } from '@/lib/api';
import { ShieldAlert, RefreshCw, Clock, User, Settings, Database, Activity } from 'lucide-react';
import styles from './audit.module.css';

export default function AuditLogsPage() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchLogs = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await churnApi.getAuditLogs();
      setLogs(data);
    } catch (err) {
      setError(err.message || 'Only administrators can access the system audit logs.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.heading}>System Audit Trails</h1>
        <p className={styles.subheading}>Immutable records of administrative actions, logins, training executions, and bulk predictions.</p>
      </div>

      {error ? (
        <div className={styles.errorState}>
          <ShieldAlert size={48} className={styles.errorIcon} />
          <h2>Permission Denied</h2>
          <p>{error}</p>
        </div>
      ) : (
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <Activity size={20} className={styles.activeIcon} />
            <h2>Audit Trails</h2>
            <button onClick={fetchLogs} className={styles.refreshBtn} disabled={loading}>
              <RefreshCw size={16} className={loading ? styles.spin : ''} /> Refresh
            </button>
          </div>

          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Timestamp</th>
                  <th>User</th>
                  <th>Action</th>
                  <th>Details</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => {
                  let detailsObj = {};
                  try {
                    detailsObj = typeof log.details === 'string' ? JSON.parse(log.details) : log.details || {};
                  } catch (e) {}

                  return (
                    <tr key={log.id}>
                      <td className={styles.timeCell}>
                        <Clock size={14} /> {new Date(log.timestamp).toLocaleString()}
                      </td>
                      <td className={styles.userCell}>
                        <User size={14} /> {log.username || 'System'}
                      </td>
                      <td>
                        <span className={`${styles.actionTag} ${
                          log.action === 'USER_LOGIN' ? styles.tagLogin : 
                          log.action === 'TRAIN_MODEL' ? styles.tagTrain : 
                          log.action === 'ACTIVATE_MODEL' ? styles.tagActivate : 
                          styles.tagBulk
                        }`}>
                          {log.action}
                        </span>
                      </td>
                      <td className={styles.detailsCell}>
                        {Object.entries(detailsObj).map(([k, v]) => (
                          <div key={k} className={styles.detailItem}>
                            <strong>{k}:</strong> <span>{typeof v === 'object' ? JSON.stringify(v) : String(v)}</span>
                          </div>
                        ))}
                      </td>
                    </tr>
                  );
                })}
                {logs.length === 0 && !loading && (
                  <tr>
                    <td colSpan="4" className={styles.empty}>
                      No audit trails recorded yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
