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
  const [headers, setHeaders] = useState([]);
  const [columnMapping, setColumnMapping] = useState({});
  const [mappingRequired, setMappingRequired] = useState(false);
  const inputRef = useRef();

  const parseHeaders = (selectedFile) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target.result;
        const firstLine = text.split('\n')[0];
        const cols = firstLine.split(',').map(c => c.trim().replace(/^["']|["']$/g, ''));
        setHeaders(cols);
        
        // Auto-map matching columns
        const initialMap = {};
        const expected = [
          { key: 'CustomerID', terms: ['id', 'customer', 'cust', 'user'] },
          { key: 'Gender', terms: ['gender', 'sex'] },
          { key: 'Age', terms: ['age', 'dob', 'years'] },
          { key: 'Tenure', terms: ['tenure', 'months', 'active', 'period'] },
          { key: 'Balance', terms: ['balance', 'revenue', 'spend', 'val', 'order', 'aov', 'mrr'] },
          { key: 'NumOfProducts', terms: ['product', 'products', 'count', 'items', 'seats'] },
          { key: 'HasCrCard', terms: ['card', 'visa', 'credit', 'autopay', 'card'] },
          { key: 'IsActiveMember', terms: ['active', 'status', 'member', 'login', 'dau'] },
          { key: 'EstimatedSalary', terms: ['salary', 'income', 'contract', 'value', 'acv'] }
        ];
        
        expected.forEach(exp => {
          const match = cols.find(c => {
            const l = c.toLowerCase();
            return exp.terms.some(t => l.includes(t)) || l === exp.key.toLowerCase();
          });
          if (match) {
            initialMap[match] = exp.key;
          }
        });
        setColumnMapping(initialMap);
        setMappingRequired(true);
      } catch (err) {
        console.error('Failed to parse headers', err);
      }
    };
    reader.readAsText(selectedFile);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const dropped = e.dataTransfer.files?.[0];
    if (dropped && dropped.name.endsWith('.csv')) {
      setFile(dropped);
      setError('');
      parseHeaders(dropped);
    } else {
      setError('Please upload a .csv file');
    }
  };

  const handleFileSelect = (e) => {
    const selected = e.target.files?.[0];
    if (selected) {
      setFile(selected);
      setError('');
      parseHeaders(selected);
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    setLoading(true);
    setError('');
    setResult(null);
    try {
      const data = await churnApi.bulkPredict(file, columnMapping);
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
    setHeaders([]);
    setColumnMapping({});
    setMappingRequired(false);
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

          {mappingRequired && headers.length > 0 && (
            <div className={styles.mapperCard}>
              <h3 style={{fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px'}}>🛠️ Map CSV Columns</h3>
              <p className={styles.mapperSubtitle}>Link your CSV columns to core customer features to enable analysis:</p>
              <div className={styles.mapperGrid}>
                {[
                  { key: 'CustomerID', label: 'Customer ID' },
                  { key: 'Gender', label: 'Gender' },
                  { key: 'Age', label: 'Age' },
                  { key: 'Tenure', label: 'Tenure (Months)' },
                  { key: 'Balance', label: 'Balance / Revenue' },
                  { key: 'NumOfProducts', label: 'Products Count' },
                  { key: 'HasCrCard', label: 'Has Card / Autopay' },
                  { key: 'IsActiveMember', label: 'Is Active User' },
                  { key: 'EstimatedSalary', label: 'Estimated Salary / Income' }
                ].map(field => {
                  const mappedCol = Object.keys(columnMapping).find(k => columnMapping[k] === field.key) || '';
                  
                  return (
                    <div key={field.key} className={styles.mapperField}>
                      <span className={styles.mapperLabel}>{field.label}</span>
                      <select 
                        value={mappedCol} 
                        onChange={(e) => {
                          const val = e.target.value;
                          const newMap = { ...columnMapping };
                          Object.keys(newMap).forEach(k => {
                            if (newMap[k] === field.key) delete newMap[k];
                          });
                          if (val) {
                            newMap[val] = field.key;
                          }
                          setColumnMapping(newMap);
                        }}
                        className={styles.mapperSelect}
                      >
                        <option value="">-- Ignore / Skip --</option>
                        {headers.map(h => (
                          <option key={h} value={h}>{h}</option>
                        ))}
                      </select>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

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
