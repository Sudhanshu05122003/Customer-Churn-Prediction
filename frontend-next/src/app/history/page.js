'use client';
import { useState, useEffect } from 'react';
import { churnApi } from '@/lib/api';
import { Search, Trash2, ChevronDown, ChevronUp, AlertTriangle, ShieldCheck, TrendingUp, TrendingDown, Loader2, History as HistoryIcon } from 'lucide-react';
import styles from './history.module.css';

const RISK_COLORS = { Critical: '#ef4444', High: '#f59e0b', Medium: '#6366f1', Low: '#10b981' };

export default function HistoryPage() {
  const [rows, setRows] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [expandedId, setExpandedId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState(null);

  const fetchHistory = () => {
    setLoading(true);
    churnApi.getHistory()
      .then((data) => { setRows(data); setFiltered(data); })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchHistory(); }, []);

  useEffect(() => {
    let result = rows;
    if (filter !== 'all') {
      result = result.filter(r => r.prediction?.toLowerCase() === filter);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(r =>
        Object.values(r).some(v => String(v).toLowerCase().includes(q))
      );
    }
    setFiltered(result);
  }, [search, filter, rows]);

  const handleDelete = async (id) => {
    if (!confirm('Delete this prediction entry?')) return;
    setDeletingId(id);
    try {
      await churnApi.deletePrediction(id);
      setRows(prev => prev.filter(r => r.id !== id));
      if (expandedId === id) setExpandedId(null);
    } catch (err) {
      alert(err.message || 'Failed to delete');
    } finally {
      setDeletingId(null);
    }
  };

  if (loading) {
    return (
      <div className={styles.loadingWrap}>
        <div className={styles.pulse} />
        <p>Loading history…</p>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.heading}>Prediction History</h1>
        <p className={styles.subheading}>{rows.length} total predictions</p>
      </div>

      {/* Search & Filters */}
      <div className={styles.toolbar}>
        <div className={styles.searchWrap}>
          <Search size={18} className={styles.searchIcon} />
          <input
            id="history-search"
            type="text"
            placeholder="Search predictions…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className={styles.searchInput}
          />
        </div>
        <div className={styles.filterGroup}>
          {['all', 'churn', 'stay'].map(f => (
            <button
              key={f}
              className={`${styles.filterBtn} ${filter === f ? styles.filterActive : ''}`}
              onClick={() => setFilter(f)}
            >
              {f === 'all' ? 'All' : f === 'churn' ? 'Churn' : 'Retained'}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className={styles.emptyState}>
          <HistoryIcon size={48} strokeWidth={1.5} />
          <h2>No Predictions Found</h2>
          <p>Try adjusting your filters or make some predictions first.</p>
        </div>
      ) : (
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th style={{ width: 40 }}></th>
                <th>Date</th>
                <th>Prediction</th>
                <th>Probability</th>
                <th>Risk</th>
                <th>Source</th>
                <th style={{ width: 50 }}></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((row) => {
                const isExpanded = expandedId === row.id;
                return (
                  <HistoryRow
                    key={row.id}
                    row={row}
                    isExpanded={isExpanded}
                    onToggle={() => setExpandedId(isExpanded ? null : row.id)}
                    onDelete={() => handleDelete(row.id)}
                    isDeleting={deletingId === row.id}
                  />
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function HistoryRow({ row, isExpanded, onToggle, onDelete, isDeleting }) {
  const riskColor = RISK_COLORS[row.risk_level] || '#6366f1';
  const ts = row.timestamp ? new Date(row.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—';

  const featureEntries = [
    ['Gender', row.gender],
    ['Age', row.age],
    ['Tenure', row.tenure],
    ['Balance', row.balance],
    ['Products', row.num_products],
    ['Credit Card', row.has_cr_card],
    ['Active Member', row.is_active],
    ['Salary', row.est_salary],
  ].filter(([, v]) => v !== null && v !== undefined);

  return (
    <>
      <tr className={`${styles.row} ${isExpanded ? styles.rowExpanded : ''}`} onClick={onToggle}>
        <td>
          <button className={styles.expandBtn}>
            {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
        </td>
        <td className={styles.dateCell}>{ts}</td>
        <td>
          <span className={`${styles.predBadge} ${row.prediction === 'Churn' ? styles.churnBadge : styles.stayBadge}`}>
            {row.prediction === 'Churn' ? <AlertTriangle size={14} /> : <ShieldCheck size={14} />}
            {row.prediction}
          </span>
        </td>
        <td className={styles.probCell}>{row.probability != null ? `${(row.probability * 100).toFixed(1)}%` : '—'}</td>
        <td>
          <span className={styles.riskTag} style={{ color: riskColor, background: `${riskColor}18` }}>
            {row.risk_level}
          </span>
        </td>
        <td className={styles.sourceCell}>{row.source || 'manual'}</td>
        <td>
          <button
            className={styles.deleteBtn}
            onClick={(e) => { e.stopPropagation(); onDelete(); }}
            disabled={isDeleting}
            title="Delete entry"
          >
            {isDeleting ? <Loader2 size={16} className={styles.spinner} /> : <Trash2 size={16} />}
          </button>
        </td>
      </tr>
      {isExpanded && (
        <tr className={styles.expandedRow}>
          <td colSpan={7}>
            <div className={styles.expandedContent}>
              <h4 className={styles.detailTitle}>Customer Features</h4>
              <div className={styles.detailGrid}>
                {featureEntries.map(([label, val]) => (
                  <div key={label} className={styles.detailItem}>
                    <span className={styles.detailLabel}>{label}</span>
                    <span className={styles.detailValue}>{typeof val === 'number' ? val.toLocaleString() : val}</span>
                  </div>
                ))}
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}
