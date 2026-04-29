'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/useAuth';
import { Zap, User, Mail, Lock, Building2, ArrowRight, Loader2 } from 'lucide-react';
import styles from '../login/login.module.css';

export default function RegisterPage() {
  const { register } = useAuth();
  const router = useRouter();
  const [form, setForm] = useState({ username: '', email: '', password: '', organization: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const update = (key) => (e) => setForm({ ...form, [key]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await register(form.username, form.email, form.password, form.organization);
      router.push('/onboarding');
    } catch (err) {
      setError(err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.backdrop} />
      <div className={styles.card}>
        <div className={styles.logo}>
          <img src="/logo.png" alt="ChurnSense Logo" className={styles.logoImage} />
          <span className={styles.logoText}>ChurnSense</span>
        </div>

        <h1 className={styles.title}>Create account</h1>
        <p className={styles.subtitle}>Get started with AI-powered churn prediction</p>

        {error && <div className={styles.errorBanner}>{error}</div>}

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.field}>
            <label className={styles.label}>Username</label>
            <div className={styles.inputWrap}>
              <User size={18} className={styles.inputIcon} />
              <input id="register-username" type="text" value={form.username} onChange={update('username')} placeholder="johndoe" className={styles.input} required />
            </div>
          </div>

          <div className={styles.field}>
            <label className={styles.label}>Email</label>
            <div className={styles.inputWrap}>
              <Mail size={18} className={styles.inputIcon} />
              <input id="register-email" type="email" value={form.email} onChange={update('email')} placeholder="you@example.com" className={styles.input} required />
            </div>
          </div>

          <div className={styles.field}>
            <label className={styles.label}>Password</label>
            <div className={styles.inputWrap}>
              <Lock size={18} className={styles.inputIcon} />
              <input id="register-password" type="password" value={form.password} onChange={update('password')} placeholder="••••••••" className={styles.input} required minLength={6} />
            </div>
          </div>

          <div className={styles.field}>
            <label className={styles.label}>Organization <span style={{ color: '#64748b' }}>(optional)</span></label>
            <div className={styles.inputWrap}>
              <Building2 size={18} className={styles.inputIcon} />
              <input id="register-org" type="text" value={form.organization} onChange={update('organization')} placeholder="Acme Corp" className={styles.input} />
            </div>
          </div>

          <button id="register-submit" type="submit" className={styles.submitBtn} disabled={loading}>
            {loading ? <Loader2 size={20} className={styles.spinner} /> : <>Create Account <ArrowRight size={18} /></>}
          </button>
        </form>

        <p className={styles.footerText}>
          Already have an account?{' '}
          <Link href="/login" className={styles.footerLink}>Sign in</Link>
        </p>
      </div>
    </div>
  );
}
