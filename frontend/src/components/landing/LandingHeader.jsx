import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Menu, X, Shield } from 'lucide-react';
import { NAV_LINKS } from '../../constants/landing';
import ThemeToggle from '../ui/ThemeToggle';

const LandingHeader = () => {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b border-border">
      <div className="max-w-7xl mx-auto px-6 sm:px-8 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 font-semibold text-foreground">
          <div className="w-8 h-8 bg-primary rounded-md flex items-center justify-center">
            <Shield size={16} className="text-primary-foreground" />
          </div>
          <span className="font-serif text-lg tracking-tight">FreLock</span>
        </Link>

        <nav className="hidden md:flex items-center gap-8">
          {NAV_LINKS.map(({ label, href }) => (
            <a key={href} href={href} className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              {label}
            </a>
          ))}
        </nav>

        <div className="hidden md:flex items-center gap-3">
          <ThemeToggle />
          <Link to="/login" className="btn-secondary h-9 px-4">Log in</Link>
          <Link to="/register" className="btn-primary h-9 px-4">Get started</Link>
        </div>

        <div className="flex md:hidden items-center gap-2">
          <ThemeToggle />
          <button
            type="button"
            className="p-2 text-foreground"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div className="md:hidden border-t border-border bg-background px-6 py-4 space-y-4">
          {NAV_LINKS.map(({ label, href }) => (
            <a
              key={href}
              href={href}
              className="block text-sm text-muted-foreground hover:text-foreground"
              onClick={() => setMobileOpen(false)}
            >
              {label}
            </a>
          ))}
          <div className="flex flex-col gap-2 pt-2">
            <Link to="/login" className="btn-secondary w-full" onClick={() => setMobileOpen(false)}>Log in</Link>
            <Link to="/register" className="btn-primary w-full" onClick={() => setMobileOpen(false)}>Get started</Link>
          </div>
        </div>
      )}
    </header>
  );
};

export default LandingHeader;
