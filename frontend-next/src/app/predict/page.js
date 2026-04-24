'use client';
import { useState, useEffect } from 'react';
import { churnApi } from '@/lib/api';
import { Zap, Loader2, X, TrendingUp, TrendingDown, AlertTriangle, ShieldCheck, Info } from 'lucide-react';
import styles from './predict.module.css';

const RISK_STYLE = {
  Critical: { bg: 'rgba(239,68,68,0.15)', color: '#f87171', border: 'rgba(239,68,68,0.3)' },
  High:     { bg: 'rgba(245,158,11,0.15)', color: '#fbbf24', border: 'rgba(245,158,11,0.3)' },
  Medium:   { bg: 'rgba(99,102,241,0.15)', color: '#818cf8', border: 'rgba(99,102,241,0.3)' },
  Low:      { bg: 'rgba(16,185,129,0.15)', color: '#34d399', border: 'rgba(16,185,129,0.3)' },
};

export default function PredictPage() {
  const [schema, setSchema] = useState(null);
  const [formData, setFormData] = useState({});
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [schemaLoading, setSchemaLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    churnApi.getSchema()
      .then((data) => {
        setSchema(data);
        const defaults = {};
        (data.features || []).forEach(f => {
          if (f.type === 'categorical') {
            defaults[f.name] = f.categories?.[0] || '';
          } else {
            defaults[f.name] = '';
          }
        });
        setFormData(defaults);
      })
      .catch(() => setError('Failed to load model schema'))
      .finally(() => setSchemaLoading(false));
  }, []);

  const handleChange = (name, value) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    setResult(null);
    try {
      // Convert values to proper types
      const payload = {};
      (schema.features || []).forEach(f => {
        const val = formData[f.name];
        if (f.type === 'categorical') {
          // Map Yes/No or Male/Female to 1/0
          if (f.categories && f.categories.length === 2) {
            payload[f.name] = f.categories.indexOf(val) === -1 ? 0 : f.categories.indexOf(val);
          } else {
            payload[f.name] = val;
          }
        } else {
          payload[f.name] = parseFloat(val) || 0;
        }
      });

      const data = await churnApi.predict(payload);
      setResult(data);
    } catch (err) {
      setError(err.message || 'Prediction failed');
    } finally {
      setLoading(false);
    }
  };

  if (schemaLoading) {
    return (
      <div className={styles.loadingWrap}>
        <div className={styles.pulse} />
        <p>Loading model schema…</p>
      </div>
    );
  }

  const riskStyle = result ? RISK_STYLE[result.risk_level] || RISK_STYLE.Medium : null;
  const maxAbsImpact = result?.explanation
    ? Math.max(...result.explanation.map(e => Math.abs(e.impact)), 0.001)
    : 1;

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.heading}>Predict Churn</h1>
        <p className={styles.subheading}>
          Enter customer features to predict churn likelihood
          {schema?.model_type === 'custom' && <span className={styles.badge}>Custom Model</span>}
        </p>
      </div>

      {error && <div className={styles.errorBanner}>{error}</div>}

      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.fieldsGrid}>
          {(schema?.features || []).map((f) => (
            <div key={f.name} className={styles.field}>
              <label className={styles.label}>
                {f.name.replace(/([A-Z])/g, ' $1').trim()}
                {f.type === 'numeric' && f.min !== undefined && (
                  <span className={styles.hint}>{f.min}–{f.max}</span>
                )}
              </label>
              {f.type === 'categorical' ? (
                <div className={styles.selectWrap}>
                  <select
                    id={`field-${f.name}`}
                    value={formData[f.name] || ''}
                    onChange={(e) => handleChange(f.name, e.target.value)}
                    className={styles.select}
                  >
                    {(f.categories || []).map(opt => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                </div>
              ) : (
                <input
                  id={`field-${f.name}`}
                  type="number"
                  value={formData[f.name] || ''}
                  onChange={(e) => handleChange(f.name, e.target.value)}
                  placeholder={f.min !== undefined ? `${f.min} – ${f.max}` : 'Enter value'}
                  className={styles.input}
                  min={f.min}
                  max={f.max}
                  step="any"
                  required
                />
              )}
            </div>
          ))}
        </div>

        <button id="predict-submit" type="submit" className={styles.submitBtn} disabled={loading}>
          {loading ? <Loader2 size={20} className={styles.spinner} /> : <><Zap size={18} /> Analyze Customer</>}
        </button>
      </form>

      {/* Result Modal Overlay */}
      {result && (
        <div className={styles.overlay} onClick={() => setResult(null)}>
          <div className={styles.resultCard} onClick={(e) => e.stopPropagation()}>
            <button className={styles.closeBtn} onClick={() => setResult(null)}><X size={20} /></button>

            <div className={styles.resultHeader}>
              <div
                className={styles.resultBadge}
                style={{ background: riskStyle?.bg, color: riskStyle?.color, borderColor: riskStyle?.border }}
              >
                {result.prediction === 'Churn' ? <AlertTriangle size={20} /> : <ShieldCheck size={20} />}
                {result.prediction}
              </div>
              <div className={styles.resultMeta}>
                <span className={styles.resultProb}>{(result.probability * 100).toFixed(1)}%</span>
                <span className={styles.resultRisk} style={{ color: riskStyle?.color }}>
                  {result.risk_level} Risk
                </span>
              </div>
            </div>

            {/* Probability Bar */}
            <div className={styles.probBarTrack}>
              <div
                className={styles.probBarFill}
                style={{
                  width: `${result.probability * 100}%`,
                  background: result.probability > 0.5
                    ? `linear-gradient(90deg, #f59e0b, #ef4444)`
                    : `linear-gradient(90deg, #10b981, #6366f1)`,
                }}
              />
            </div>

            {/* SHAP Explanation */}
            {result.explanation && result.explanation.length > 0 && (
              <div className={styles.shapSection}>
                <h3 className={styles.shapTitle}>
                  <Info size={16} /> Feature Impact (SHAP)
                </h3>
                <div className={styles.shapList}>
                  {result.explanation.slice(0, 8).map((item, i) => {
                    const pct = (Math.abs(item.impact) / maxAbsImpact) * 100;
                    const isPositive = item.impact > 0;
                    return (
                      <div key={i} className={styles.shapRow}>
                        <span className={styles.shapFeature}>{item.feature}</span>
                        <div className={styles.shapBarWrap}>
                          <div className={styles.shapBarCenter} />
                          <div
                            className={styles.shapBar}
                            style={{
                              width: `${pct / 2}%`,
                              background: isPositive ? '#ef4444' : '#10b981',
                              [isPositive ? 'left' : 'right']: '50%',
                            }}
                          />
                        </div>
                        <span className={styles.shapValue}>
                          {isPositive ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                          {item.impact > 0 ? '+' : ''}{item.impact.toFixed(4)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
