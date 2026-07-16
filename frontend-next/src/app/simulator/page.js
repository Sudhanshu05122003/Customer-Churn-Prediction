'use client';
import { useState, useEffect } from 'react';
import { churnApi } from '@/lib/api';
import { Sliders, Percent, Headphones, TrendingDown, ArrowRight, DollarSign, Activity, AlertCircle } from 'lucide-react';
import styles from './simulator.module.css';

export default function SimulatorPage() {
  const [params, setParams] = useState({ discount: 5, support: 6.0 });
  const [simResults, setSimResults] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchSimulation = async (currentParams) => {
    setLoading(true);
    try {
      const data = await churnApi.simulateCampaign(currentParams);
      setSimResults(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchSimulation(params);
    }, 400); // Debounce API calls by 400ms

    return () => clearTimeout(delayDebounceFn);
  }, [params]);

  const update = (key) => (e) => {
    setParams({ ...params, [key]: parseFloat(e.target.value) });
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.heading}>Scenario Simulator</h1>
        <p className={styles.subheading}>Model the impact of customer retention campaigns and customer support improvements in real-time</p>
      </div>

      <div className={styles.grid}>
        {/* Controls Card */}
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <Sliders size={20} className={styles.icon} />
            <h2>Retention Campaign Parameters</h2>
          </div>
          
          <div className={styles.controlGroup}>
            <div className={styles.labelRow}>
              <span className={styles.label}>
                <Percent size={16} /> Customer Discount Incentive
              </span>
              <span className={styles.value}>{params.discount}%</span>
            </div>
            <input 
              type="range" 
              min="0" 
              max="25" 
              value={params.discount} 
              onChange={update('discount')} 
              className={styles.slider} 
            />
            <p className={styles.hint}>Proposes a billing discount to at-risk accounts. Recommended: 5-15%</p>
          </div>

          <div className={styles.controlGroup}>
            <div className={styles.labelRow}>
              <span className={styles.label}>
                <Headphones size={16} /> Support Quality Level
              </span>
              <span className={styles.value}>{params.support} / 10</span>
            </div>
            <input 
              type="range" 
              min="1" 
              max="10" 
              step="0.5" 
              value={params.support} 
              onChange={update('support')} 
              className={styles.slider} 
            />
            <p className={styles.hint}>Simulates increasing support responsiveness & assigning CSMs. Baseline is 5.0</p>
          </div>
        </div>

        {/* Results Card */}
        <div className={`${styles.card} ${styles.resultsCard}`}>
          <div className={styles.cardHeader}>
            <Activity size={20} className={styles.activeIcon} />
            <h2>Projected Outcomes</h2>
          </div>

          {loading && <div className={styles.loaderOverlay}><div className={styles.spinner} /></div>}

          {simResults ? (
            <div className={styles.resultsWrap}>
              <div className={styles.metricRow}>
                <div className={styles.metricBlock}>
                  <span className={styles.metricLabel}>Expected Churn Rate</span>
                  <div className={styles.flexVal}>
                    <span className={styles.oldVal}>{simResults.original_churn_pct}%</span>
                    <ArrowRight size={18} className={styles.arrow} />
                    <span className={styles.newVal}>{simResults.simulated_churn_pct}%</span>
                  </div>
                </div>
                <div className={styles.metricBlock}>
                  <span className={styles.metricLabel}>Churn Decrease</span>
                  <span className={styles.benefitText}>-{simResults.churn_decrease_pct}% Churn</span>
                </div>
              </div>

              <div className={styles.divider} />

              <div className={styles.revenueRow}>
                <div className={styles.revBlock}>
                  <span className={styles.metricLabel}>Original Revenue at Risk</span>
                  <span className={styles.revValue}>₹{(simResults.original_revenue_at_risk || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}</span>
                </div>
                <div className={styles.revBlock}>
                  <span className={styles.metricLabel}>Simulated Revenue at Risk</span>
                  <span className={styles.revValue} style={{color: '#10b981'}}>₹{(simResults.simulated_revenue_at_risk || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}</span>
                </div>
              </div>

              <div className={styles.savingsCallout}>
                <DollarSign size={24} className={styles.savedIcon} />
                <div>
                  <span className={styles.savingsTitle}>Projected Revenue Saved</span>
                  <p className={styles.savingsValue}>₹{(simResults.revenue_saved || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}</p>
                </div>
              </div>
            </div>
          ) : (
            <div className={styles.noData}>
              <AlertCircle size={32} />
              <p>Please wait, loading simulation models...</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
