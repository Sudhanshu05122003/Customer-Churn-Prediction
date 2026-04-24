'use client';
import { useState, useRef } from 'react';
import { churnApi } from '@/lib/api';
import { Upload, FileSpreadsheet, AlertTriangle, ShieldCheck, Loader2, X, Download } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import styles from './bulk.module.css';

export default function BulkPage() {
  const [file, setFile] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const inputRef = useRef();

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const dropped = e.dataTransfer.files?.[0];
    if (dropped && dropped.name.endsWith('.csv')) {
      setFile(dropped);
      setError('');
    } else {
      setError('Please upload a .csv file');
    }
  };

  const handleFileSelect = (e) => {
    const selected = e.target.files?.[0];
    if (selected) {
      setFile(selected);
      setError('');
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    setLoading(true);
    setError('');
    setResult(null);
    try {
      const data = await churnApi.bulkPredict(file);
      if (data.error) throw new Error(data.error);
      setResult(data);
    } catch (err) {
      setError(err.message || 'Bulk prediction failed');
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setFile(null);
    setResult(null);
    setError('');
  };

  const riskCounts = {};
  if (result?.results) {
    result.results.forEach(r => {
      riskCounts[r.risk_level] = (riskCounts[r.risk_level] || 0) + 1;
    });
  }
  const riskChartData = Object.entries(riskCounts).map(([name, value]) => ({ name, value }));
  const RISK_COLORS_MAP = { Critical: '#ef4444', High: '#f59e0b', Medium: '#6366f1', Low: '#10b981' };

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.heading}>Bulk Analysis</h1>
        <p className={styles.subheading}>Upload a CSV to analyze multiple customers at once</p>
      </div>

      {error && <div className={styles.errorBanner}>{error}</div>}

      {!result ? (
        <>
          {/* Drop Zone */}
          <div
            className={`${styles.dropZone} ${dragOver ? styles.dropZoneActive : ''} ${file ? styles.dropZoneHasFile : ''}`}
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            onClick={() => inputRef.current?.click()}
          >
            <input ref={inputRef} type="file" accept=".csv" onChange={handleFileSelect} hidden />
            {file ? (
              <div className={styles.fileInfo}>
                <FileSpreadsheet size={36} className={styles.fileIcon} />
                <div>
                  <p className={styles.fileName}>{file.name}</p>
                  <p className={styles.fileSize}>{(file.size / 1024).toFixed(1)} KB</p>
                </div>
                <button className={styles.removeFile} onClick={(e) => { e.stopPropagation(); reset(); }}>
                  <X size={18} />
                </button>
              </div>
            ) : (
              <>
                <Upload size={40} className={styles.uploadIcon} />
                <p className={styles.dropText}>Drag & drop your CSV here</p>
                <p className={styles.dropHint}>or click to browse files</p>
              </>
            )}
          </div>

          <button
            id="bulk-upload-submit"
            className={styles.submitBtn}
            onClick={handleUpload}
            disabled={!file || loading}
          >
            {loading ? <Loader2 size={20} className={styles.spinner} /> : <><Upload size={18} /> Analyze {file ? file.name : 'CSV'}</>}
          </button>
        </>
      ) : (
        /* ── Results ── */
        <div className={styles.results}>
          <div className={styles.summaryGrid}>
            <div className={styles.summaryCard}>
              <span className={styles.summaryLabel}>Total</span>
              <span className={styles.summaryValue}>{result.total}</span>
            </div>
            <div className={`${styles.summaryCard} ${styles.churnCard}`}>
              <AlertTriangle size={20} />
              <span className={styles.summaryLabel}>Churn</span>
              <span className={styles.summaryValue}>{result.churn_count} <small>({result.churn_pct}%)</small></span>
            </div>
            <div className={`${styles.summaryCard} ${styles.stayCard}`}>
              <ShieldCheck size={20} />
              <span className={styles.summaryLabel}>Retained</span>
              <span className={styles.summaryValue}>{result.stay_count} <small>({result.stay_pct}%)</small></span>
            </div>
          </div>

          {/* Risk Distribution Chart */}
          {riskChartData.length > 0 && (
            <div className={styles.chartCard}>
              <h3 className={styles.chartTitle}>Risk Distribution</h3>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={riskChartData}>
                  <XAxis dataKey="name" tick={{ fill: '#94a3b8', fontSize: 12 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: '#94a3b8', fontSize: 12 }} axisLine={false} tickLine={false} allowDecimals={false} />
                  <Tooltip contentStyle={{ background: 'rgba(15,23,42,0.9)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, color: '#fff' }} />
                  <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                    {riskChartData.map((entry, i) => (
                      <Cell key={i} fill={RISK_COLORS_MAP[entry.name] || '#6366f1'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Results Table */}
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Prediction</th>
                  <th>Probability</th>
                  <th>Risk</th>
                </tr>
              </thead>
              <tbody>
                {result.results.slice(0, 100).map((row, i) => (
                  <tr key={i}>
                    <td className={styles.rowNum}>{i + 1}</td>
                    <td>
                      <span className={`${styles.predBadge} ${row.prediction === 'Churn' ? styles.churnBadge : styles.stayBadge}`}>
                        {row.prediction}
                      </span>
                    </td>
                    <td className={styles.probCell}>{(row.probability * 100).toFixed(1)}%</td>
                    <td>
                      <span className={styles.riskTag} style={{ color: RISK_COLORS_MAP[row.risk_level], background: `${RISK_COLORS_MAP[row.risk_level]}18` }}>
                        {row.risk_level}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {result.results.length > 100 && (
              <p className={styles.truncNote}>Showing first 100 of {result.results.length} results.</p>
            )}
          </div>

          <button className={styles.resetBtn} onClick={reset}>Upload Another File</button>
        </div>
      )}
    </div>
  );
}
