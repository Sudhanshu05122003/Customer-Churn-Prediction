'use client';
import { useState, useRef } from 'react';
import { churnApi } from '@/lib/api';
import { Upload, FileSpreadsheet, Brain, Check, ChevronRight, Loader2, X, BarChart, Target, AlertCircle } from 'lucide-react';
import styles from './train.module.css';

export default function TrainPage() {
  const [file, setFile] = useState(null);
  const [step, setStep] = useState('upload'); // upload, analyze, training, success
  const [analysis, setAnalysis] = useState(null);
  const [selectedTarget, setSelectedTarget] = useState('');
  const [selectedFeatures, setSelectedFeatures] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);
  const inputRef = useRef();

  const handleFileSelect = (e) => {
    const selected = e.target.files?.[0];
    if (selected && selected.name.endsWith('.csv')) {
      setFile(selected);
      setError('');
      startAnalysis(selected);
    } else if (selected) {
      setError('Please upload a .csv file');
    }
  };

  const startAnalysis = async (fileObj) => {
    setLoading(true);
    setError('');
    try {
      const data = await churnApi.analyzeColumns(fileObj);
      if (data.error) throw new Error(data.error);
      setAnalysis(data);
      setStep('analyze');
      
      // Auto-select a target if common names found
      const churnCol = data.columns.find(c => 
        ['churn', 'exited', 'target', 'label', 'status'].includes(c.name.toLowerCase())
      );
      if (churnCol) setSelectedTarget(churnCol.name);
      
      // Select all other numeric/categorical as features by default
      const features = data.columns
        .filter(c => c.name !== churnCol?.name && c.suggested_type !== 'text')
        .map(c => c.name);
      setSelectedFeatures(features);
    } catch (err) {
      setError(err.message || 'Failed to analyze CSV');
      setFile(null);
    } finally {
      setLoading(false);
    }
  };

  const toggleFeature = (name) => {
    if (name === selectedTarget) return;
    setSelectedFeatures(prev => 
      prev.includes(name) ? prev.filter(f => f !== name) : [...prev, name]
    );
  };

  const handleTrain = async () => {
    if (!selectedTarget || selectedFeatures.length === 0) {
      setError('Please select a target and at least one feature column');
      return;
    }
    setLoading(true);
    setError('');
    setStep('training');
    try {
      const data = await churnApi.trainModel(file, selectedFeatures, selectedTarget);
      if (data.error) throw new Error(data.error);
      setResult(data);
      setStep('success');
    } catch (err) {
      setError(err.message || 'Training failed');
      setStep('analyze');
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setFile(null);
    setStep('upload');
    setAnalysis(null);
    setResult(null);
    setError('');
  };

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.heading}>Train Your Model</h1>
        <p className={styles.subheading}>Upload your historical customer data to train a personalized churn engine</p>
      </div>

      {error && <div className={styles.errorBanner}>{error}</div>}

      <div className={styles.wizard}>
        {/* STEP: UPLOAD */}
        {step === 'upload' && (
          <div className={styles.dropZone} onClick={() => inputRef.current?.click()}>
            <input ref={inputRef} type="file" accept=".csv" onChange={handleFileSelect} hidden />
            <Upload size={48} className={styles.uploadIcon} />
            <p className={styles.dropText}>Click or drag CSV to start</p>
            <p className={styles.dropHint}>We'll analyze your columns to help you map features</p>
          </div>
        )}

        {/* STEP: ANALYZE & MAP */}
        {step === 'analyze' && analysis && (
          <div className={styles.analyzeSection}>
            <div className={styles.analyzeHeader}>
              <div className={styles.fileMeta}>
                <FileSpreadsheet size={24} />
                <span>{file?.name}</span>
                <small>{analysis.total_rows.toLocaleString()} rows detected</small>
              </div>
              <button className={styles.btnSecondary} onClick={reset}><X size={16} /> Cancel</button>
            </div>

            <div className={styles.mappingGrid}>
              {/* Target Selection */}
              <div className={styles.mappingColumn}>
                <h3 className={styles.sectionTitle}><Target size={16} /> 1. Select Churn Column (Target)</h3>
                <p className={styles.dropHint} style={{marginBottom: 12}}>The column that indicates if a customer left (e.g. "Exited", "Churned")</p>
                <select 
                  className={styles.targetSelect}
                  value={selectedTarget}
                  onChange={(e) => {
                    setSelectedTarget(e.target.value);
                    setSelectedFeatures(prev => prev.filter(f => f !== e.target.value));
                  }}
                >
                  <option value="">-- Choose Target --</option>
                  {analysis.columns.map(c => (
                    <option key={c.name} value={c.name}>{c.name} ({c.suggested_type})</option>
                  ))}
                </select>
              </div>

              {/* Feature Selection */}
              <div className={styles.mappingColumn} style={{marginTop: 20}}>
                <h3 className={styles.sectionTitle}><BarChart size={16} /> 2. Select Prediction Features</h3>
                <p className={styles.dropHint} style={{marginBottom: 12}}>Select inputs the model should use to predict churn</p>
                <div className={styles.columnsList}>
                  {analysis.columns.map(c => {
                    const isTarget = c.name === selectedTarget;
                    const isActive = selectedFeatures.includes(c.name);
                    return (
                      <div 
                        key={c.name} 
                        className={`${styles.columnCard} ${isActive ? styles.columnCardActive : ''} ${isTarget ? styles.columnCardDisabled : ''}`}
                        onClick={() => !isTarget && toggleFeature(c.name)}
                      >
                        <div className={styles.checkbox}>
                          {isActive && <Check size={14} />}
                        </div>
                        <div className={styles.columnInfo}>
                          <span className={styles.columnName}>{c.name}</span>
                          <span className={styles.columnType}>{c.suggested_type} • {c.unique_count} unique</span>
                        </div>
                        {isTarget && <span className={styles.targetBadge}>Target</span>}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className={styles.actions}>
              <button 
                className={styles.btnPrimary} 
                onClick={handleTrain}
                disabled={!selectedTarget || selectedFeatures.length === 0 || loading}
              >
                {loading ? <Loader2 size={20} className={styles.spinner} /> : <><Brain size={18} /> Start Training</>}
              </button>
            </div>
          </div>
        )}

        {/* STEP: TRAINING */}
        {step === 'training' && (
          <div className={styles.successCard}>
            <div className={styles.successIconWrap} style={{background: 'rgba(99,102,241,0.1)', color: '#6366f1'}}>
              <Brain size={40} className={styles.spinner} />
            </div>
            <h2>Training Custom Model...</h2>
            <p className={styles.subheading}>Building Random Forest, balancing classes, and evaluating performance.</p>
          </div>
        )}

        {/* STEP: SUCCESS */}
        {step === 'success' && result && (
          <div className={styles.successCard}>
            <div className={styles.successIconWrap}>
              <Check size={40} />
            </div>
            <h2 className={styles.heading}>Model Trained Successfully!</h2>
            <p className={styles.subheading}>Your custom engine is now live and ready for predictions.</p>

            <div className={styles.metricsGrid}>
              <div className={styles.metricItem}>
                <span className={styles.metricLabel}>Model Accuracy</span>
                <span className={styles.metricValue}>{(result.accuracy * 100).toFixed(1)}%</span>
              </div>
              <div className={styles.metricItem}>
                <span className={styles.metricLabel}>ROC AUC Score</span>
                <span className={styles.metricValue}>{result.auc || 'N/A'}</span>
              </div>
            </div>

            <div className={styles.importanceSection}>
              <h3 className={styles.sectionTitle}>Feature Importance</h3>
              <div className={styles.importanceList}>
                {result.feature_importance.slice(0, 5).map((item, i) => (
                  <div key={i} className={styles.importanceRow}>
                    <span className={styles.importanceName}>{item.feature}</span>
                    <div className={styles.importanceBarTrack}>
                      <div className={styles.importanceBar} style={{ width: `${item.importance * 100}%` }} />
                    </div>
                    <span className={styles.importanceVal}>{(item.importance * 100).toFixed(1)}%</span>
                  </div>
                ))}
              </div>
            </div>

            <div className={styles.actions} style={{justifyContent: 'center'}}>
              <button className={styles.btnPrimary} onClick={() => window.location.href = '/predict'}>
                Try Prediction <ChevronRight size={18} />
              </button>
              <button className={styles.btnSecondary} onClick={reset}>Train New Model</button>
            </div>
          </div>
        )}
      </div>

      <div className={styles.infoNote} style={{marginTop: 40, padding: 24, background: 'rgba(255,255,255,0.02)', borderRadius: 16, border: '1px solid rgba(255,255,255,0.05)'}}>
        <h4 style={{display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, color: '#e2e8f0'}}><AlertCircle size={18} /> Data Tips</h4>
        <ul style={{fontSize: '0.9rem', color: '#94a3b8', paddingLeft: 20}}>
          <li>Ensure your CSV has a column indicating if a customer churned (usually 0 or 1).</li>
          <li>For best results, upload at least 500 rows of historical data.</li>
          <li>The model will automatically handle numeric and categorical columns.</li>
        </ul>
      </div>
    </div>
  );
}
