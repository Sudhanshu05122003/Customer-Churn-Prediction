'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle2, ChevronRight, Upload, Zap, BarChart3 } from 'lucide-react';

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);

  const nextStep = () => {
    if (step < 3) setStep(step + 1);
    else router.push('/dashboard');
  };

  const skip = () => router.push('/dashboard');

  return (
    <div className="min-h-screen bg-[#0a0f1c] flex items-center justify-center p-6 text-white relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-indigo-600/20 rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-2xl w-full bg-[#111827] border border-slate-800 rounded-2xl p-8 md:p-12 shadow-2xl relative z-10">
        <div className="flex justify-between items-center mb-8">
          <div className="flex gap-2">
            {[1, 2, 3].map((s) => (
              <div
                key={s}
                className={`h-2 rounded-full transition-all duration-300 ${
                  s === step ? 'w-8 bg-indigo-500' : s < step ? 'w-4 bg-indigo-500/50' : 'w-4 bg-slate-800'
                }`}
              />
            ))}
          </div>
          <button onClick={skip} className="text-sm text-slate-400 hover:text-white transition-colors">
            Skip
          </button>
        </div>

        <div className="min-h-[280px]">
          {step === 1 && (
            <div className="animate-in fade-in slide-in-from-right-4 duration-500">
              <div className="w-16 h-16 bg-indigo-500/20 rounded-2xl flex items-center justify-center text-indigo-400 mb-6">
                <BarChart3 size={32} />
              </div>
              <h1 className="text-3xl font-bold mb-4">Welcome to ChurnSense</h1>
              <p className="text-slate-400 text-lg mb-8">
                Your enterprise intelligence platform for stopping customer churn before it happens. Let's get your workspace set up.
              </p>
              <div className="flex flex-col gap-4">
                <div className="flex items-start gap-3 text-slate-300">
                  <CheckCircle2 className="text-emerald-500 shrink-0 mt-0.5" size={20} />
                  <span>Analyze up to 50 predictions on the free tier</span>
                </div>
                <div className="flex items-start gap-3 text-slate-300">
                  <CheckCircle2 className="text-emerald-500 shrink-0 mt-0.5" size={20} />
                  <span>Get actionable retention strategies instantly</span>
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="animate-in fade-in slide-in-from-right-4 duration-500">
              <div className="w-16 h-16 bg-blue-500/20 rounded-2xl flex items-center justify-center text-blue-400 mb-6">
                <Zap size={32} />
              </div>
              <h1 className="text-3xl font-bold mb-4">Single Predictions</h1>
              <p className="text-slate-400 text-lg mb-8">
                Instantly check a customer's risk profile by entering their demographic and banking details in the Predict tab.
              </p>
              <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4 flex gap-4">
                <div className="p-3 bg-slate-800 rounded-lg shrink-0">
                  <Zap className="text-indigo-400" size={24} />
                </div>
                <div>
                  <h4 className="font-medium text-white">SHAP Explainability</h4>
                  <p className="text-sm text-slate-400 mt-1">Every prediction comes with visual reasons explaining exactly why the customer is at risk.</p>
                </div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="animate-in fade-in slide-in-from-right-4 duration-500">
              <div className="w-16 h-16 bg-purple-500/20 rounded-2xl flex items-center justify-center text-purple-400 mb-6">
                <Upload size={32} />
              </div>
              <h1 className="text-3xl font-bold mb-4">Bulk Analysis</h1>
              <p className="text-slate-400 text-lg mb-8">
                Upload your enterprise CSV data to analyze thousands of customers at once and identify macro churn trends.
              </p>
              <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4 flex gap-4">
                <div className="p-3 bg-slate-800 rounded-lg shrink-0">
                  <Upload className="text-indigo-400" size={24} />
                </div>
                <div>
                  <h4 className="font-medium text-white">Up to 10k rows</h4>
                  <p className="text-sm text-slate-400 mt-1">Bulk process your entire CRM export in seconds and view the high-level insights on your dashboard.</p>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="mt-12 flex justify-end">
          <button
            onClick={nextStep}
            className="btn-primary flex items-center gap-2 px-6 py-3"
          >
            {step === 3 ? 'Go to Dashboard' : 'Next'} <ChevronRight size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}
