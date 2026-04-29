'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { churnApi } from '@/lib/api';

export default function DemoPage() {
  const router = useRouter();
  const [error, setError] = useState(null);

  useEffect(() => {
    // 1. Set dummy auth to bypass frontend guards
    localStorage.setItem('token', 'DEMO_MODE');
    localStorage.setItem('user', JSON.stringify({
      username: 'Demo User',
      organization: 'Try Demo'
    }));

    // 2. Fetch sample data and upload to bulk
    const runDemo = async () => {
      try {
        const response = await fetch('/sample-data.csv');
        if (!response.ok) throw new Error('Failed to load sample data');
        const text = await response.text();
        const file = new File([text], 'sample-data.csv', { type: 'text/csv' });
        
        await churnApi.bulkPredict(file);
        
        // 3. Redirect to dashboard to see the populated stats
        router.push('/dashboard');
      } catch (err) {
        console.error(err);
        setError('Demo initialization failed. Ensure sample-data.csv exists.');
      }
    };

    runDemo();
  }, [router]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#0a0f1c] text-white">
      {error ? (
        <div className="text-red-500 bg-red-500/10 p-4 rounded-xl border border-red-500/20">
          {error}
        </div>
      ) : (
        <>
          <Loader2 size={48} className="animate-spin text-indigo-500 mb-6" />
          <h2 className="text-3xl font-bold mb-2">Initializing Enterprise Demo</h2>
          <p className="text-slate-400">Loading and processing sample enterprise dataset...</p>
        </>
      )}
    </div>
  );
}
