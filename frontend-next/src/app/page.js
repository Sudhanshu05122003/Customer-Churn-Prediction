'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Brain, Zap, ShieldCheck, BarChart3, ChevronRight, Users, Activity, Sun, Moon } from 'lucide-react';
import styles from './landing.module.css';

export default function LandingPage() {
  const [theme, setTheme] = useState('dark');

  useEffect(() => {
    const saved = localStorage.getItem('theme') || 'dark';
    setTheme(saved);
    document.documentElement.setAttribute('data-theme', saved);
  }, []);

  const toggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    localStorage.setItem('theme', next);
    document.documentElement.setAttribute('data-theme', next);
  };

  return (
    <div className={styles.page}>
      {/* Floating theme toggle */}
      <button
        onClick={toggleTheme}
        style={{
          position: 'fixed', top: 24, right: 24, zIndex: 100,
          background: 'var(--card-bg)', border: '1px solid var(--card-border)',
          borderRadius: '50%', width: 44, height: 44,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer', color: 'var(--text-primary)',
          backdropFilter: 'blur(12px)', boxShadow: 'var(--glass-shadow)',
          transition: 'all 0.2s ease',
        }}
        title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
      >
        {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
      </button>

      <header className={styles.hero}>
        <div className={styles.heroGlow} />
        
        <div className={styles.badge}>Next-Gen AI Churn Prediction</div>
        
        <h1 className={styles.title}>
          Stop Customer Churn <br />
          Before It Happens
        </h1>
        
        <p className={styles.subtitle}>
          Leverage enterprise-grade Machine Learning and SHAP explainability to understand exactly why customers leave and how to keep them.
        </p>
        
        <div className={styles.ctaGroup}>
          <Link href="/register" className="btn-primary" style={{ padding: '16px 32px', fontSize: '1.1rem' }}>
            Get Started for Free <ChevronRight size={20} />
          </Link>
          <Link href="/login" className={styles.loginBtn}>
            Login to Dashboard
          </Link>
        </div>

        <div className={styles.heroImageContainer}>
          <Image 
            src="/hero.png" 
            alt="ChurnSense Analytics" 
            width={1000} 
            height={500} 
            className={styles.heroImage}
            priority
          />
        </div>
      </header>

      <section className={styles.features}>
        <h2 className={styles.sectionTitle}>Built for Data-Driven Teams</h2>
        <div className={styles.featureGrid}>
          <div className={styles.featureCard}>
            <div className={styles.iconWrap}><Brain size={24} /></div>
            <h3 className={styles.featureName}>Custom ML Models</h3>
            <p className={styles.featureText}>
              Upload your own data and train custom Random Forest engines tailored to your specific industry and customer behavior.
            </p>
          </div>

          <div className={styles.featureCard}>
            <div className={styles.iconWrap}><Zap size={24} /></div>
            <h3 className={styles.featureName}>SHAP Explainability</h3>
            <p className={styles.featureText}>
              Don't just predict—understand. Get clear visual explanations for every single prediction so you know exactly what drove the risk.
            </p>
          </div>

          <div className={styles.featureCard}>
            <div className={styles.iconWrap}><Activity size={24} /></div>
            <h3 className={styles.featureName}>Real-time Monitoring</h3>
            <p className={styles.featureText}>
              Monitor customer risk levels in real-time and get automated alerts when high-value accounts cross your safety thresholds.
            </p>
          </div>
        </div>
      </section>

      <section className={styles.statsSection}>
        <div className={styles.featureGrid} style={{ maxWidth: '900px', margin: '0 auto' }}>
          <div style={{ padding: '20px' }}>
            <h4 className={styles.statNumber}>98%</h4>
            <p className={styles.statLabel}>Prediction Accuracy</p>
          </div>
          <div style={{ padding: '20px' }}>
            <h4 className={styles.statNumber}>10k+</h4>
            <p className={styles.statLabel}>Customers Analyzed</p>
          </div>
          <div style={{ padding: '20px' }}>
            <h4 className={styles.statNumber}>40%</h4>
            <p className={styles.statLabel}>Average Churn Reduction</p>
          </div>
        </div>
      </section>

      <footer className={styles.footer}>
        <p>&copy; 2026 ChurnSense AI. All rights reserved.</p>
        <div style={{ marginTop: '12px', display: 'flex', justifyContent: 'center', gap: '20px' }}>
          <Link href="/privacy" style={{ opacity: 0.5 }}>Privacy Policy</Link>
          <Link href="/terms" style={{ opacity: 0.5 }}>Terms of Service</Link>
        </div>
      </footer>
    </div>
  );
}
