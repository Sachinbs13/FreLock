import React from 'react';
import { Link } from 'react-router-dom';
import { Shield, CheckCircle2 } from 'lucide-react';
import ThemeToggle from '../ui/ThemeToggle';

const AUTH_FEATURES = [
  'Secure escrow fund holding',
  'Role-based client & freelancer access',
  'Admin oversight and dispute resolution',
];

const AuthLayout = ({ children, title, subtitle, footer }) => (
  <div className="min-h-screen grid lg:grid-cols-2">
    <div className="hidden lg:flex flex-col justify-between bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-800 text-zinc-50 p-12 border-r border-border relative overflow-hidden">
      <div className="pointer-events-none absolute -bottom-24 -left-24 w-80 h-80 rounded-full bg-emerald-500/10 blur-3xl" />
      <Link to="/" className="flex items-center gap-2 font-semibold w-fit relative">
        <div className="w-9 h-9 bg-white/10 rounded-md flex items-center justify-center border border-white/10">
          <Shield size={18} />
        </div>
        <span className="font-serif text-xl tracking-tight">FreLock</span>
      </Link>

      <div className="relative">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/10 text-xs text-zinc-200 mb-5">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse-soft" />
          Protected Escrow Gateway
        </div>
        <h1 className="text-3xl font-semibold tracking-tight mb-4 leading-tight">
          Secure payments for every freelance job
        </h1>
        <p className="text-zinc-300 mb-8 max-w-md leading-relaxed">
          Hold funds in escrow until work is approved. Built for clients, freelancers, and platform admins.
        </p>
        <ul className="space-y-3">
          {AUTH_FEATURES.map((feature) => (
            <li key={feature} className="flex items-center gap-3 text-sm text-zinc-200 bg-white/5 border border-white/10 rounded-md px-3.5 py-2.5 max-w-md">
              <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
              {feature}
            </li>
          ))}
        </ul>
      </div>

      <p className="text-xs text-zinc-400 relative">
        © {new Date().getFullYear()} FreLock Escrow Platform
      </p>
    </div>

    <div className="relative flex flex-col justify-center items-center p-6 sm:p-10 bg-background bg-grid-pattern text-foreground">
      <div className="absolute top-4 right-4 sm:top-6 sm:right-6">
        <ThemeToggle />
      </div>
      <div className="lg:hidden mb-8">
        <Link to="/" className="flex items-center gap-2 font-semibold text-foreground">
          <div className="w-8 h-8 bg-primary rounded-md flex items-center justify-center">
            <Shield size={16} className="text-primary-foreground" />
          </div>
          <span className="font-serif text-lg tracking-tight">FreLock</span>
        </Link>
      </div>

      <div className="w-full max-w-md animate-fade-in">
        <div className="mb-8">
          <h2 className="text-2xl font-semibold tracking-tight text-foreground mb-2">{title}</h2>
          <p className="text-sm text-muted-foreground">{subtitle}</p>
        </div>

        {children}

        {footer && <div className="mt-6 text-center text-sm text-muted-foreground">{footer}</div>}
      </div>
    </div>
  </div>
);

export default AuthLayout;
