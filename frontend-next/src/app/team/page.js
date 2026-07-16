'use client';
import { useState, useEffect } from 'react';
import { churnApi } from '@/lib/api';
import { Users, UserPlus, Shield, Mail, RefreshCw, CheckCircle, Clock } from 'lucide-react';
import styles from './team.module.css';

export default function TeamPage() {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('Viewer');
  const [message, setMessage] = useState(null);

  const fetchTeam = async () => {
    setLoading(true);
    try {
      const data = await churnApi.getTeamMembers();
      setMembers(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTeam();
  }, []);

  const handleInvite = async (e) => {
    e.preventDefault();
    if (!username || !email) return;

    setLoading(true);
    setMessage(null);
    try {
      await churnApi.inviteTeamMember({ username, email, role });
      setMessage({ type: 'success', text: `Successfully invited ${username} as ${role}!` });
      setUsername('');
      setEmail('');
      setRole('Viewer');
      fetchTeam();
    } catch (err) {
      setMessage({ type: 'error', text: err.message || 'Failed to invite team member.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.heading}>Team Directory</h1>
        <p className={styles.subheading}>Manage team access, invite organization members, and assign role-based credentials.</p>
      </div>

      {message && (
        <div className={`${styles.alert} ${message.type === 'success' ? styles.alertSuccess : styles.alertError}`}>
          {message.text}
        </div>
      )}

      <div className={styles.grid}>
        {/* Directory Card */}
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <Users size={20} className={styles.activeIcon} />
            <h2>Active Organization Members</h2>
            <button onClick={fetchTeam} className={styles.refreshBtn} disabled={loading}>
              <RefreshCw size={16} className={loading ? styles.spin : ''} /> Refresh
            </button>
          </div>

          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Username</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Last Login</th>
                </tr>
              </thead>
              <tbody>
                {members.map((m) => (
                  <tr key={m.id}>
                    <td style={{fontWeight: 600}}>{m.username}</td>
                    <td>{m.email}</td>
                    <td>
                      <span className={styles.roleTag}>
                        <Shield size={12} /> {m.role}
                      </span>
                    </td>
                    <td className={styles.timeCell}>
                      <Clock size={14} /> {m.last_login ? new Date(m.last_login).toLocaleDateString() : 'Never'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Invite Card */}
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <UserPlus size={20} className={styles.activeIcon} />
            <h2>Invite New Member</h2>
          </div>

          <form onSubmit={handleInvite} className={styles.form}>
            <div className={styles.formGroup}>
              <label className={styles.label}>Username</label>
              <input 
                type="text" 
                placeholder="Enter username..." 
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className={styles.input}
                required
              />
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>Email Address</label>
              <input 
                type="email" 
                placeholder="Enter email..." 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={styles.input}
                required
              />
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>Role Credentials</label>
              <select 
                value={role} 
                onChange={(e) => setRole(e.target.value)}
                className={styles.select}
              >
                <option value="Viewer">Viewer (Read-Only)</option>
                <option value="Customer Success Manager">Customer Success Manager (CSM)</option>
                <option value="Marketing Manager">Marketing Manager</option>
                <option value="Data Scientist">Data Scientist</option>
                <option value="Org Admin">Organization Admin</option>
              </select>
            </div>

            <button type="submit" className={styles.submitBtn} disabled={loading}>
              Send Organization Invitation
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
