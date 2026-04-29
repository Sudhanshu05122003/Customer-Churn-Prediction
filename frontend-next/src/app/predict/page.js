'use client';
import { useState, useEffect, useCallback } from 'react';
import { churnApi } from '@/lib/api';
import { Zap, Loader2, X, TrendingUp, TrendingDown, AlertTriangle, ShieldCheck, Info, Lightbulb, Activity, RotateCcw } from 'lucide-react';
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
  const [activeTab, setActiveTab] = useState('insights'); // 'insights' or 'simulator'

  // Fetch schema on mount
  useEffect(() => {
    churnApi.getSchema()
      .then((data) => {
        setSchema(data);
        const defaults = {};
        (data.features || []).forEach(f => {
          if (f.type === 'categorical') {
            defaults[f.name] = f.categories?.[0] || '';
          } else {
            defaults[f.name] = f.mean || '';
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

  const runPrediction = useCallback(async (currentData) => {
    try {
      const payload = {};
      const isDefault = schema?.model_type === 'default';

      (schema.features || []).forEach(f => {
        const val = currentData[f.name];
        if (f.type === 'categorical') {
          if (isDefault) {
            const idx = f.categories?.indexOf(val);
            payload[f.name] = idx === -1 ? 0 : idx;
          } else {
            payload[f.name] = val;
          }
        } else {
          payload[f.name] = parseFloat(val) || 0;
        }
      });

      const data = await churnApi.predict(payload);
      setResult(data);
      return data;
    } catch (err) {
      setError(err.message || 'Prediction failed');
    }
  }, [schema]);

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    setError('');
    setLoading(true);
    setResult(null);
    await runPrediction(formData);
    setLoading(false);
  };

  // What-If Simulator Handler
  const handleSimChange = async (name, value) => {
    const updatedData = { ...formData, [name]: value };
    setFormData(updatedData);
    // Debounce or just run if it's small
    await runPrediction(updatedData);
  };

  if (schemaLoading) {
    return (
      <div className={styles.loadingWrap}>
        <div className={styles.pulse} />
        <p>Initializing AI Engine…</p>
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
          <Activity size={18} /> High-fidelity churn analysis 
          {schema?.model_type === 'custom' && <span className={styles.badge}>Custom Model</span>}
        </p>
      </div>

      {error && <div className={styles.errorBanner}>{error}</div>}

      <div className={styles.formContainer}>
        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.fieldsGrid}>
            {(schema?.features || []).map((f) => (
              <div key={f.name} className={styles.field}>
                <label className={styles.label}>
                  {f.name.replace(/([A-Z])/g, ' $1').trim()}
                  {f.name === 'Tenure' && <span className={styles.hint}> (Months)</span>}
                </label>

                {/* Only show dropdown for specific requested fields */}
                {f.type === 'categorical' && ['Gender', 'HasCrCard', 'IsActiveMember'].includes(f.name) ? (
                  <select
                    value={formData[f.name] || ''}
                    onChange={(e) => handleChange(f.name, e.target.value)}
                    className={styles.select}
                  >
                    {(f.categories || []).map(opt => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="number"
                    value={formData[f.name] || ''}
                    onChange={(e) => handleChange(f.name, e.target.value)}
                    placeholder={f.name === 'Balance' ? 'e.g. 50000' : 'Enter value'}
                    className={styles.input}
                    required
                  />
                )}

              </div>
            ))}
          </div>

          <button type="submit" className={styles.submitBtn} disabled={loading}>
            {loading ? <Loader2 size={20} className={styles.spinner} /> : <><Zap size={18} /> Analyze Customer</>}
          </button>
        </form>
      </div>

      {/* Result Modal Overlay */}
      {result && (
        <div className={styles.overlay}>
          <div className={styles.resultCard}>
            <button className={styles.closeBtn} onClick={() => setResult(null)}><X size={20} /></button>

            <div className={styles.resultHeader}>
              <div
                className={styles.resultBadge}
                style={{ background: riskStyle?.bg, color: riskStyle?.color, borderColor: riskStyle?.border }}
              >
                {result.prediction === 'Churn' ? <AlertTriangle size={24} /> : <ShieldCheck size={24} />}
                {result.prediction}
              </div>
              <div className={styles.resultMeta}>
                {result.risk_level === 'Critical' || result.risk_level === 'High' ? (
                  <span className={styles.resultRisk} style={{ color: riskStyle?.color }}>
                    ⚠️ {result.risk_level} Risk: Immediate action recommended
                  </span>
                ) : result.risk_level === 'Medium' ? (
                  <span className={styles.resultRisk} style={{ color: riskStyle?.color }}>
                    ⚠️ {result.risk_level} Risk: Monitor closely
                  </span>
                ) : (
                  <span className={styles.resultRisk} style={{ color: riskStyle?.color }}>
                    ✅ Healthy: No immediate action needed
                  </span>
                )}
              </div>
            </div>

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

            {/* Tabs */}
            <div className={styles.tabs}>
              <div 
                className={`${styles.tab} ${activeTab === 'insights' ? styles.tabActive : ''}`}
                onClick={() => setActiveTab('insights')}
              >
                Insights & Strategy
              </div>
              <div 
                className={`${styles.tab} ${activeTab === 'simulator' ? styles.tabActive : ''}`}
                onClick={() => setActiveTab('simulator')}
              >
                What-If Simulator
              </div>
            </div>

            {activeTab === 'insights' ? (() => {
              const strategies = result.suggestions || [];
              const summary = strategies.find(s => s._summary);
              const actionItems = strategies.filter(s => !s._summary);
              const PRIORITY_COLORS = {
                critical: { bg: 'var(--danger-bg)', color: 'var(--danger-text)', label: '🔴 Critical' },
                high: { bg: 'var(--warning-bg)', color: 'var(--warning-text)', label: '🟠 High' },
                medium: { bg: 'var(--primary-bg)', color: 'var(--primary-text)', label: '🔵 Medium' },
                low: { bg: 'var(--success-bg)', color: 'var(--success-text)', label: '🟢 Low' },
              };

              return (
                <div className={styles.insightsView}>
                  {/* Summary Projection Card */}
                  {summary && (
                    <div style={{
                      background: 'var(--primary-bg)', border: '1px solid rgba(99,102,241,0.2)',
                      borderRadius: '20px', padding: '24px', marginBottom: '24px',
                    }}>
                      <h4 style={{ fontSize: '0.85rem', fontWeight: '600', color: 'var(--primary-text)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '16px' }}>
                        📊 Risk Projection After Strategies
                      </h4>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
                        <div style={{ textAlign: 'center' }}>
                          <div style={{ fontSize: '2rem', fontWeight: '800', color: 'var(--danger-text)' }}>{summary.current_risk_pct}%</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Current Risk</div>
                        </div>
                        <div style={{ fontSize: '1.5rem', color: 'var(--text-muted)' }}>→</div>
                        <div style={{ textAlign: 'center' }}>
                          <div style={{ fontSize: '2rem', fontWeight: '800', color: 'var(--success-text)' }}>{summary.projected_risk_pct}%</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Projected Risk</div>
                        </div>
                        <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
                          <div style={{ fontSize: '1.2rem', fontWeight: '700', color: 'var(--success-text)' }}>
                            ↓ {summary.total_reduction_pct}% reduction
                          </div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                            New Level: <span style={{ fontWeight: '600', color: 'var(--primary-text)' }}>{summary.projected_level}</span>
                          </div>
                        </div>
                      </div>
                      {/* Risk bar visualization */}
                      <div style={{ marginTop: '16px', height: '8px', background: 'var(--input-bg)', borderRadius: '4px', overflow: 'hidden', position: 'relative' }}>
                        <div style={{ width: `${summary.current_risk_pct}%`, height: '100%', background: 'rgba(239,68,68,0.3)', borderRadius: '4px', position: 'absolute' }} />
                        <div style={{ width: `${summary.projected_risk_pct}%`, height: '100%', background: '#10b981', borderRadius: '4px', position: 'absolute', transition: 'width 1s ease' }} />
                      </div>
                    </div>
                  )}

                  {/* Strategy Cards */}
                  <h4 style={{ fontSize: '1rem', fontWeight: '700', marginBottom: '16px', display: 'flex', gap: '8px', color: 'var(--text-primary)' }}>
                    <Lightbulb size={18} color="#10b981" /> Recommended Actions
                  </h4>
                  <div className={styles.suggestionList}>
                    {actionItems.length > 0 ? actionItems.map((s, i) => {
                      const pStyle = PRIORITY_COLORS[s.priority] || PRIORITY_COLORS.medium;
                      return (
                        <div key={i} style={{
                          background: 'var(--card-bg)', border: '1px solid var(--card-border)',
                          borderRadius: '18px', padding: '20px', transition: 'all 0.2s',
                        }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px', flexWrap: 'wrap', gap: '8px' }}>
                            <div>
                              <h5 style={{ fontSize: '1rem', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '4px' }}>{s.action}</h5>
                              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: '1.5' }}>{s.description}</p>
                            </div>
                            <span style={{
                              background: pStyle.bg, color: pStyle.color,
                              padding: '3px 10px', borderRadius: '99px', fontSize: '0.7rem', fontWeight: '600', whiteSpace: 'nowrap',
                            }}>
                              {pStyle.label}
                            </span>
                          </div>

                          {/* Offer Badge */}
                          <div style={{
                            background: 'var(--success-bg)', border: '1px solid rgba(16,185,129,0.15)',
                            borderRadius: '12px', padding: '10px 14px', marginBottom: '12px',
                            display: 'flex', alignItems: 'center', gap: '8px',
                          }}>
                            <ShieldCheck size={16} style={{ color: 'var(--success-text)', flexShrink: 0 }} />
                            <span style={{ fontSize: '0.85rem', fontWeight: '600', color: 'var(--success-text)' }}>
                              Offer: {s.offer}
                            </span>
                          </div>

                          {/* Risk Reduction Bar */}
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', width: '90px', flexShrink: 0 }}>Risk Reduction</span>
                            <div style={{ flex: 1, height: '6px', background: 'var(--input-bg)', borderRadius: '3px', overflow: 'hidden' }}>
                              <div style={{
                                width: `${Math.min(s.risk_reduction_pct * 3, 100)}%`,
                                height: '100%', background: '#10b981', borderRadius: '3px',
                                transition: 'width 0.8s ease',
                              }} />
                            </div>
                            <span style={{ fontSize: '0.85rem', fontWeight: '700', color: 'var(--success-text)', width: '50px', textAlign: 'right' }}>
                              -{s.risk_reduction_pct}%
                            </span>
                          </div>
                        </div>
                      );
                    }) : (
                      <div className={styles.suggestionItem}>
                        <ShieldCheck size={18} style={{ flexShrink: 0 }} /> No specific strategies needed — customer is healthy.
                      </div>
                    )}
                  </div>

                  {/* SHAP Drivers */}
                  <div className={styles.shapSection}>
                    <h3 className={styles.shapTitle}><Info size={16} /> Key Drivers</h3>
                    <div className={styles.shapList}>
                      {(result.explanation || []).slice(0, 5).map((item, i) => {
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
                              {isPositive ? <TrendingUp size={14} color="#ef4444" /> : <TrendingDown size={14} color="#10b981" />}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              );
            })()
            : (
              <div className={styles.simulatorView}>
                <div className={styles.simulatorGrid}>
                  {(schema.features || []).filter(f => f.type === 'numeric').slice(0, 6).map(f => (
                    <div key={f.name} className={styles.simField}>
                      <label className={styles.label}>
                        {f.name.replace(/([A-Z])/g, ' $1').trim()}
                        <span className={styles.hint}>{formData[f.name]}</span>
                      </label>
                      <input 
                        type="range"
                        min={f.min || 0}
                        max={f.max || (f.name === 'Balance' ? 250000 : 100)}
                        value={formData[f.name] || 0}
                        onChange={(e) => handleSimChange(f.name, e.target.value)}
                        className={styles.simSlider}
                      />
                    </div>
                  ))}
                </div>
                <p style={{ marginTop: '24px', color: 'var(--text-muted)', fontSize: '0.85rem', fontStyle: 'italic' }}>
                  * Move sliders to see how changing customer attributes affects the risk profile in real-time.
                </p>
              </div>
            )}
            
            <button className={styles.resetBtn} style={{ marginTop: '32px', opacity: 0.5, border: 'none', background: 'none', color: 'var(--text-primary)', cursor: 'pointer', display: 'flex', gap: '8px', alignItems: 'center' }} onClick={() => setResult(null)}>
               <RotateCcw size={14} /> Back to Form
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
