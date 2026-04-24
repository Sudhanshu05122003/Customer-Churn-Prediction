'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Zap, History, Upload, LogOut, User } from 'lucide-react';
import { useEffect, useState } from 'react';

const NavItem = ({ href, icon: Icon, label, active }) => (
  <Link href={href}>
    <div className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 cursor-pointer ${
      active 
        ? 'bg-indigo-600/20 text-indigo-400 border border-indigo-500/20' 
        : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/40'
    }`}>
      <Icon size={20} />
      <span className="font-medium">{label}</span>
    </div>
  </Link>
);

export default function AppLayout({ children }) {
  const pathname = usePathname();
  const [user, setUser] = useState(null);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) setUser(JSON.parse(storedUser));
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login';
  };

  if (pathname === '/login' || pathname === '/register') return children;

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <aside className="w-64 glass-card m-4 mr-0 p-6 flex flex-col gap-8 hidden md:flex">
        <div className="flex items-center gap-3 px-2">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
            <Zap size={20} className="text-white fill-white" />
          </div>
          <span className="text-xl font-bold tracking-tight">ChurnSense</span>
        </div>

        <nav className="flex flex-col gap-2 flex-1">
          <NavItem href="/" icon={LayoutDashboard} label="Dashboard" active={pathname === '/'} />
          <NavItem href="/predict" icon={Zap} label="Predict" active={pathname === '/predict'} />
          <NavItem href="/bulk" icon={Upload} label="Bulk Analysis" active={pathname === '/bulk'} />
          <NavItem href="/history" icon={History} label="History" active={pathname === '/history'} />
        </nav>

        <div className="pt-6 border-t border-slate-800/50 flex flex-col gap-4">
          {user && (
            <div className="flex items-center gap-3 px-2">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white font-bold">
                {user.username?.[0]?.toUpperCase() || <User size={20} />}
              </div>
              <div className="flex flex-col overflow-hidden">
                <span className="font-medium truncate text-sm">{user.username}</span>
                <span className="text-xs text-slate-500 truncate">{user.organization || 'Free Tier'}</span>
              </div>
            </div>
          )}
          <button 
            onClick={handleLogout}
            className="flex items-center gap-3 px-4 py-3 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-all duration-200"
          >
            <LogOut size={20} />
            <span className="font-medium">Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-4 md:p-8 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
