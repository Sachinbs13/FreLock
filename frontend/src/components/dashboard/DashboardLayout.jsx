import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Shield, LogOut, Menu, X, Lock, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { formatINR } from '../../constants/finance';
import { getDashboardNav } from '../../constants/dashboardNav';
import ThemeToggle from '../ui/ThemeToggle';

const MOBILE_PRIMARY_COUNT = 4;

const DashboardLayout = ({ children, title, subtitle, wallet, actions }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [moreOpen, setMoreOpen] = useState(false);

  const navItems = getDashboardNav(user?.role);
  const current = location.pathname + location.search;
  const isActive = (path) => (path.includes('?') ? current === path : location.pathname === path && !location.search.includes('tab='));

  const primary = navItems.slice(0, MOBILE_PRIMARY_COUNT);
  const overflow = navItems.slice(MOBILE_PRIMARY_COUNT);
  const overflowActive = overflow.some((item) => isActive(item.path));

  const go = (path) => {
    setMoreOpen(false);
    navigate(path);
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const initials = (user?.name || 'U')
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="min-h-screen bg-muted/30 bg-grid-pattern text-foreground flex flex-col">
      <header className="bg-card/90 backdrop-blur-md border-b border-border sticky top-0 z-40">
        <div className="w-full px-4 sm:px-6 lg:px-8 h-15 flex items-center justify-between gap-3">
          <div className="flex items-center gap-4">
            <Link to="/dashboard" className="flex items-center gap-2.5 font-semibold">
              <div className="w-8 h-8 bg-primary rounded-md flex items-center justify-center shadow-xs">
                <Shield size={16} className="text-primary-foreground" />
              </div>
              <span className="font-serif text-lg tracking-tight">FreLock</span>
            </Link>
            <span className="hidden md:inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse-soft" />
              Escrow Vault Active
            </span>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            {wallet && (
              <div className="hidden sm:flex items-center gap-2 text-xs bg-muted/80 border border-border px-3 py-1.5 rounded-md">
                <span className="text-muted-foreground">Wallet:</span>
                <span className="font-semibold text-foreground">{formatINR(wallet.balance)}</span>
              </div>
            )}
            <ThemeToggle />
            <span className="text-xs badge badge-secondary hidden sm:inline">{user?.name} · {user?.role}</span>
            <button type="button" onClick={handleLogout} className="btn-secondary h-8 px-3 text-xs gap-1">
              <LogOut size={14} /> <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>
      </header>

      <div className="flex-1 w-full flex flex-col lg:flex-row">
        <aside className="hidden lg:flex lg:w-64 xl:w-72 shrink-0 border-r border-border bg-card/60 backdrop-blur-xs flex-col justify-between p-4 sticky top-15 h-[calc(100svh-3.75rem)]">
          <div className="space-y-4">
            <div className="p-3.5 rounded-lg bg-muted/70 border border-border flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold shrink-0">
                {initials}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold truncate">{user?.name}</p>
                <p className="text-xs text-muted-foreground truncate">{user?.role} Account</p>
              </div>
            </div>

            <nav className="space-y-1" aria-label="Dashboard navigation">
              <p className="px-3 pb-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Workspace
              </p>
              {navItems.map(({ label, path, icon: Icon }) => (
                <button
                  key={path}
                  type="button"
                  onClick={() => go(path)}
                  aria-current={isActive(path) ? 'page' : undefined}
                  className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-md text-sm font-medium transition-all duration-150 ${
                    isActive(path)
                      ? 'bg-primary text-primary-foreground shadow-xs'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                  }`}
                >
                  <Icon size={16} />
                  {label}
                </button>
              ))}
            </nav>
          </div>

          <div className="p-3.5 rounded-lg border border-border bg-muted/40 space-y-2">
            <div className="flex items-center gap-2 text-xs font-semibold text-foreground">
              <Lock size={13} className="text-emerald-600 dark:text-emerald-400" />
              FreLock Protection
            </div>
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              Every contract is backed by atomic INR escrow holds and 4-digit PIN verification.
            </p>
            <div className="flex items-center gap-1.5 text-[11px] text-emerald-700 dark:text-emerald-400 font-medium">
              <CheckCircle2 size={12} /> 100% Concurrency Safe
            </div>
          </div>
        </aside>

        <main className="flex-1 min-w-0 px-4 sm:px-6 lg:px-8 py-6 pb-28 lg:pb-8">
          {wallet && (
            <div className="flex sm:hidden items-center justify-between bg-card border border-border rounded-lg px-4 py-2.5 mb-4 text-sm">
              <span className="text-muted-foreground">Wallet balance</span>
              <span className="font-semibold">{formatINR(wallet.balance)}</span>
            </div>
          )}

          {(title || subtitle || actions) && (
            <div className="card p-5 mb-6 bg-gradient-to-r from-card via-card to-muted/50 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 relative overflow-hidden">
              <div className="absolute inset-y-0 left-0 w-1 bg-gradient-to-b from-emerald-500 to-zinc-900 dark:to-zinc-100" />
              <div className="pl-2">
                {title && <h1 className="text-xl sm:text-2xl font-semibold tracking-tight">{title}</h1>}
                {subtitle && <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>}
              </div>
              {actions && <div className="shrink-0">{actions}</div>}
            </div>
          )}

          {children}
        </main>
      </div>

      {/* Mobile: "More" sheet holds the nav items that don't fit in the tab bar */}
      {moreOpen && (
        <div className="lg:hidden fixed inset-0 z-40 bg-black/30" onClick={() => setMoreOpen(false)}>
          <div
            className="absolute left-0 right-0 bg-card border-t border-border rounded-t-xl p-3 space-y-1 animate-slide-up"
            style={{ bottom: 'calc(56px + env(safe-area-inset-bottom))' }}
            onClick={(e) => e.stopPropagation()}
          >
            {overflow.map(({ label, path, icon: Icon }) => (
              <button
                key={path}
                type="button"
                onClick={() => go(path)}
                className={`w-full flex items-center gap-3 px-3 py-3 rounded-md text-sm font-medium ${
                  isActive(path) ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'
                }`}
              >
                <Icon size={18} /> {label}
              </button>
            ))}
          </div>
        </div>
      )}

      <nav
        className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
        aria-label="Mobile navigation"
      >
        <div className="flex items-stretch">
          {primary.map(({ label, path, icon: Icon }) => {
            const active = isActive(path);
            return (
              <button
                key={path}
                type="button"
                onClick={() => go(path)}
                className={`flex-1 flex flex-col items-center justify-center gap-1 py-2 min-h-[56px] text-[10px] font-medium transition-colors ${
                  active ? 'text-primary' : 'text-muted-foreground'
                }`}
                aria-current={active ? 'page' : undefined}
              >
                <Icon size={20} strokeWidth={active ? 2.5 : 1.75} />
                <span className="leading-none">{label}</span>
              </button>
            );
          })}
          {overflow.length > 0 && (
            <button
              type="button"
              onClick={() => setMoreOpen((o) => !o)}
              className={`flex-1 flex flex-col items-center justify-center gap-1 py-2 min-h-[56px] text-[10px] font-medium ${
                overflowActive || moreOpen ? 'text-primary' : 'text-muted-foreground'
              }`}
              aria-expanded={moreOpen}
            >
              {moreOpen ? <X size={20} /> : <Menu size={20} strokeWidth={overflowActive ? 2.5 : 1.75} />}
              <span className="leading-none">More</span>
            </button>
          )}
        </div>
      </nav>
    </div>
  );
};

export default DashboardLayout;
