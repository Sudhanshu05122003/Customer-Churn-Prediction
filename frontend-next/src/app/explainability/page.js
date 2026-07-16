'use client';
import { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, ScatterChart, Scatter } from 'recharts';
import { Brain, HelpCircle, Activity, Search, ShieldCheck } from 'lucide-react';
import styles from './explainability.module.css';

export default function ExplainabilityPage() {
  const [activeTab, setActiveTab] = useState('global');
  const [customerId, setCustomerId] = useState('CUST_48293');
  const [individualResult, setIndividualResult] = useState(null);

  // Global feature importance mock data
  const globalImportanceData = [
    { feature: 'Balance', score: 85 },
    { feature: 'Tenure', score: 72 },
    { feature: 'IsActiveMember', score: 68 },
    { feature: 'Age', score: 54 },
    { feature: 'EstimatedSalary', score: 40 },
    { feature: 'NumOfProducts', score: 32 }
  ];

  // Scatter dependence data
  const dependenceData = [
    { balance: 10000, prob: 0.12 },
    { balance: 25000, prob: 0.18 },
    { balance: 50000, prob: 0.28 },
    { balance: 75000, prob: 0.42 },
    { balance: 100000, prob: 0.61 },
    { balance: 125000, prob: 0.73 },
    { balance: 150000, prob: 0.82 }
  ];

  const handleSearchCustomer = (e) => {
    e.preventDefault();
    // Generate simulated waterfall elements
    setIndividualResult({
      id: customerId,
      probability: 78,
      riskLevel: 'High',
      factors: [
        { factor: 'Base Value', value: 20, type: 'base' },
        { factor: 'Low Tenure (+15%)', value: 15, type: 'positive' },
        { factor: 'High Account Balance (+25%)', value: 25, type: 'positive' },
        { factor: 'Inactive member (+20%)', value: 20, type: 'positive' },
        { factor: 'Multiple products (-2%)', value: -2, type: 'negative' }
      ]
    });
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.heading}>SHAP Explainability Center</h1>
        <p className={styles.subheading}>Deconstruct model parameters to interpret the core business drivers behind churn events.</p>
      </div>

      <div className={styles.tabs}>
        <button 
          onClick={() => setActiveTab('global')} 
          className={`${styles.tab} ${activeTab === 'global' ? styles.activeTab : ''}`}
        >
          <Activity size={18} /> Global Importance
        </button>
        <button 
          onClick={() => setActiveTab('individual')} 
          className={`${styles.tab} ${activeTab === 'individual' ? styles.activeTab : ''}`}
        >
          <Search size={18} /> Individual Customer
        </button>
        <button 
          onClick={() => setActiveTab('dependence')} 
          className={`${styles.tab} ${activeTab === 'dependence' ? styles.activeTab : ''}`}
        >
          <HelpCircle size={18} /> Dependence Plots
        </button>
      </div>

      {activeTab === 'global' && (
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <h2>Overall Feature Importance</h2>
          </div>
          <p className={styles.tabDesc}>Calculates how heavily each individual feature column influences the classifier's risk predictions.</p>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={globalImportanceData} layout="vertical" margin={{ left: 50, right: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--card-border)" horizontal={false} />
              <XAxis type="number" tick={{ fill: 'var(--text-secondary)' }} />
              <YAxis dataKey="feature" type="category" tick={{ fill: 'var(--text-secondary)' }} />
              <Tooltip />
              <Bar dataKey="score" fill="var(--primary)" radius={[0, 8, 8, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {activeTab === 'individual' && (
        <div className={styles.grid}>
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <h2>Find Customer Impact</h2>
            </div>
            <form onSubmit={handleSearchCustomer} className={styles.searchForm}>
              <input 
                type="text" 
                placeholder="Enter Customer ID..." 
                value={customerId}
                onChange={(e) => setCustomerId(e.target.value)}
                className={styles.input}
              />
              <button type="submit" className={styles.searchBtn}>Search</button>
            </form>

            {individualResult ? (
              <div className={styles.resultWrap}>
                <div className={styles.scoreRow}>
                  <div>
                    <span className={styles.scoreLabel}>Predicted Churn Risk</span>
                    <h3 className={styles.scoreVal} style={{color: '#ef4444'}}>{individualResult.probability}%</h3>
                  </div>
                  <span className={styles.riskBadge}>{individualResult.riskLevel} Risk</span>
                </div>

                <div className={styles.waterfallWrap}>
                  <span className={styles.waterfallTitle}>Waterfall Attribution Contribution</span>
                  <div className={styles.waterfallList}>
                    {individualResult.factors.map((f, i) => (
                      <div key={i} className={styles.waterfallItem}>
                        <span className={styles.factorName}>{f.factor}</span>
                        <span className={`${styles.factorVal} ${f.type === 'positive' ? styles.plus : f.type === 'negative' ? styles.minus : ''}`}>
                          {f.value > 0 ? `+${f.value}%` : `${f.value}%`}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className={styles.searchPlaceholder}>
                <Search size={32} />
                <p>Search by Customer ID to analyze individual waterfall contribution vectors.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'dependence' && (
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <h2>Account Balance vs Churn Risk</h2>
          </div>
          <p className={styles.tabDesc}>Calculates risk correlation patterns based on financial account balance changes.</p>
          <ResponsiveContainer width="100%" height={300}>
            <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
              <CartesianGrid stroke="var(--card-border)" />
              <XAxis type="number" dataKey="balance" name="Account Balance" unit="₹" tick={{ fill: 'var(--text-secondary)' }} />
              <YAxis type="number" dataKey="prob" name="Churn Probability" unit="%" tick={{ fill: 'var(--text-secondary)' }} />
              <Tooltip cursor={{ strokeDasharray: '3 3' }} />
              <Scatter name="Balance Correlation" data={dependenceData} fill="#f59e0b" />
            </ScatterChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
