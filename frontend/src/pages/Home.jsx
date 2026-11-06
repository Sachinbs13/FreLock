import React from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  CheckCircle2,
  Lock,
  Shield,
  Wallet,
  Briefcase,
  Scale,
  ChevronRight,
  Sparkles,
} from 'lucide-react';
import LandingHeader from '../components/landing/LandingHeader';
import LandingFooter from '../components/landing/LandingFooter';
import {
  HERO,
  PILLARS,
  FEATURES,
  WORKFLOW_STEPS,
  ROLE_SECTIONS,
  TOOLS,
  FAQ_ITEMS,
} from '../constants/landing';

const EscrowCheckoutMockup = () => (
  <div className="relative mx-auto w-full max-w-sm animate-float">
    {/* Ambient glow behind mockup */}
    <div className="absolute -inset-4 bg-gradient-to-tr from-emerald-500/10 via-zinc-500/5 to-transparent rounded-2xl blur-xl -z-20" />

    <div className="card p-6 shadow-card-hover relative overflow-hidden">
      <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-emerald-500 via-zinc-700 to-zinc-900 dark:from-emerald-400 dark:via-zinc-400 dark:to-zinc-100" />

      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse-soft" />
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Escrow checkout</span>
        </div>
        <div className="w-7 h-7 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
          <Shield size={15} />
        </div>
      </div>

      <div className="space-y-4">
        <div className="bg-muted/80 border border-border/60 rounded-md p-4">
          <div className="flex items-center justify-between mb-1">
            <p className="text-xs text-muted-foreground">Contract #ESC-204</p>
            <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-300">
              HELD IN ESCROW
            </span>
          </div>
          <p className="text-sm font-semibold text-foreground">Build React dashboard</p>
          <p className="text-xs text-muted-foreground mt-1.5">Freelancer: Priya S. · Verified</p>
        </div>

        {/* Visual state progression bar */}
        <div className="space-y-1.5">
          <div className="flex justify-between text-[11px] text-muted-foreground font-medium">
            <span className="text-emerald-600 dark:text-emerald-400">1. Funded</span>
            <span className="text-foreground">2. In Progress</span>
            <span>3. Released</span>
          </div>
          <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
            <div className="h-full w-2/3 bg-gradient-to-r from-emerald-500 to-zinc-900 dark:to-zinc-100 rounded-full" />
          </div>
        </div>

        <div className="flex justify-between items-center py-2.5 border-y border-border">
          <span className="text-sm text-muted-foreground">Protected amount</span>
          <span className="text-xl font-bold tracking-tight text-foreground">₹25,000</span>
        </div>

        <div className="space-y-2">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <CheckCircle2 size={14} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
            100% funds locked in atomic escrow vault
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Lock size={14} className="text-foreground shrink-0" />
            Released only via client 4-digit PIN approval
          </div>
        </div>

        <Link to="/register" className="btn-primary w-full h-10 gap-1.5">
          Fund escrow <ArrowRight size={14} />
        </Link>
      </div>
    </div>

    <div className="absolute -z-10 -bottom-3 -right-3 w-full h-full bg-muted/60 rounded-lg border border-border" />
  </div>
);

const Home = () => (
  <div className="min-h-screen bg-background text-foreground">
    <LandingHeader />

    <section className="relative overflow-hidden bg-grid-pattern border-b border-border/60">
      <div className="max-w-7xl mx-auto px-6 sm:px-8 py-16 md:py-24 relative">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          <div className="animate-fade-in">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-border bg-muted/70 text-xs font-medium text-foreground mb-5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse-soft" />
              {HERO.eyebrow}
            </div>
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-foreground leading-[1.12] mb-6">
              {HERO.title}
            </h1>
            <p className="text-lg text-muted-foreground mb-8 max-w-lg leading-relaxed">
              {HERO.description}
            </p>
            <div className="flex flex-wrap gap-3">
              <Link to="/register" className="btn-primary h-11 px-6 gap-2">
                {HERO.primaryCta}
                <ArrowRight size={16} />
              </Link>
              <a href="#how-it-works" className="btn-secondary h-11 px-6">
                {HERO.secondaryCta}
              </a>
            </div>

            <div className="mt-10 pt-6 border-t border-border/70 grid grid-cols-3 gap-4 max-w-md">
              <div>
                <p className="text-lg font-bold text-foreground">100%</p>
                <p className="text-xs text-muted-foreground">Escrow Protected</p>
              </div>
              <div>
                <p className="text-lg font-bold text-foreground">PIN</p>
                <p className="text-xs text-muted-foreground">4-Digit Vault Lock</p>
              </div>
              <div>
                <p className="text-lg font-bold text-foreground">INR ₹</p>
                <p className="text-xs text-muted-foreground">Instant Settlement</p>
              </div>
            </div>
          </div>

          <div className="animate-slide-up lg:justify-self-end w-full">
            <EscrowCheckoutMockup />
          </div>
        </div>
      </div>
    </section>

    <section className="border-b border-border bg-muted/30">
      <div className="max-w-7xl mx-auto px-6 sm:px-8 py-16 md:py-20">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-semibold tracking-tight mb-3">Simple. Secure. Flexible.</h2>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Simplify escrow setup. Simplify compliance. Get back to delivering great work.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {PILLARS.map(({ title, subtitle, description }, idx) => (
            <div key={title} className="card card-hover p-6 relative overflow-hidden">
              <div className="w-8 h-8 rounded-md bg-muted flex items-center justify-center text-xs font-mono font-semibold text-muted-foreground mb-4">
                0{idx + 1}
              </div>
              <h3 className="text-xl font-semibold mb-1">{title}.</h3>
              <p className="text-sm font-medium text-foreground mb-3">{subtitle}</p>
              <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>

    <section id="features" className="max-w-7xl mx-auto px-6 sm:px-8 py-16 md:py-20">
      <div className="grid lg:grid-cols-2 gap-12 items-start">
        <div>
          <h2 className="text-3xl font-semibold tracking-tight mb-4">
            Flexible escrow integration
          </h2>
          <p className="text-muted-foreground mb-8">
            Three clear paths to move from job posting to protected payment — whether you are a client, freelancer, or admin.
          </p>

          <div className="space-y-4">
            {FEATURES.map(({ title, description }) => (
              <div key={title} className="flex gap-4 p-4 rounded-lg border border-border bg-card card-hover">
                <div className="w-10 h-10 rounded-md bg-muted flex items-center justify-center shrink-0">
                  <CheckCircle2 size={18} className="text-emerald-600 dark:text-emerald-400" />
                </div>
                <div>
                  <h3 className="font-medium text-foreground mb-1">{title}</h3>
                  <p className="text-sm text-muted-foreground">{description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="card card-hover p-8 relative overflow-hidden">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold">Platform capabilities</h3>
            <Sparkles size={18} className="text-muted-foreground" />
          </div>
          <ul className="space-y-4">
            {[
              { icon: Wallet, label: 'Multi-currency wallets with admin balance assignment' },
              { icon: Briefcase, label: 'Job marketplace with create, edit, and delete' },
              { icon: Shield, label: 'Escrow states: HELD → SUBMITTED → RELEASED' },
              { icon: Scale, label: 'Dispute resolution and refund flows' },
            ].map(({ icon: Icon, label }) => (
              <li key={label} className="flex items-start gap-3 text-sm p-2.5 rounded-md hover:bg-muted/60 transition-colors">
                <div className="w-7 h-7 rounded-md bg-muted flex items-center justify-center shrink-0">
                  <Icon size={15} className="text-foreground" />
                </div>
                <span className="text-muted-foreground pt-1">{label}</span>
              </li>
            ))}
          </ul>
          <Link to="/register" className="btn-primary w-full mt-8 h-10 gap-2">
            Explore the platform
            <ChevronRight size={16} />
          </Link>
        </div>
      </div>
    </section>

    <section id="how-it-works" className="bg-zinc-900 text-zinc-50 border-y border-border relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-6 sm:px-8 py-16 md:py-20 relative">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-semibold tracking-tight mb-3">Boost trust with escrow checkout</h2>
          <p className="text-zinc-300 max-w-xl mx-auto">
            Offer clients and freelancers a payment flow that protects both sides until work is done.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 mb-12">
          {WORKFLOW_STEPS.map(({ step, title, description }) => (
            <div key={step} className="border border-white/10 rounded-lg p-6 bg-white/5 hover:bg-white/10 hover:-translate-y-0.5 transition-all duration-200">
              <span className="inline-flex items-center justify-center px-2.5 py-0.5 rounded-full bg-white/10 text-xs font-mono text-emerald-400">
                STEP {step}
              </span>
              <h3 className="text-lg font-semibold mt-3 mb-2">{title}</h3>
              <p className="text-sm text-zinc-300 leading-relaxed">{description}</p>
            </div>
          ))}
        </div>

        <div className="text-center">
          <Link to="/register" className="inline-flex items-center justify-center rounded-md bg-white text-zinc-900 px-6 h-11 text-sm font-medium hover:bg-zinc-100 hover:-translate-y-0.5 transition-all duration-200 gap-2 shadow-sm">
            Sign up free
            <ArrowRight size={16} />
          </Link>
        </div>
      </div>
    </section>

    <section className="max-w-7xl mx-auto px-6 sm:px-8 py-16 md:py-20">
      <div className="text-center mb-12">
        <h2 className="text-3xl font-semibold tracking-tight mb-3">Built for every role</h2>
        <p className="text-muted-foreground">One platform for clients, freelancers, and administrators.</p>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {ROLE_SECTIONS.map(({ id, title, description, points }) => (
          <div key={id} id={id} className="card card-hover p-6 flex flex-col">
            <h3 className="text-lg font-semibold mb-2">{title}</h3>
            <p className="text-sm text-muted-foreground mb-5 flex-grow">{description}</p>
            <ul className="space-y-2.5 pt-4 border-t border-border">
              {points.map((point) => (
                <li key={point} className="flex items-center gap-2 text-sm text-foreground">
                  <CheckCircle2 size={14} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
                  {point}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </section>

    <section className="border-y border-border bg-muted/30">
      <div className="max-w-7xl mx-auto px-6 sm:px-8 py-16 md:py-20">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-semibold tracking-tight mb-3">Tools to run your escrow business</h2>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {TOOLS.map(({ title, description }) => (
            <div key={title} className="card card-hover p-6 text-center">
              <h3 className="font-semibold mb-2">{title}</h3>
              <p className="text-sm text-muted-foreground">{description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>

    <section id="faq" className="max-w-7xl mx-auto px-6 sm:px-8 py-16 md:py-20">
      <div className="text-center mb-12">
        <h2 className="text-3xl font-semibold tracking-tight mb-3">Frequently asked questions</h2>
        <p className="text-muted-foreground">Everything you need to know about FreLock escrow protection.</p>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {FAQ_ITEMS.map(({ question, answer }) => (
          <div key={question} className="card card-hover p-6 flex flex-col">
            <h3 className="font-semibold text-foreground mb-2">{question}</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">{answer}</p>
          </div>
        ))}
      </div>
    </section>

    <section className="bg-zinc-900 text-zinc-50 border-t border-border">
      <div className="max-w-7xl mx-auto px-6 sm:px-8 py-16 md:py-20 text-center">
        <h2 className="text-3xl md:text-4xl font-semibold tracking-tight mb-4">
          One platform for secure freelance payments
        </h2>
        <p className="text-zinc-300 mb-8 max-w-lg mx-auto">
          Post jobs, hold funds in escrow, and release payments with confidence.
        </p>
        <div className="flex flex-wrap justify-center gap-3">
          <Link to="/register" className="inline-flex items-center justify-center rounded-md bg-white text-zinc-900 px-6 h-11 text-sm font-medium hover:bg-zinc-100 hover:-translate-y-0.5 transition-all duration-200">
            Get started
          </Link>
          <Link to="/login" className="inline-flex items-center justify-center rounded-md border border-white/30 text-zinc-50 px-6 h-11 text-sm font-medium hover:bg-white/10 hover:-translate-y-0.5 transition-all duration-200">
            Log in
          </Link>
        </div>
      </div>
    </section>

    <LandingFooter />
  </div>
);

export default Home;
