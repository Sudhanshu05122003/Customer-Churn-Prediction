'use client';
import { useEffect, useState, useRef, useMemo } from 'react';
import Link from 'next/link';
import { motion, useInView, useScroll, useTransform } from 'framer-motion';
import { Brain, Zap, Shield, BarChart3, ArrowRight, ChevronRight, Sun, Moon, Sparkles } from 'lucide-react';
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
  const particles = useMemo(() =>
    Array.from({ length: 30 }, (_, i) => ({
      id: i,
      left: `${Math.random() * 100}%`,
      size: 2 + Math.random() * 3,
      duration: 8 + Math.random() * 12,
      delay: Math.random() * 10,
      opacity: 0.2 + Math.random() * 0.4,
    })), []);

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

/* ── Data ── */
const FEATURES = [
  { icon: Brain, title: 'Custom ML Engine', text: "Train proprietary Random Forest and XGBoost models on your unique customer data. Our engine adapts to your industry's specific churn signatures for unmatched accuracy." },
  { icon: Shield, title: 'Privacy First', text: 'Enterprise-grade security and data encryption ensure your sensitive customer metrics are always protected.' },
  { icon: Zap, title: 'Instant Analysis', text: 'Process thousands of customer records in seconds with our optimized bulk prediction engine.' },
  { icon: BarChart3, title: 'SHAP Visual Explainability', text: "Don't just get a score—get the 'why'. Every prediction is backed by detailed SHAP value visualizations, revealing the exact behavioral drivers behind every risk assessment." },
];

const STATS = [
  { value: '98.2', suffix: '%', label: 'Model Accuracy' },
  { value: '$4.2', suffix: 'M', label: 'Revenue Protected' },
  { value: '45', suffix: '%', label: 'Churn Reduction' },
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
          <span className={styles.navBrandText}>ChurnSense</span>
        </Link>
        <div className={styles.navLinks}>
          <a href="#features" className={styles.navLink}>Features</a>
          <a href="#analytics" className={styles.navLink}>Analytics</a>
          <a href="#stats" className={styles.navLink}>Security</a>
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
            ChurnSense
          </motion.h2>

          <motion.div className={styles.heroBadge}
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.45, duration: 0.6 }}>
            <span className={styles.heroBadgeDot} />
            AI-Powered Customer Retention Intelligence
          </motion.div>

          <motion.h1 className={styles.heroTitle}
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.45, duration: 0.7 }}>
            Stop customer churn<br />with predictive precision.
          </motion.h1>

          <motion.p className={styles.heroSubtitle}
            initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.6 }}>
            Stop guessing why customers leave. ChurnSense uses advanced machine learning
            to identify at-risk accounts and reveal exactly how to keep them.
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

      {/* ── STATS ── */}
      <section id="stats" className={styles.statsSection}>
        <div className={styles.statGrid}>
          {STATS.map((s, i) => (
            <FadeIn key={s.label} delay={i * 0.12}>
              <div className={styles.statCard}>
                <h4 className={styles.statNumber}>
                  <Counter value={s.value} suffix={s.suffix} />
                </h4>
                <p className={styles.statLabel}>{s.label}</p>
              </div>
            </FadeIn>
          ))}
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
