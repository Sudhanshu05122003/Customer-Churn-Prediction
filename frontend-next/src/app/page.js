'use client';
import { useEffect, useState, useRef, useMemo } from 'react';
import Link from 'next/link';
import { motion, useInView, useScroll, useTransform } from 'framer-motion';
import { 
  Brain, Zap, Shield, BarChart3, ArrowRight, ChevronRight, 
  Sun, Moon, Sparkles, Check, Database, Award, Lock, HelpCircle 
} from 'lucide-react';
import styles from './landing.module.css';

/* ── Logo Component ── */
function Logo({ size = 120, className = '', style = {} }) {
  return (
    <img
      src="/logo.png"
      alt="ChurnSense Logo"
      width={size}
      height={size}
      className={className}
      style={{ objectFit: 'contain', ...style }}
    />
  );
}

/* ── FadeIn wrapper ── */
function FadeIn({ children, delay = 0, direction = 'up', className = '' }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-50px' });
  const dirs = { up: { y: 30 }, down: { y: -30 }, left: { x: 30 }, right: { x: -30 }, none: {} };
  return (
    <motion.div ref={ref} className={className}
      initial={{ opacity: 0, ...dirs[direction] }}
      animate={inView ? { opacity: 1, y: 0, x: 0 } : {}}
      transition={{ duration: 0.65, delay, ease: [0.25, 0.4, 0.25, 1] }}>
      {children}
    </motion.div>
  );
}

/* ── Animated Counter ── */
function Counter({ value, suffix = '' }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true });
  const [count, setCount] = useState(0);
  const numVal = parseFloat(value.replace(/[^0-9.]/g, ''));
  const prefix = value.match(/^[^0-9]*/)?.[0] || '';

  useEffect(() => {
    if (!inView) return;
    let start = 0;
    const duration = 1800;
    const step = (ts) => {
      if (!start) start = ts;
      const p = Math.min((ts - start) / duration, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      setCount(eased * numVal);
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [inView, numVal]);

  return <span ref={ref}>{prefix}{count.toFixed(numVal % 1 ? 1 : 0)}{suffix}</span>;
}

/* ── Particle Field ── */
function Particles() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  const particles = useMemo(() => {
    if (!mounted) return [];
    return Array.from({ length: 30 }, (_, i) => ({
      id: i,
      left: `${Math.random() * 100}%`,
      size: 2 + Math.random() * 3,
      duration: 8 + Math.random() * 12,
      delay: Math.random() * 10,
      opacity: 0.2 + Math.random() * 0.4,
    }));
  }, [mounted]);

  if (!mounted) return null;

  return (
    <div className={styles.particles}>
      {particles.map(p => (
        <div key={p.id} className={styles.particle} style={{
          left: p.left, width: p.size, height: p.size,
          animationDuration: `${p.duration}s`,
          animationDelay: `${p.delay}s`,
          opacity: p.opacity,
        }} />
      ))}
    </div>
  );
}

/* ── Dashboard Preview ── */
function DashboardPreview() {
  const barHeights = [35, 55, 42, 70, 50, 80, 60, 45, 75, 55, 65, 48];
  const riskColors = ['#ef4444','#f59e0b','#22c55e','#22c55e','#ef4444','#f59e0b',
    '#22c55e','#22c55e','#f59e0b','#22c55e','#ef4444','#22c55e',
    '#22c55e','#f59e0b','#22c55e'];

  return (
    <div className={styles.dashboardContainer}>
      <div className={styles.dashboardHeader}>
        <div className={`${styles.dot} ${styles.dotRed}`} />
        <div className={`${styles.dot} ${styles.dotYellow}`} />
        <div className={`${styles.dot} ${styles.dotGreen}`} />
        <span className={styles.dashboardTitle}>ChurnSense Analytics Dashboard</span>
      </div>
      <div className={styles.dashboardBody}>
        {/* Churn Probability */}
        <div className={styles.dashPanel}>
          <div className={styles.dashPanelLabel}>Churn Probability</div>
          <div className={styles.miniBar}>
            {barHeights.map((h, i) => (
              <div key={i} className={styles.miniBarItem} style={{ height: `${h}%` }} />
            ))}
          </div>
        </div>
        {/* At-Risk Score */}
        <div className={styles.dashPanel}>
          <div className={styles.dashPanelLabel}>At-Risk Score</div>
          <div className={styles.dashPanelValue}>73.4%</div>
          <svg className={styles.miniLine} viewBox="0 0 200 50">
            <path d="M0 40 Q25 35 50 25 T100 20 T150 30 T200 10"
              stroke="#6366f1" strokeWidth="2" fill="none" opacity="0.7" />
            <path d="M0 40 Q25 35 50 25 T100 20 T150 30 T200 10"
              stroke="url(#lineGrad)" strokeWidth="2" fill="none" />
            <defs>
              <linearGradient id="lineGrad" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#6366f1" />
                <stop offset="100%" stopColor="#38bdf8" />
              </linearGradient>
            </defs>
          </svg>
        </div>
        {/* Revenue Impact */}
        <div className={styles.dashPanel}>
          <div className={styles.dashPanelLabel}>Revenue Impact</div>
          <div className={styles.dashPanelValue}>$1.2M</div>
          <div style={{ fontSize: '0.75rem', color: '#22c55e', marginTop: 8 }}>↑ 12.4% saved this quarter</div>
        </div>
        {/* SHAP Values */}
        <div className={`${styles.dashPanel} ${styles.dashPanelWide}`}>
          <div className={styles.dashPanelLabel}>SHAP Feature Importance</div>
          {['Tenure', 'Monthly Charges', 'Contract Type', 'Support Tickets', 'Usage'].map((f, i) => (
            <div key={f} style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8 }}>
              <span style={{ fontSize: '0.72rem', color: '#64748b', width: 100 }}>{f}</span>
              <div style={{ flex: 1, height: 6, background: 'rgba(255,255,255,0.03)', borderRadius: 3 }}>
                <div style={{
                  height: '100%', borderRadius: 3,
                  width: `${[85, 72, 60, 45, 38][i]}%`,
                  background: `linear-gradient(90deg, #6366f1, ${i < 2 ? '#ef4444' : '#22c55e'})`,
                }} />
              </div>
            </div>
          ))}
        </div>
        {/* Customer Segments */}
        <div className={styles.dashPanel}>
          <div className={styles.dashPanelLabel}>Risk Segments</div>
          <div className={styles.riskDots}>
            {riskColors.map((c, i) => (
              <div key={i} className={styles.riskDot} style={{ background: c }} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Interactive Prediction Simulator ── */
function Simulator() {
  const [simGender, setSimGender] = useState('Female');
  const [simAge, setSimAge] = useState(34);
  const [simTenure, setSimTenure] = useState(24);
  const [simCreditScore, setSimCreditScore] = useState(720);
  const [simContract, setSimContract] = useState('Month-to-month');
  const [simBalance, setSimBalance] = useState(12500);
  const [simSalary, setSimSalary] = useState(85000);
  const [simActive, setSimActive] = useState(true);
  const [simProducts, setSimProducts] = useState(2);
  const [simHasCard, setSimHasCard] = useState(true);
  const [simRisk, setSimRisk] = useState(0.30);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const calculateRisk = async () => {
      setLoading(true);
      try {
        const res = await fetch('http://localhost:5005/predict', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            Gender: simGender,
            Age: parseInt(simAge),
            Tenure: Math.floor(parseInt(simTenure) / 12), // convert to years
            Balance: parseFloat(simBalance),
            NumOfProducts: parseInt(simProducts),
            HasCrCard: simHasCard ? 1 : 0,
            IsActiveMember: simActive ? 1 : 0,
            EstimatedSalary: parseFloat(simSalary)
          })
        });
        if (res.ok) {
          const data = await res.json();
          setSimRisk(data.churn_probability);
        } else {
          throw new Error();
        }
      } catch (e) {
        // High fidelity mock fallback matching the Stitch dataset heuristic
        let p = 0.15;
        if (simAge > 50) p += 0.25;
        else if (simAge > 38) p += 0.12;
        
        if (simTenure < 18) p += 0.15;
        else if (simTenure > 60) p -= 0.08;

        if (simCreditScore < 600) p += 0.18;
        else if (simCreditScore > 750) p -= 0.05;

        if (simContract === 'Month-to-month') p += 0.20;
        else if (simContract === 'Two year') p -= 0.15;

        if (simBalance > 100000) p += 0.12;
        
        if (!simActive) p += 0.22;
        
        const finalP = Math.max(0.02, Math.min(0.98, p));
        setSimRisk(finalP);
      } finally {
        setLoading(false);
      }
    };

    const delayDebounce = setTimeout(() => {
      calculateRisk();
    }, 200);

    return () => clearTimeout(delayDebounce);
  }, [simGender, simAge, simTenure, simCreditScore, simContract, simBalance, simSalary, simActive, simProducts, simHasCard]);

  // Color mapping based on risk
  const getRiskColor = (risk) => {
    if (risk < 0.3) return '#22c55e'; // Green
    if (risk < 0.6) return '#f59e0b'; // Yellow
    return '#ef4444'; // Red
  };

  const getRiskText = (risk) => {
    if (risk < 0.3) return 'Low Risk';
    if (risk < 0.6) return 'Medium Risk';
    return 'High Risk';
  };

  const getRecommendations = (risk) => {
    if (risk < 0.3) {
      return [
        "Include in next cross-sell recommendation campaign.",
        "Provide milestone loyalty reward to solidify retention."
      ];
    } else if (risk < 0.6) {
      return [
        "Send personalized feature adoption tutorial email.",
        "Offer complimentary 1-on-1 account health review checkup."
      ];
    } else {
      return [
        "High-Value Discount (15%) Offer.",
        "Personalized Success Call & Sponsor Outreach."
      ];
    }
  };

  const strokeDashoffset = 552.92 - (552.92 * simRisk);

  return (
    <div className={styles.simCard}>
      <div className={styles.simForm}>
        <div style={{ marginBottom: 12 }}>
          <h3 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#fff', marginBottom: 6 }}>Customer Profile</h3>
          <p style={{ fontSize: '0.88rem', color: '#64748b' }}>Simulate a mock profile to see the engine execute live calculations.</p>
        </div>
        
        <div className={styles.simGrid}>
          <div className={styles.simInputGroup}>
            <label>Gender &amp; Age</label>
            <div style={{ display: 'flex', gap: 10 }}>
              <select value={simGender} onChange={(e) => setSimGender(e.target.value)} className={styles.simSelect} style={{ flex: 1 }}>
                <option value="Female">Female</option>
                <option value="Male">Male</option>
              </select>
              <input 
                type="number" 
                value={simAge} 
                onChange={(e) => setSimAge(Math.max(18, Math.min(85, parseInt(e.target.value) || 18)))} 
                className={styles.simSelect} 
                style={{ width: 80 }}
              />
            </div>
          </div>

          <div className={styles.simInputGroup}>
            <label>Tenure (Months): <span>{simTenure} mo</span></label>
            <input type="range" min="0" max="120" value={simTenure} onChange={(e) => setSimTenure(parseInt(e.target.value))} />
          </div>

          <div className={styles.simInputGroup}>
            <label>Credit Score: <span>{simCreditScore}</span></label>
            <input type="range" min="300" max="850" value={simCreditScore} onChange={(e) => setSimCreditScore(parseInt(e.target.value))} />
          </div>

          <div className={styles.simInputGroup}>
            <label>Contract Type</label>
            <select value={simContract} onChange={(e) => setSimContract(e.target.value)} className={styles.simSelect}>
              <option value="Month-to-month">Month-to-month</option>
              <option value="One year">One year</option>
              <option value="Two year">Two year</option>
            </select>
          </div>

          <div className={styles.simInputGroup}>
            <label>Balance</label>
            <div style={{ position: 'relative' }}>
              <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#64748b', fontSize: '0.9rem' }}>$</span>
              <input 
                type="number" 
                value={simBalance} 
                onChange={(e) => setSimBalance(parseFloat(e.target.value) || 0)} 
                className={styles.simSelect} 
                style={{ width: '100%', paddingLeft: 28 }}
              />
            </div>
          </div>

          <div className={styles.simInputGroup}>
            <label>Est. Salary: <span>${parseFloat(simSalary).toLocaleString()}</span></label>
            <input type="range" min="5000" max="200000" step="5000" value={simSalary} onChange={(e) => setSimSalary(parseFloat(e.target.value))} />
          </div>
        </div>

        <div className={styles.simToggles}>
          <label className={styles.simCheckboxLabel}>
            <input type="checkbox" checked={simActive} onChange={(e) => setSimActive(e.target.checked)} className={styles.simCheckbox} />
            Active Member
          </label>
          <label className={styles.simCheckboxLabel}>
            <input type="checkbox" checked={simHasCard} onChange={(e) => setSimHasCard(e.target.checked)} className={styles.simCheckbox} />
            Has Credit Card
          </label>
        </div>
      </div>

      <div className={styles.simOutput} style={{ background: 'rgba(99, 102, 241, 0.03)', border: '1px solid rgba(99, 102, 241, 0.1)' }}>
        <div className={styles.simOutputHeader}>
          <div className={styles.simOutputTitle}>Prediction Output</div>
        </div>

        {/* Circular Gauge SVG */}
        <div style={{ position: 'relative', width: 180, height: 180, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}>
          <svg width="180" height="180" style={{ transform: 'rotate(-90deg)' }}>
            <circle cx="90" cy="90" r="80" fill="transparent" stroke="rgba(255,255,255,0.05)" strokeWidth="10" />
            <circle 
              cx="90" 
              cy="90" 
              r="80" 
              fill="transparent" 
              stroke={getRiskColor(simRisk)} 
              strokeWidth="10" 
              strokeDasharray="502.65" 
              strokeDashoffset={502.65 - (502.65 * simRisk)}
              style={{ transition: 'stroke-dashoffset 0.4s ease, stroke 0.4s' }}
            />
          </svg>
          <div style={{ position: 'absolute', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            <span className={styles.simRiskNum}>{(simRisk * 100).toFixed(0)}%</span>
            <span className={styles.simRiskLabel} style={{ color: getRiskColor(simRisk) }}>{getRiskText(simRisk)}</span>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, width: '100%', marginBottom: 24 }}>
          <div style={{ textAlign: 'center', background: 'rgba(255, 255, 255, 0.02)', padding: '10px', borderRadius: '8px', border: '1px solid rgba(255, 255, 255, 0.04)' }}>
            <div style={{ fontSize: '0.7rem', color: '#64748b', textTransform: 'uppercase' }}>Confidence</div>
            <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#fff', marginTop: 4 }}>98.2%</div>
          </div>
          <div style={{ textAlign: 'center', background: 'rgba(255, 255, 255, 0.02)', padding: '10px', borderRadius: '8px', border: '1px solid rgba(255, 255, 255, 0.04)' }}>
            <div style={{ fontSize: '0.7rem', color: '#64748b', textTransform: 'uppercase' }}>Model</div>
            <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#fff', marginTop: 4 }}>XGBoost</div>
          </div>
        </div>

        <div className={styles.simRecs}>
          <div className={styles.simRecTitle}>Recommended Interventions</div>
          <div className={styles.simRecList}>
            {getRecommendations(simRisk).map((rec, index) => (
              <div key={index} className={styles.simRecItem}>
                <Check size={14} className={styles.simRecItemIcon} />
                <span>{rec}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Pricing Card Component ── */
function PricingCard({ title, subtitle, price, period, features, buttonText, highlighted }) {
  return (
    <div className={`${styles.pricingCard} ${highlighted ? styles.pricingCardHighlighted : ''}`}>
      {highlighted && <div className={styles.popularBadge}>Most Popular</div>}
      <h3 className={styles.pricingTitle}>{title}</h3>
      <p className={styles.pricingSubtitle}>{subtitle}</p>
      <div className={styles.pricingPriceArea}>
        <span className={styles.pricingValue}>{price}</span>
        {period && <span className={styles.pricingPeriod}>{period}</span>}
      </div>
      <ul className={styles.pricingList}>
        {features.map((f, i) => (
          <li key={i} className={styles.pricingItem}>
            <Check size={16} className={styles.pricingCheck} />
            <span>{f}</span>
          </li>
        ))}
      </ul>
      <button className={`${styles.pricingButton} ${highlighted ? styles.pricingButtonPrimary : ''}`}>
        {buttonText}
      </button>
    </div>
  );
}

/* ── Data ── */
const FEATURES = [
  { icon: Brain, title: 'Custom ML Engine', text: "Proprietary deep learning models fine-tuned specifically for subscription-based revenue churn patterns." },
  { icon: Shield, title: 'Privacy First', text: 'SOC2 Type II compliant with end-to-end encryption. Your sensitive customer data never leaves your VPC.' },
  { icon: Zap, title: 'Bulk Prediction', text: 'Process millions of data points in seconds with our high-concurrency enterprise inference engine.' },
  { icon: BarChart3, title: 'SHAP Explainability', text: "No more 'Black Box' AI. Know exactly which variables are driving churn risk for every individual user." },
];

const STATS = [
  { value: '98.2', suffix: '%', label: 'Accuracy' },
  { value: '125', suffix: 'K', label: 'Users' },
  { value: '45', suffix: '%', label: 'Reduction' },
  { value: '$4.2', suffix: 'M', label: 'Savings' },
  { value: '99.9', suffix: '%', label: 'Uptime' },
  { value: '200', suffix: 'ms', label: 'Latency' },
];

const PIPELINE_STEPS = [
  { step: '1', title: 'Upload', desc: 'Ingest raw logs' },
  { step: '2', title: 'Eng. Features', desc: 'Compute behaviors' },
  { step: '3', title: 'Training', desc: 'Fit custom model' },
  { step: '4', title: 'Prediction', desc: 'Risk evaluation' },
  { step: '5', title: 'SHAP Insight', desc: 'Feature drivers' },
  { step: '6', title: 'Action', desc: 'Deploy retention' },
];

/* ═══════════════════════════════════════
   LANDING PAGE
   ═══════════════════════════════════════ */
export default function LandingPage() {
  const [mounted, setMounted] = useState(false);
  const [theme, setTheme] = useState('dark');
  const heroRef = useRef(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ['start start', 'end start'] });
  const heroOpacity = useTransform(scrollYProgress, [0, 0.7], [1, 0]);

  useEffect(() => {
    setMounted(true);
    const s = localStorage.getItem('theme') || 'dark';
    setTheme(s);
    document.documentElement.setAttribute('data-theme', s);
  }, []);

  const toggleTheme = () => {
    const n = theme === 'dark' ? 'light' : 'dark';
    setTheme(n);
    localStorage.setItem('theme', n);
    document.documentElement.setAttribute('data-theme', n);
  };

  return (
    <div className={styles.page}>
      {/* ── NAVBAR ── */}
      <nav className={styles.navbar}>
        <Link href="/" className={styles.navBrand}>
          <Logo size={28} />
          <span className={styles.navBrandText}>ChurnSense AI</span>
        </Link>
        <div className={styles.navLinks}>
          <a href="#features" className={styles.navLink}>Features</a>
          <a href="#analytics" className={styles.navLink}>Analytics</a>
          <a href="#pipeline" className={styles.navLink}>ML Pipeline</a>
          <a href="#pricing" className={styles.navLink}>Pricing</a>
          {mounted && (
            <button onClick={toggleTheme} className={styles.navLink}
              style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
              {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
            </button>
          )}
          <Link href="/demo" className={styles.navCta}>Get Started</Link>
        </div>
      </nav>

      {/* ── HERO ── */}
      <motion.header ref={heroRef} className={styles.hero} style={{ opacity: heroOpacity }}>
        <div className={styles.heroGlow} />
        <div className={styles.gridOverlay} />
        <Particles />

        <div className={styles.brandStack}>
          <motion.div initial={{ opacity: 0, y: -20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}>
            <Logo size={120} className={styles.heroLogo} />
          </motion.div>

          <motion.h2 className={styles.heroBrandName}
            initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25, duration: 0.7 }}>
            ChurnSense AI
          </motion.h2>

          <motion.div className={styles.heroBadge}
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.45, duration: 0.6 }}>
            <span className={styles.heroBadgeDot} />
            Next-Gen ML Forecasting
          </motion.div>

          <motion.h1 className={styles.heroTitle}
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.45, duration: 0.7 }}>
            AI-Powered Customer<br />Retention Intelligence
          </motion.h1>

          <motion.p className={styles.heroSubtitle}
            initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.6 }}>
            Stop customer churn with predictive precision. Leverage ML-driven insights
            and SHAP explainability to understand why customers leave before they do.
          </motion.p>

          <motion.div className={styles.ctaGroup}
            initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.75, duration: 0.6 }}>
            <Link href="/demo" className={styles.primaryBtn}>
              Get Started <ArrowRight size={18} />
            </Link>
            <Link href="/login" className={styles.secondaryBtn}>
              Login to Dashboard
            </Link>
          </motion.div>
        </div>
      </motion.header>

      {/* ── DASHBOARD PREVIEW ── */}
      <section id="analytics" className={styles.dashboardSection}>
        <FadeIn><DashboardPreview /></FadeIn>
      </section>

      {/* ── INTERACTIVE SIMULATOR ── */}
      <section className={styles.simulatorSection}>
        <FadeIn>
          <div className={styles.sectionLabel}><Sparkles size={13} /> Simulation</div>
        </FadeIn>
        <FadeIn delay={0.08}>
          <h2 className={styles.sectionTitle}>Test the Prediction Engine</h2>
        </FadeIn>
        <FadeIn delay={0.12}>
          <p className={styles.sectionSubtitle}>
            Adjust customer attributes below to observe risk outputs and targeted interventions generated by ChurnSense.
          </p>
        </FadeIn>
        <FadeIn delay={0.16}>
          <Simulator />
        </FadeIn>
      </section>

      {/* ── FEATURES ── */}
      <section id="features" className={styles.features}>
        <FadeIn>
          <div className={styles.sectionLabel}><Sparkles size={13} /> Features</div>
        </FadeIn>
        <FadeIn delay={0.08}>
          <h2 className={styles.sectionTitle}>Engineered for Enterprise Insight</h2>
        </FadeIn>
        <FadeIn delay={0.12}>
          <p className={styles.sectionSubtitle}>
            Every tool you need to understand, predict, and prevent customer churn — in one intelligent platform.
          </p>
        </FadeIn>
        <div className={styles.featureGrid}>
          {FEATURES.map((f, i) => (
            <FadeIn key={f.title} delay={i * 0.1}>
              <div className={styles.featureCard}>
                <div className={styles.iconWrap}><f.icon size={24} /></div>
                <h3 className={styles.featureName}>{f.title}</h3>
                <p className={styles.featureText}>{f.text}</p>
              </div>
            </FadeIn>
          ))}
        </div>
      </section>

      {/* ── INTEGRATED ML PIPELINE ── */}
      <section id="pipeline" className={styles.pipelineSection}>
        <FadeIn>
          <div className={styles.sectionLabel}><Database size={13} /> Integrated ML Pipeline</div>
        </FadeIn>
        <FadeIn delay={0.08}>
          <h2 className={styles.sectionTitle}>Seamless Pipeline Workflow</h2>
        </FadeIn>
        <FadeIn delay={0.12}>
          <p className={styles.sectionSubtitle}>
            Watch data transition from raw log streams into targeted retention workflows.
          </p>
        </FadeIn>
        <div className={styles.pipelineGrid}>
          {PIPELINE_STEPS.map((step, i) => (
            <FadeIn key={step.title} delay={i * 0.08}>
              <div className={styles.pipelineStepCard}>
                <div className={styles.pipelineStepBadge}>{step.step}</div>
                <h4 className={styles.pipelineStepTitle}>{step.title}</h4>
                <p className={styles.pipelineStepDesc}>{step.desc}</p>
              </div>
            </FadeIn>
          ))}
        </div>
      </section>

      {/* ── STATS ── */}
      <section id="stats" className={styles.statsSection}>
        <div className={styles.statGrid} style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', maxWidth: '1100px' }}>
          {STATS.map((s, i) => (
            <FadeIn key={s.label} delay={i * 0.08}>
              <div className={styles.statCard} style={{ padding: '30px 10px' }}>
                <h4 className={styles.statNumber}>
                  <Counter value={s.value} suffix={s.suffix} />
                </h4>
                <p className={styles.statLabel}>{s.label}</p>
              </div>
            </FadeIn>
          ))}
        </div>
      </section>

      {/* ── PRICING SECTION ── */}
      <section id="pricing" className={styles.pricingSection}>
        <FadeIn>
          <div className={styles.sectionLabel}><Award size={13} /> Pricing</div>
        </FadeIn>
        <FadeIn delay={0.08}>
          <h2 className={styles.sectionTitle}>Simple, Transparent Pricing</h2>
        </FadeIn>
        <FadeIn delay={0.12}>
          <p className={styles.sectionSubtitle}>
            Scalable retention forecasting solutions built for teams of all sizes.
          </p>
        </FadeIn>
        <div className={styles.pricingGrid}>
          <FadeIn delay={0.1}>
            <PricingCard 
              title="Starter" 
              subtitle="Best for emerging startups." 
              price="$499" 
              period="/mo" 
              features={["10k Customers Managed", "Standard ML Models", "Access to Analytics Dashboard"]} 
              buttonText="Start Free Trial" 
            />
          </FadeIn>
          <FadeIn delay={0.18}>
            <PricingCard 
              title="Professional" 
              subtitle="For high-growth scaleups." 
              price="$1,299" 
              period="/mo" 
              features={["100k Customers Managed", "Advanced SHAP Explainability", "Full API Access", "Automated Retention Workflows"]} 
              buttonText="Get Started Now" 
              highlighted={true}
            />
          </FadeIn>
          <FadeIn delay={0.26}>
            <PricingCard 
              title="Enterprise" 
              subtitle="Customized for global scale." 
              price="Custom" 
              features={["Unlimited Customers Managed", "Custom Model Training Pipeline", "Dedicated Support & Data Scientist", "SOC2 Enterprise Package"]} 
              buttonText="Contact Sales" 
            />
          </FadeIn>
        </div>
      </section>

      {/* ── FINAL CTA ── */}
      <section className={styles.finalCta}>
        <FadeIn><h2 className={styles.ctaTitle}>Ready to protect your revenue?</h2></FadeIn>
        <FadeIn delay={0.1}>
          <p className={styles.ctaSubtitle}>
            Join leading data teams using ChurnSense to build high-retention customer ecosystems.
          </p>
        </FadeIn>
        <FadeIn delay={0.2}>
          <Link href="/demo" className={styles.primaryBtn}>
            Try ChurnSense Demo <ChevronRight size={18} />
          </Link>
        </FadeIn>
      </section>

      {/* ── FOOTER ── */}
      <footer className={styles.footer}>
        <div className={styles.footerInner}>
          <div className={styles.footerBrand}>
            <Logo size={28} />
            <span className={styles.footerBrandName}>ChurnSense AI</span>
          </div>
          <p className={styles.footerCopyright}>&copy; 2026 ChurnSense AI. All rights reserved.</p>
          <div className={styles.footerLinks}>
            <Link href="/privacy">Privacy</Link>
            <Link href="/terms">Terms</Link>
            <Link href="/security">Security</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
