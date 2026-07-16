'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { churnApi } from '../lib/api';

export default function LandingPage() {
  // Mobile Menu State
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Simulator Input States
  const [gender, setGender] = useState('Female');
  const [age, setAge] = useState('34');
  const [tenure, setTenure] = useState(10);
  const [balance, setBalance] = useState('12500');
  const [numOfProducts, setNumOfProducts] = useState(1);
  const [hasCrCard, setHasCrCard] = useState(true);
  const [isActiveMember, setIsActiveMember] = useState(true);
  const [estimatedSalary, setEstimatedSalary] = useState('50000');

  // Prediction API States
  const [loading, setLoading] = useState(false);
  const [prediction, setPrediction] = useState(null);
  const [error, setError] = useState(null);

  // Fetch prediction on input change (with debouncing)
  useEffect(() => {
    let active = true;
    const fetchPrediction = async () => {
      setLoading(true);
      setError(null);
      try {
        const payload = {
          Gender: gender === 'Female' ? 0 : (gender === 'Male' ? 1 : 2),
          Age: Math.max(18, Math.min(100, parseInt(age) || 34)),
          Tenure: Math.max(0, Math.min(12, parseInt(tenure) || 0)),
          Balance: Math.max(0.0, parseFloat(balance) || 0.0),
          NumOfProducts: Math.max(1, Math.min(100, parseInt(numOfProducts) || 1)),
          HasCrCard: hasCrCard ? 1 : 0,
          IsActiveMember: isActiveMember ? 1 : 0,
          EstimatedSalary: Math.max(0.0, parseFloat(estimatedSalary) || 0.0)
        };

        const res = await churnApi.predict(payload);
        if (active) {
          setPrediction(res);
        }
      } catch (err) {
        console.error("Prediction error:", err);
        if (active) {
          setError(err.message || "Failed to fetch prediction");
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    const timer = setTimeout(() => {
      fetchPrediction();
    }, 250);

    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [gender, age, tenure, balance, numOfProducts, hasCrCard, isActiveMember, estimatedSalary]);

  // Stats Animation Observer
  useEffect(() => {
    const stats = document.querySelectorAll('[data-target]');
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const target = entry.target;
          const val = parseFloat(target.dataset.target);
          const prefix = target.dataset.prefix || '';
          const suffix = target.dataset.suffix || '';
          let current = 0;
          const duration = 1000; // 1s animation duration
          const stepTime = 30;
          const steps = duration / stepTime;
          const increment = val / steps;
          
          const interval = setInterval(() => {
            current += increment;
            if (current >= val) {
              target.innerText = prefix + val + suffix;
              clearInterval(interval);
            } else {
              const decimals = val % 1 === 0 ? 0 : 1;
              target.innerText = prefix + current.toFixed(decimals) + suffix;
            }
          }, stepTime);
          observer.unobserve(target);
        }
      });
    }, { threshold: 0.1 });

    stats.forEach(s => observer.observe(s));
    return () => observer.disconnect();
  }, []);

  // Compute values for circular gauge visual preview
  const prob = prediction ? Math.round(prediction.probability * 100) : 30;
  const riskLevel = prediction ? prediction.risk_level : "Medium";
  const modelType = prediction ? (prediction.model_type === "custom" ? "Custom XGB" : "XGBoost") : "Random Forest";
  const offset = 552.92 - (552.92 * (prob / 100));

  return (
    <div className="bg-background text-on-background font-body-md selection:bg-primary-fixed min-h-screen">
      {/* TopNavBar */}
      <nav className="fixed top-0 w-full z-50 bg-surface/70 backdrop-blur-xl border-b border-outline-variant/10 shadow-sm">
        <div className="flex justify-between items-center px-margin-desktop py-unit-md max-w-container-max mx-auto">
          <div className="flex items-center gap-2">
            <img 
              alt="ChurnSense AI Logo" 
              className="h-8 w-8 object-contain" 
              src="/logo.png" 
            />
            <span className="text-headline-md font-headline-md font-bold text-primary">ChurnSense AI</span>
          </div>
          <div className="hidden md:flex gap-unit-lg items-center">
            <a className="font-label-md text-label-md text-on-surface-variant hover:text-primary transition-colors" href="#features">Features</a>
            <a className="font-label-md text-label-md text-on-surface-variant hover:text-primary transition-colors" href="#simulator">Simulator</a>
            <a className="font-label-md text-label-md text-on-surface-variant hover:text-primary transition-colors" href="#pricing">Pricing</a>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/login" className="font-label-md text-label-md text-on-surface-variant hover:text-primary transition-colors px-4 py-2 hidden sm:inline-block">
              Login
            </Link>
            <Link href="/demo" className="btn-primary text-white font-label-md text-label-md px-6 py-2.5 rounded-lg hidden sm:flex">
              Get Started
            </Link>
            {/* Mobile hamburger button */}
            <button 
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden flex items-center justify-center p-2 rounded-lg text-on-surface-variant hover:bg-surface-container"
            >
              <span className="material-symbols-outlined">{mobileMenuOpen ? 'close' : 'menu'}</span>
            </button>
          </div>
        </div>
        {/* Mobile slide-down menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-b border-outline-variant/10 bg-surface px-margin-desktop py-4 flex flex-col gap-4 shadow-lg">
            <a onClick={() => setMobileMenuOpen(false)} className="font-label-md text-label-md text-on-surface-variant hover:text-primary" href="#features">Features</a>
            <a onClick={() => setMobileMenuOpen(false)} className="font-label-md text-label-md text-on-surface-variant hover:text-primary" href="#simulator">Simulator</a>
            <a onClick={() => setMobileMenuOpen(false)} className="font-label-md text-label-md text-on-surface-variant hover:text-primary" href="#pricing">Pricing</a>
            <hr className="border-outline-variant/20" />
            <div className="flex items-center justify-between gap-4">
              <Link onClick={() => setMobileMenuOpen(false)} href="/login" className="font-label-md text-label-md text-on-surface-variant hover:text-primary py-2 w-full text-center">
                Login
              </Link>
              <Link onClick={() => setMobileMenuOpen(false)} href="/demo" className="btn-primary text-white font-label-md text-label-md py-2 w-full text-center justify-center rounded-lg">
                Get Started
              </Link>
            </div>
          </div>
        )}
      </nav>

      <main className="pt-24 overflow-x-hidden">
        {/* Hero Section */}
        <section className="relative px-margin-desktop py-unit-xl max-w-container-max mx-auto grid grid-cols-1 lg:grid-cols-2 gap-unit-xl items-center min-h-[80vh]">
          {/* Hero Content */}
          <div className="space-y-unit-lg">
            <div className="inline-flex items-center px-3 py-1 rounded-full bg-primary-fixed text-on-primary-fixed-variant text-label-sm font-label-sm border border-primary/20">
              <span className="material-symbols-outlined text-[14px] mr-2">auto_awesome</span>
              Next-Gen ML Forecasting
            </div>
            <h1 className="font-display-lg text-display-lg leading-tight">
              AI-Powered <span className="text-gradient">Customer Retention</span> Intelligence
            </h1>
            <p className="font-headline-md text-headline-md text-on-surface-variant font-normal">
              Stop customer churn with predictive precision. Leverage ML-driven insights and SHAP explainability to understand why customers leave before they do.
            </p>
            <div className="flex flex-wrap gap-4 pt-unit-md">
              <Link href="/demo" className="btn-primary text-white font-label-md text-label-md px-8 py-4 rounded-xl flex items-center gap-2">
                Get Started <span className="material-symbols-outlined">arrow_forward</span>
              </Link>
              <Link href="/login" className="glass-panel text-on-surface font-label-md text-label-md px-8 py-4 rounded-xl hover:bg-surface-container-high transition-colors flex items-center">
                Login to Dashboard
              </Link>
            </div>
          </div>

          {/* Hero Dashboard Mockup */}
          <div className="relative lg:h-full flex items-center justify-center">
            <div className="absolute -top-10 -right-10 w-64 h-64 bg-primary/10 blur-[100px] rounded-full"></div>
            <div className="absolute -bottom-10 -left-10 w-64 h-64 bg-secondary/10 blur-[100px] rounded-full"></div>
            <div className="glass-panel w-full rounded-2xl p-6 shadow-2xl relative z-10 border border-white/40">
              <div className="flex justify-between items-center mb-6">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-error/40"></div>
                  <div className="w-3 h-3 rounded-full bg-primary-fixed-dim"></div>
                  <div className="w-3 h-3 rounded-full bg-secondary-fixed-dim"></div>
                </div>
                <div className="text-label-sm font-label-sm text-outline px-2 py-1 bg-surface-container rounded">LIVE_PREDICTIONS_STREAM</div>
              </div>
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-surface-container-lowest p-4 rounded-xl border border-outline-variant/30">
                  <p className="text-label-sm font-label-sm text-on-surface-variant">Churn Probability</p>
                  <div className="flex items-end justify-between mt-1">
                    <span className="text-headline-lg font-headline-lg text-error">73.4%</span>
                    <span className="text-error font-label-sm text-label-sm bg-error-container px-2 py-0.5 rounded">High Risk</span>
                  </div>
                </div>
                <div className="bg-surface-container-lowest p-4 rounded-xl border border-outline-variant/30">
                  <p className="text-label-sm font-label-sm text-on-surface-variant">Revenue Protected</p>
                  <div className="flex items-end justify-between mt-1">
                    <span className="text-headline-lg font-headline-lg text-primary">$4.2M</span>
                    <span className="material-symbols-outlined text-primary">trending_up</span>
                  </div>
                </div>
              </div>
              <div className="space-y-4">
                <div className="flex justify-between items-center px-2">
                  <h4 className="text-label-md font-label-md text-on-surface font-bold">SHAP Feature Importance</h4>
                  <span className="text-[10px] text-outline font-label-sm">Top Risk Drivers</span>
                </div>
                <div className="space-y-3 px-2">
                  <div className="space-y-1">
                    <div className="flex justify-between text-label-sm font-label-sm">
                      <span className="">Age (Older Segment)</span>
                      <span className="text-primary font-bold">+0.38</span>
                    </div>
                    <div className="w-full h-1.5 bg-surface-variant rounded-full overflow-hidden">
                      <div className="h-full bg-primary rounded-full" style={{ width: '76%' }}></div>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <div className="flex justify-between text-label-sm font-label-sm">
                      <span className="">Account Balance</span>
                      <span className="text-secondary font-bold">+0.22</span>
                    </div>
                    <div className="w-full h-1.5 bg-surface-variant rounded-full overflow-hidden">
                      <div className="h-full bg-secondary rounded-full" style={{ width: '55%' }}></div>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <div className="flex justify-between text-label-sm font-label-sm">
                      <span className="">Inactive Status</span>
                      <span className="text-error font-bold">+0.45</span>
                    </div>
                    <div className="w-full h-1.5 bg-surface-variant rounded-full overflow-hidden">
                      <div className="h-full bg-error rounded-full" style={{ width: '90%' }}></div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="mt-8 flex items-center justify-between p-3 bg-primary/5 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-primary shadow-sm">
                    <span className="material-symbols-outlined">group</span>
                  </div>
                  <div>
                    <p className="text-label-sm font-label-sm text-on-surface-variant">Active Monitoring</p>
                    <p className="text-label-md font-label-md font-bold">125k+ Customers</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-label-sm font-label-sm text-on-surface-variant">Revenue Impact</p>
                  <p className="text-label-md font-label-md font-bold text-primary">$1.2M / mo</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Stats Counter */}
        <section className="bg-surface-container-lowest py-unit-lg border-y border-outline-variant/10">
          <div className="max-w-container-max mx-auto px-margin-desktop grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-8">
            <div className="text-center space-y-1">
              <p className="text-display-lg font-display-lg text-primary font-bold" data-target="98.2" data-suffix="%">0%</p>
              <p className="text-label-sm font-label-sm text-on-surface-variant uppercase tracking-wider">Accuracy</p>
            </div>
            <div className="text-center space-y-1">
              <p className="text-display-lg font-display-lg text-primary font-bold" data-target="125" data-suffix="K">0K</p>
              <p className="text-label-sm font-label-sm text-on-surface-variant uppercase tracking-wider">Users</p>
            </div>
            <div className="text-center space-y-1">
              <p className="text-display-lg font-display-lg text-primary font-bold" data-target="45" data-suffix="%">0%</p>
              <p className="text-label-sm font-label-sm text-on-surface-variant uppercase tracking-wider">Reduction</p>
            </div>
            <div className="text-center space-y-1">
              <p className="text-display-lg font-display-lg text-primary font-bold" data-target="4.2" data-prefix="$" data-suffix="M">$0.0M</p>
              <p className="text-label-sm font-label-sm text-on-surface-variant uppercase tracking-wider">Savings</p>
            </div>
            <div className="text-center space-y-1">
              <p className="text-display-lg font-display-lg text-primary font-bold" data-target="99.9" data-suffix="%">0.0%</p>
              <p className="text-label-sm font-label-sm text-on-surface-variant uppercase tracking-wider">Uptime</p>
            </div>
            <div className="text-center space-y-1">
              <p className="text-display-lg font-display-lg text-primary font-bold" data-target="200" data-suffix="ms">0ms</p>
              <p className="text-label-sm font-label-sm text-on-surface-variant uppercase tracking-wider">Latency</p>
            </div>
          </div>
        </section>

        {/* Prediction Simulator */}
        <section className="px-margin-desktop py-unit-xl max-w-container-max mx-auto" id="simulator">
          <div className="text-center mb-unit-xl">
            <h2 className="font-headline-lg text-headline-lg text-on-surface">Test the Prediction Engine</h2>
            <p className="font-body-md text-body-md text-on-surface-variant mt-2">Interact with our model in real-time. Adjust parameters to see how risk scores change.</p>
          </div>
          <div className="glass-panel rounded-[2rem] p-8 lg:p-12 shadow-xl border border-outline-variant/20 grid grid-cols-1 lg:grid-cols-12 gap-unit-xl">
            {/* Inputs */}
            <div className="lg:col-span-7 space-y-8">
              <div className="flex items-center gap-3 mb-6">
                <span className="material-symbols-outlined text-primary">person_search</span>
                <h3 className="font-headline-md text-headline-md">Customer Profile</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-8">
                {/* Gender & Age */}
                <div className="space-y-4">
                  <label className="block text-label-md font-label-md text-on-surface-variant">Gender &amp; Age</label>
                  <div className="flex gap-4">
                    <select 
                      className="w-full h-12 py-3 px-4 rounded-xl border border-outline-variant/30 bg-surface focus:ring-primary focus:border-primary text-on-surface outline-none transition-all"
                      value={gender}
                      onChange={(e) => setGender(e.target.value)}
                    >
                      <option>Female</option>
                      <option>Male</option>
                      <option>Other</option>
                    </select>
                    <input 
                      className="w-24 h-12 py-3 px-4 rounded-xl border border-outline-variant/30 bg-surface focus:ring-primary focus:border-primary text-on-surface outline-none transition-all" 
                      type="number" 
                      min="18"
                      max="100"
                      value={age} 
                      onChange={(e) => setAge(e.target.value)}
                    />
                  </div>
                </div>
                {/* Tenure */}
                <div className="space-y-4">
                  <label className="block text-label-md font-label-md text-on-surface-variant">Tenure (Months): <span className="text-primary font-bold ml-2">{tenure}</span></label>
                  <div className="flex items-center h-12">
                    <input 
                      className="w-full h-2 bg-surface-variant rounded-lg appearance-none cursor-pointer accent-primary" 
                      max="12" 
                      min="0" 
                      type="range" 
                      value={tenure} 
                      onChange={(e) => setTenure(parseInt(e.target.value) || 0)} 
                    />
                  </div>
                </div>
                {/* Estimated Salary */}
                <div className="space-y-4">
                  <label className="block text-label-md font-label-md text-on-surface-variant">Estimated Salary</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-outline">$</span>
                    <input 
                      className="w-full h-12 pl-8 pr-4 rounded-xl border border-outline-variant/30 bg-surface focus:ring-primary focus:border-primary text-on-surface outline-none transition-all" 
                      type="number" 
                      min="0"
                      value={estimatedSalary} 
                      onChange={(e) => setEstimatedSalary(e.target.value)} 
                    />
                  </div>
                </div>
                {/* Number of Products */}
                <div className="space-y-4">
                  <label className="block text-label-md font-label-md text-on-surface-variant">Number of Products</label>
                  <select 
                    className="w-full h-12 py-3 px-4 rounded-xl border border-outline-variant/30 bg-surface focus:ring-primary focus:border-primary text-on-surface outline-none transition-all"
                    value={numOfProducts}
                    onChange={(e) => setNumOfProducts(parseInt(e.target.value) || 1)}
                  >
                    <option value={1}>1 Product</option>
                    <option value={2}>2 Products</option>
                    <option value={3}>3 Products</option>
                    <option value={4}>4 Products</option>
                  </select>
                </div>
                {/* Balance */}
                <div className="space-y-4">
                  <label className="block text-label-md font-label-md text-on-surface-variant">Balance</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-outline">$</span>
                    <input 
                      className="w-full h-12 pl-8 pr-4 rounded-xl border border-outline-variant/30 bg-surface focus:ring-primary focus:border-primary text-on-surface outline-none transition-all" 
                      type="number" 
                      min="0"
                      value={balance} 
                      onChange={(e) => setBalance(e.target.value)} 
                    />
                  </div>
                </div>
                {/* Toggles Group */}
                <div className="space-y-4">
                  <label className="block text-label-md font-label-md text-on-surface-variant">Customer Status</label>
                  <div className="grid grid-cols-2 gap-4">
                    {/* Has Credit Card */}
                    <div className="flex items-center justify-between px-4 h-12 bg-surface rounded-xl border border-outline-variant/20 hover:border-primary/30 transition-all">
                      <label className="text-label-md font-label-md text-on-surface-variant cursor-pointer" htmlFor="hasCrCard">Has Card</label>
                      <input 
                        id="hasCrCard"
                        checked={hasCrCard} 
                        onChange={(e) => setHasCrCard(e.target.checked)} 
                        className="w-5 h-5 rounded border-outline-variant text-primary focus:ring-primary cursor-pointer" 
                        type="checkbox" 
                      />
                    </div>
                    {/* Active Member */}
                    <div className="flex items-center justify-between px-4 h-12 bg-surface rounded-xl border border-outline-variant/20 hover:border-primary/30 transition-all">
                      <label className="text-label-md font-label-md text-on-surface-variant cursor-pointer" htmlFor="isActiveMember">Active</label>
                      <input 
                        id="isActiveMember"
                        checked={isActiveMember} 
                        onChange={(e) => setIsActiveMember(e.target.checked)} 
                        className="w-5 h-5 rounded border-outline-variant text-primary focus:ring-primary cursor-pointer" 
                        type="checkbox" 
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Outputs */}
            <div className="lg:col-span-5 bg-surface-container-high/40 backdrop-blur-md rounded-[2rem] p-8 border border-outline-variant/20 flex flex-col items-center justify-center text-center shadow-inner">
              <h3 className="font-headline-md text-headline-md mb-8">Prediction Output</h3>
              <div className="relative w-48 h-48 flex items-center justify-center mb-6">
                <svg className="w-full h-full -rotate-90">
                  <circle className="text-primary/10" cx="96" cy="96" fill="transparent" r="88" stroke="currentColor" stroke-width="12"></circle>
                  <circle 
                    className={`${prob >= 50 ? 'text-error' : 'text-primary'} circular-gauge`} 
                    cx="96" 
                    cy="96" 
                    fill="transparent" 
                    r="88" 
                    stroke="currentColor" 
                    strokeDasharray="552.92" 
                    style={{ strokeDashoffset: offset, transition: 'stroke-dashoffset 0.5s ease-out' }} 
                    strokeWidth="12"
                  ></circle>
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className={`text-display-lg font-display-lg font-bold ${prob >= 50 ? 'text-error' : 'text-primary'}`}>
                    {loading ? '...' : `${prob}%`}
                  </span>
                  <span className="text-label-sm font-label-sm text-on-surface-variant uppercase">
                    {loading ? 'Analyzing...' : `${riskLevel} Risk`}
                  </span>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 w-full mb-8">
                <div className="text-center bg-surface/40 p-3 rounded-xl border border-outline-variant/10">
                  <p className="text-label-sm font-label-sm text-on-surface-variant">Confidence</p>
                  <p className="text-headline-md font-bold text-on-surface">98.2%</p>
                </div>
                <div className="text-center bg-surface/40 p-3 rounded-xl border border-outline-variant/10">
                  <p className="text-label-sm font-label-sm text-on-surface-variant">Model</p>
                  <p className="text-headline-md font-bold text-on-surface">{modelType}</p>
                </div>
              </div>
              <div className="w-full text-left">
                <p className="text-label-md font-label-md text-on-surface mb-4 font-bold flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary text-[20px]">lightbulb</span>
                  Recommended Interventions
                </p>
                <div className="space-y-2">
                  {error && (
                    <div className="text-xs text-error p-2 bg-error-container/20 rounded border border-error/20">
                      {error}
                    </div>
                  )}
                  {prediction && prediction.suggestions && prediction.suggestions.length > 0 ? (
                    prediction.suggestions
                      .filter(s => !s._summary)
                      .slice(0, 2)
                      .map((s, index) => (
                        <div key={index} className="flex items-start gap-3 p-3 bg-surface/50 rounded-xl border border-outline-variant/10 shadow-sm">
                          <span className="material-symbols-outlined text-primary text-[18px] mt-0.5">check_circle</span>
                          <div>
                            <span className="text-label-sm font-bold block text-on-surface">{s.action}</span>
                            <span className="text-xs text-on-surface-variant block mt-0.5">{s.offer}</span>
                          </div>
                        </div>
                      ))
                  ) : (
                    <>
                      <div className="flex items-center gap-3 p-3 bg-surface/50 rounded-xl border border-outline-variant/10 shadow-sm">
                        <span className="material-symbols-outlined text-primary text-[18px]">check_circle</span>
                        <span className="text-label-sm font-label-sm text-on-surface">High-Value Discount (15%)</span>
                      </div>
                      <div className="flex items-center gap-3 p-3 bg-surface/50 rounded-xl border border-outline-variant/10 shadow-sm">
                        <span className="material-symbols-outlined text-primary text-[18px]">check_circle</span>
                        <span className="text-label-sm font-label-sm text-on-surface">Personalized Success Call</span>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Grid */}
        <section className="px-margin-desktop py-unit-xl max-w-container-max mx-auto" id="features">
          <div className="text-center mb-unit-xl">
            <span className="text-primary font-bold tracking-widest text-label-sm uppercase">Capabilities</span>
            <h2 className="font-headline-lg text-headline-lg text-on-surface mt-2">Engineered for Enterprise Insight</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-gutter">
            {/* Feature 1 */}
            <div className="group p-8 rounded-2xl bg-surface-container-low border border-outline-variant/30 hover:border-primary/40 transition-all hover:shadow-lg">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-6 group-hover:bg-primary group-hover:text-white transition-colors text-primary">
                <span className="material-symbols-outlined">psychology</span>
              </div>
              <h3 className="font-headline-md text-headline-md mb-3">Custom ML Engine</h3>
              <p className="text-on-surface-variant">Proprietary deep learning models fine-tuned specifically for subscription-based revenue churn patterns.</p>
            </div>
            {/* Feature 2 */}
            <div className="group p-8 rounded-2xl bg-surface-container-low border border-outline-variant/30 hover:border-primary/40 transition-all hover:shadow-lg">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-6 group-hover:bg-primary group-hover:text-white transition-colors text-primary">
                <span className="material-symbols-outlined">visibility</span>
              </div>
              <h3 className="font-headline-md text-headline-md mb-3">SHAP Explainability</h3>
              <p className="text-on-surface-variant">No more "Black Box" AI. Know exactly which variables are driving churn risk for every individual user.</p>
            </div>
            {/* Feature 3 */}
            <div className="group p-8 rounded-2xl bg-surface-container-low border border-outline-variant/30 hover:border-primary/40 transition-all hover:shadow-lg">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-6 group-hover:bg-primary group-hover:text-white transition-colors text-primary">
                <span className="material-symbols-outlined">data_thresholding</span>
              </div>
              <h3 className="font-headline-md text-headline-md mb-3">Bulk Prediction</h3>
              <p className="text-on-surface-variant">Process millions of data points in seconds with our high-concurrency enterprise inference engine.</p>
            </div>
            {/* Feature 4 */}
            <div className="group p-8 rounded-2xl bg-surface-container-low border border-outline-variant/30 hover:border-primary/40 transition-all hover:shadow-lg">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-6 group-hover:bg-primary group-hover:text-white transition-colors text-primary">
                <span className="material-symbols-outlined">monetization_on</span>
              </div>
              <h3 className="font-headline-md text-headline-md mb-3">Revenue Impact</h3>
              <p className="text-on-surface-variant">Direct correlation between predicted churn and LTV impact. Prioritize efforts on your most valuable accounts.</p>
            </div>
            {/* Feature 5 */}
            <div className="group p-8 rounded-2xl bg-surface-container-low border border-outline-variant/30 hover:border-primary/40 transition-all hover:shadow-lg">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-6 group-hover:bg-primary group-hover:text-white transition-colors text-primary">
                <span className="material-symbols-outlined">encrypted</span>
              </div>
              <h3 className="font-headline-md text-headline-md mb-3">Privacy First</h3>
              <p className="text-on-surface-variant">SOC2 Type II compliant with end-to-end encryption. Your sensitive customer data never leaves your VPC.</p>
            </div>
            {/* Feature 6 */}
            <div className="group p-8 rounded-2xl bg-surface-container-low border border-outline-variant/30 hover:border-primary/40 transition-all hover:shadow-lg">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-6 group-hover:bg-primary group-hover:text-white transition-colors text-primary">
                <span className="material-symbols-outlined">dashboard_customize</span>
              </div>
              <h3 className="font-headline-md text-headline-md mb-3">Interactive Dashboard</h3>
              <p className="text-on-surface-variant">Intuitive, drill-down visualizations designed for both data scientists and customer success leaders.</p>
            </div>
          </div>
        </section>

        {/* Pipeline Workflow */}
        <section className="bg-surface-container-low py-unit-xl">
          <div className="max-w-container-max mx-auto px-margin-desktop text-center mb-unit-xl">
            <h2 className="font-headline-lg text-headline-lg mb-4">Integrated ML Pipeline</h2>
            <p className="text-on-surface-variant">Seamless transition from raw data to actionable intervention.</p>
          </div>
          <div className="max-w-container-max mx-auto px-margin-desktop overflow-x-auto pb-8">
            <div className="flex items-center justify-between min-w-[1000px] gap-4">
              {/* Step 1 */}
              <div className="flex flex-col items-center gap-4 group">
                <div className="w-16 h-16 rounded-full bg-surface shadow-sm border border-outline-variant flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-all">
                  <span className="material-symbols-outlined">upload_file</span>
                </div>
                <span className="text-label-md font-label-md">Upload</span>
              </div>
              <div className="flex-1 h-[2px] bg-outline-variant/30 mb-8"></div>
              {/* Step 2 */}
              <div className="flex flex-col items-center gap-4 group">
                <div className="w-16 h-16 rounded-full bg-surface shadow-sm border border-outline-variant flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-all">
                  <span className="material-symbols-outlined">engineering</span>
                </div>
                <span className="text-label-md font-label-md">Eng. Features</span>
              </div>
              <div className="flex-1 h-[2px] bg-outline-variant/30 mb-8"></div>
              {/* Step 3 */}
              <div className="flex flex-col items-center gap-4 group">
                <div className="w-16 h-16 rounded-full bg-surface shadow-sm border border-outline-variant flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-all">
                  <span className="material-symbols-outlined">model_training</span>
                </div>
                <span className="text-label-md font-label-md">Training</span>
              </div>
              <div className="flex-1 h-[2px] bg-outline-variant/30 mb-8"></div>
              {/* Step 4 */}
              <div className="flex flex-col items-center gap-4 group">
                <div className="w-16 h-16 rounded-full bg-surface shadow-sm border border-outline-variant flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-all">
                  <span className="material-symbols-outlined">online_prediction</span>
                </div>
                <span className="text-label-md font-label-md">Prediction</span>
              </div>
              <div className="flex-1 h-[2px] bg-outline-variant/30 mb-8"></div>
              {/* Step 5 */}
              <div className="flex flex-col items-center gap-4 group">
                <div className="w-16 h-16 rounded-full bg-surface shadow-sm border border-outline-variant flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-all">
                  <span className="material-symbols-outlined">expand</span>
                </div>
                <span className="text-label-md font-label-md">SHAP Insight</span>
              </div>
              <div className="flex-1 h-[2px] bg-outline-variant/30 mb-8"></div>
              {/* Step 6 */}
              <div className="flex flex-col items-center gap-4 group">
                <div className="w-16 h-16 rounded-full bg-surface shadow-sm border border-outline-variant flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-all">
                  <span className="material-symbols-outlined">task_alt</span>
                </div>
                <span className="text-label-md font-label-md">Action</span>
              </div>
            </div>
          </div>
        </section>

        {/* Pricing Section */}
        <section className="px-margin-desktop py-unit-xl max-w-container-max mx-auto" id="pricing">
          <div className="text-center mb-unit-xl">
            <h2 className="font-headline-lg text-headline-lg">Simple, Transparent Pricing</h2>
            <p className="text-on-surface-variant mt-2">Scalable solutions for teams of all sizes.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-gutter">
            {/* Starter */}
            <div className="p-8 rounded-2xl bg-white border border-outline-variant/30 flex flex-col h-full">
              <h3 className="font-headline-md text-headline-md mb-2">Starter</h3>
              <p className="text-on-surface-variant mb-6">Best for emerging startups.</p>
              <div className="mb-8">
                <span className="text-display-lg font-display-lg">$499</span>
                <span className="text-on-surface-variant">/mo</span>
              </div>
              <ul className="space-y-4 mb-8 flex-1">
                <li className="flex items-center gap-2 text-label-md"><span className="material-symbols-outlined text-primary text-[18px]">check</span> 10k Customers</li>
                <li className="flex items-center gap-2 text-label-md"><span className="material-symbols-outlined text-primary text-[18px]">check</span> Standard Models</li>
                <li className="flex items-center gap-2 text-label-md"><span className="material-symbols-outlined text-primary text-[18px]">check</span> Dashboard Access</li>
              </ul>
              <button className="w-full py-3 rounded-lg border border-primary text-primary font-bold hover:bg-primary/5 transition-colors">Start Free Trial</button>
            </div>
            {/* Professional */}
            <div className="p-8 rounded-2xl bg-white border-2 border-primary relative flex flex-col h-full shadow-xl">
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-primary text-white px-4 py-1 rounded-full text-label-sm uppercase">Most Popular</div>
              <h3 className="font-headline-md text-headline-md mb-2">Professional</h3>
              <p className="text-on-surface-variant mb-6">For high-growth scaleups.</p>
              <div className="mb-8">
                <span className="text-display-lg font-display-lg">$1,299</span>
                <span className="text-on-surface-variant">/mo</span>
              </div>
              <ul className="space-y-4 mb-8 flex-1">
                <li className="flex items-center gap-2 text-label-md font-bold"><span className="material-symbols-outlined text-primary text-[18px]">check</span> 100k Customers</li>
                <li className="flex items-center gap-2 text-label-md"><span className="material-symbols-outlined text-primary text-[18px]">check</span> Advanced SHAP Insights</li>
                <li className="flex items-center gap-2 text-label-md"><span className="material-symbols-outlined text-primary text-[18px]">check</span> API Access</li>
                <li className="flex items-center gap-2 text-label-md"><span className="material-symbols-outlined text-primary text-[18px]">check</span> Email Automations</li>
              </ul>
              <button className="btn-primary w-full py-3 rounded-lg text-white font-bold">Get Started Now</button>
            </div>
            {/* Enterprise */}
            <div className="p-8 rounded-2xl bg-inverse-surface text-inverse-on-surface flex flex-col h-full">
              <h3 className="font-headline-md text-headline-md mb-2 text-white">Enterprise</h3>
              <p className="text-outline-variant mb-6">Customized for global scale.</p>
              <div className="mb-8">
                <span className="text-display-lg font-display-lg text-white">Custom</span>
              </div>
              <ul className="space-y-4 mb-8 flex-1">
                <li className="flex items-center gap-2 text-label-md"><span className="material-symbols-outlined text-primary text-[18px]">check</span> Unlimited Customers</li>
                <li className="flex items-center gap-2 text-label-md"><span className="material-symbols-outlined text-primary text-[18px]">check</span> Custom Model Training</li>
                <li className="flex items-center gap-2 text-label-md"><span className="material-symbols-outlined text-primary text-[18px]">check</span> Dedicated Data Scientist</li>
                <li className="flex items-center gap-2 text-label-md"><span className="material-symbols-outlined text-primary text-[18px]">check</span> SOC2 Compliance Package</li>
              </ul>
              <button className="w-full py-3 rounded-lg bg-white text-on-background font-bold hover:bg-surface-variant transition-colors">Contact Sales</button>
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="px-margin-desktop py-unit-xl">
          <div className="max-w-container-max mx-auto rounded-[3rem] bg-gradient-to-br from-primary to-secondary p-unit-xl text-center text-white relative overflow-hidden">
            <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white via-transparent to-transparent"></div>
            <h2 className="font-display-lg text-display-lg mb-6 relative z-10">Ready to protect your revenue?</h2>
            <p className="font-headline-md text-headline-md mb-10 opacity-90 max-w-2xl mx-auto relative z-10">Join 500+ enterprises using ChurnSense AI to reduce churn by an average of 38% in the first quarter.</p>
            <div className="flex flex-wrap justify-center gap-6 relative z-10">
              <Link href="/demo" className="bg-white text-primary font-bold px-10 py-5 rounded-2xl text-headline-md hover:scale-105 transition-transform shadow-2xl flex items-center justify-center">
                Start for Free
              </Link>
              <Link href="/demo" className="bg-primary-container/20 backdrop-blur-md border border-white/30 text-white font-bold px-10 py-5 rounded-2xl text-headline-md hover:bg-primary-container/30 transition-all flex items-center justify-center">
                Schedule a Demo
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-surface-container-lowest py-unit-xl border-t border-outline-variant/20">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-gutter px-margin-desktop max-w-container-max mx-auto">
          <div className="space-y-6">
            <div className="flex items-center gap-2">
              <img 
                alt="ChurnSense AI Logo" 
                className="h-8 w-8 object-contain" 
                src="/logo.png" 
              />
              <span className="text-headline-md font-headline-md font-black text-on-surface">ChurnSense AI</span>
            </div>
            <p className="text-on-surface-variant font-body-md">Predictive retention intelligence for the modern enterprise. Built on precision, trust, and transparency.</p>
            <div className="flex gap-4">
              <a className="w-10 h-10 rounded-full bg-surface flex items-center justify-center text-outline hover:text-primary transition-colors border border-outline-variant/20" href="#">
                <span className="material-symbols-outlined text-[20px]">public</span>
              </a>
              <a className="w-10 h-10 rounded-full bg-surface flex items-center justify-center text-outline hover:text-primary transition-colors border border-outline-variant/20" href="#">
                <span className="material-symbols-outlined text-[20px]">alternate_email</span>
              </a>
            </div>
          </div>
          <div className="space-y-6">
            <h4 className="font-label-md text-label-md font-bold uppercase text-on-surface">Product</h4>
            <ul className="space-y-4">
              <li><a className="text-on-surface-variant hover:text-primary hover:underline transition-all" href="#">Features</a></li>
              <li><a className="text-on-surface-variant hover:text-primary hover:underline transition-all" href="#">ML Pipeline</a></li>
              <li><a className="text-on-surface-variant hover:text-primary hover:underline transition-all" href="#">Integrations</a></li>
              <li><a className="text-on-surface-variant hover:text-primary hover:underline transition-all" href="#">Pricing</a></li>
            </ul>
          </div>
          <div className="space-y-6">
            <h4 className="font-label-md text-label-md font-bold uppercase text-on-surface">Company</h4>
            <ul className="space-y-4">
              <li><a className="text-on-surface-variant hover:text-primary hover:underline transition-all" href="#">About Us</a></li>
              <li><a className="text-on-surface-variant hover:text-primary hover:underline transition-all" href="#">Careers</a></li>
              <li><a className="text-on-surface-variant hover:text-primary hover:underline transition-all" href="#">Security</a></li>
              <li><a className="text-on-surface-variant hover:text-primary hover:underline transition-all" href="#">Privacy</a></li>
            </ul>
          </div>
          <div className="space-y-6">
            <h4 className="font-label-md text-label-md font-bold uppercase text-on-surface">Support</h4>
            <ul className="space-y-4">
              <li><a className="text-on-surface-variant hover:text-primary hover:underline transition-all" href="#">Documentation</a></li>
              <li><a className="text-on-surface-variant hover:text-primary hover:underline transition-all" href="#">API Reference</a></li>
              <li><a className="text-on-surface-variant hover:text-primary hover:underline transition-all" href="#">Contact Us</a></li>
              <li><a className="text-on-surface-variant hover:text-primary hover:underline transition-all" href="#">Success Stories</a></li>
            </ul>
          </div>
        </div>
        <div className="max-w-container-max mx-auto px-margin-desktop mt-16 pt-8 border-t border-outline-variant/10 text-center text-on-surface-variant text-label-sm">
          © 2024 ChurnSense AI. All rights reserved. Built for revenue durability.
        </div>
      </footer>
    </div>
  );
}
