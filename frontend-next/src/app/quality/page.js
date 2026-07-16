'use client';
import { useState } from 'react';
import { churnApi } from '@/lib/api';
import { ShieldCheck, AlertTriangle, ShieldAlert, Upload, RefreshCw, BarChart } from 'lucide-react';
import styles from './quality.module.css';

export default function QualityPage() {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState(null);
  const [error, setError] = useState(null);

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setReport(null);
      setError(null);
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) return;

    setLoading(true);
    setError(null);
    try {
      const data = await churnApi.analyzeQuality(file);
      setReport(data);
    } catch (err) {
      setError(err.message || 'Failed to analyze data quality.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.heading}>Data Quality Dashboard</h1>
        <p className={styles.subheading}>Scan and audit uploaded datasets for duplicates, outliers, class imbalances, and empty columns before training models.</p>
      </div>

      <div className={styles.grid}>
        {/* Upload Card */}
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <Upload size={20} className={styles.activeIcon} />
            <h2>Upload Dataset for Audit</h2>
          </div>
          
          <form onSubmit={handleUpload} className={styles.uploadForm}>
            <div className={styles.dropzone}>
              <Upload size={32} className={styles.uploadIcon} />
              <input type="file" accept=".csv" onChange={handleFileChange} className={styles.fileInput} id="csv-file-input" />
              <label htmlFor="csv-file-input" className={styles.fileLabel}>
                {file ? file.name : 'Choose CSV file to upload'}
              </label>
            </div>
            
            <button type="submit" className={styles.submitBtn} disabled={loading || !file}>
              {loading ? <RefreshCw className={styles.spin} size={16} /> : 'Run Quality Scan'}
            </button>
          </form>

          {error && <div className={styles.errorAlert}>{error}</div>}
        </div>

        {/* Results Overview */}
        {report && (
          <div className={styles.resultsGrid}>
            {/* Score Card */}
            <div className={styles.card}>
              <div className={styles.scoreHeader}>
                <span className={styles.scoreTitle}>Dataset Quality Score</span>
                <div className={styles.scoreBig} style={{color: report.score >= 80 ? '#10b981' : report.score >= 50 ? '#f59e0b' : '#ef4444'}}>
                  {report.score} <span className={styles.scoreMax}>/ 100</span>
                </div>
              </div>

              <div className={styles.summaryMeta}>
                <div><strong>Total Rows:</strong> {report.total_rows}</div>
                <div><strong>Total Columns:</strong> {report.total_columns}</div>
                <div><strong>Duplicates Found:</strong> {report.duplicate_count}</div>
              </div>
            </div>

            {/* Missing Values Card */}
            <div className={styles.card}>
              <div className={styles.cardHeader}>
                <BarChart size={20} className={styles.activeIcon} />
                <h2>Missing Value Percentages</h2>
              </div>
              <div className={styles.missingList}>
                {Object.entries(report.missing_report || {}).map(([col, data]) => (
                  <div key={col} className={styles.missingItem}>
                    <span>{col}</span>
                    <span style={{color: data.pct > 0 ? '#ef4444' : '#10b981', fontWeight: 600}}>
                      {data.pct}% ({data.count})
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Recommendations Card */}
            <div className={styles.card} style={{gridColumn: '1 / -1'}}>
              <div className={styles.cardHeader}>
                <ShieldCheck size={20} className={styles.activeIcon} />
                <h2>Suggested Data Operations</h2>
              </div>
              {report.suggested_fixes && report.suggested_fixes.length > 0 ? (
                <ul className={styles.fixesList}>
                  {report.suggested_fixes.map((fix, idx) => (
                    <li key={idx} className={styles.fixItem}>
                      <AlertTriangle size={16} className={styles.warnIcon} /> {fix}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className={styles.cleanMsg}>Dataset is clean! No operations required before training.</p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
