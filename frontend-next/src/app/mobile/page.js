'use client';
import { SmartPhone, Bell, Heart, ShieldAlert, Cpu } from 'lucide-react';
import styles from './mobile.module.css';

export default function MobilePage() {
  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.heading}>Mobile Companion App</h1>
        <p className={styles.subheading}>Interactive mobile preview dashboard for monitoring real-time active customer risk levels on the go.</p>
      </div>

      <div className={styles.previewContainer}>
        {/* Mock Smartphone Frame */}
        <div className={styles.phoneFrame}>
          <div className={styles.phoneScreen}>
            {/* Status bar */}
            <div className={styles.statusBar}>
              <span>09:41 AM</span>
              <div className={styles.statusIcons}>
                <span>📶</span>
                <span>🔋 92%</span>
              </div>
            </div>

            {/* App Header */}
            <div className={styles.appHeader}>
              <div className={styles.brand}>
                <span className={styles.appTitle}>ChurnSense</span>
                <span className={styles.appSubtitle}>Mobile Monitor</span>
              </div>
              <Bell size={20} className={styles.bell} />
            </div>

            {/* Core KPI metrics */}
            <div className={styles.mobileBody}>
              <div className={styles.metricCard}>
                <span className={styles.metricLabel}>Expected Churn</span>
                <div className={styles.metricValRow}>
                  <strong className={styles.metricVal}>4.8%</strong>
                  <span className={styles.trendDown}>↓ 1.2%</span>
                </div>
              </div>

              <div className={styles.sectionTitle}>High Risk Customer Alerts</div>
              
              <div className={styles.alertList}>
                <div className={styles.alertItem}>
                  <div className={styles.alertHeader}>
                    <strong className={styles.alertId}>CUST_82930</strong>
                    <span className={styles.alertRisk}>78% Risk</span>
                  </div>
                  <div className={styles.alertMeta}>VIP Segment • 15% discount suggested</div>
                </div>

                <div className={styles.alertItem}>
                  <div className={styles.alertHeader}>
                    <strong className={styles.alertId}>CUST_48291</strong>
                    <span className={styles.alertRisk}>84% Risk</span>
                  </div>
                  <div className={styles.alertMeta}>At Risk Segment • Schedule CS Manager call</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
