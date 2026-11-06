import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, Lock, CheckCircle2, Clock, IndianRupee } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import DashboardLayout from '../components/dashboard/DashboardLayout';
import Alert from '../components/ui/Alert';
import PinInput from '../components/ui/PinInput';
import { apiFetch } from '../services/api';
import { formatINR, PRIVACY_LEVELS } from '../constants/finance';

const todayISO = () => new Date().toISOString().slice(0, 10);
const splitLines = (text) => text.split('\n').map((l) => l.trim()).filter(Boolean);

const CreateJob = () => {
  const { token, user } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    title: '', description: '', budget: '', deadline: '', pin: '',
    jobLinks: '', projectLinks: '', privacyLevel: 'PUBLIC', securityNotes: '', reward: '',
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [busy, setBusy] = useState(false);

  const set = (field) => (e) => setForm((f) => ({ ...f, [field]: e?.target ? e.target.value : e }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      const data = await apiFetch('/jobs', token, {
        method: 'POST',
        body: { ...form, jobLinks: splitLines(form.jobLinks), projectLinks: splitLines(form.projectLinks) },
      });
      setSuccess(data.message);
      setTimeout(() => navigate('/jobs/my'), 1500);
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  };

  return (
    <DashboardLayout title="Post a Job" subtitle="Your budget is moved from your wallet into escrow when you post">
      <Alert type="error" className="mb-4" onClose={() => setError('')}>{error}</Alert>
      <Alert type="success" className="mb-4">{success}</Alert>

      <div className="grid lg:grid-cols-3 gap-6 items-start">
        <form onSubmit={handleSubmit} className="lg:col-span-2 card p-6 space-y-5">
          <div>
            <label htmlFor="title" className="block text-sm font-medium mb-1.5">Job Title</label>
            <input id="title" className="input-field" required maxLength={120} value={form.title} onChange={set('title')} placeholder="e.g. Build fintech dashboard" />
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium mb-1.5">Description</label>
            <textarea id="description" className="input-field min-h-[110px]" required rows={4} maxLength={5000} value={form.description} onChange={set('description')} placeholder="Full project scope and deliverables..." />
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="budget" className="block text-sm font-medium mb-1.5">Budget (₹ INR)</label>
              <input id="budget" type="number" inputMode="decimal" className="input-field" required min="1" step="0.01" value={form.budget} onChange={set('budget')} placeholder="25000" />
              <p className="text-xs text-muted-foreground mt-1">Held in escrow immediately. It can&apos;t be edited later.</p>
            </div>
            <div>
              <label htmlFor="deadline" className="block text-sm font-medium mb-1.5">Deadline</label>
              <input id="deadline" type="date" className="input-field" required min={todayISO()} value={form.deadline} onChange={set('deadline')} />
            </div>
          </div>

          <div>
            <label htmlFor="reward" className="block text-sm font-medium mb-1.5">Bonus / Reward (optional)</label>
            <input id="reward" className="input-field" maxLength={200} value={form.reward} onChange={set('reward')} placeholder="e.g. ₹5,000 bonus for early delivery" />
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="jobLinks" className="block text-sm font-medium mb-1.5">Job Links (one per line)</label>
              <textarea id="jobLinks" className="input-field" rows={2} value={form.jobLinks} onChange={set('jobLinks')} placeholder="https://figma.com/..." />
            </div>
            <div>
              <label htmlFor="projectLinks" className="block text-sm font-medium mb-1.5">Project Links (one per line)</label>
              <textarea id="projectLinks" className="input-field" rows={2} value={form.projectLinks} onChange={set('projectLinks')} placeholder="https://github.com/..." />
            </div>
          </div>

          <fieldset>
            <legend className="block text-sm font-medium mb-1.5">Privacy & Security Level</legend>
            <div className="grid sm:grid-cols-3 gap-2">
              {PRIVACY_LEVELS.map(({ value, label, description }) => (
                <label key={value} className={`p-3 rounded-md border cursor-pointer text-sm transition-colors ${form.privacyLevel === value ? 'border-primary bg-primary/5 ring-1 ring-primary' : 'border-border hover:bg-muted/50'}`}>
                  <input type="radio" name="privacy" value={value} checked={form.privacyLevel === value} onChange={() => set('privacyLevel')(value)} className="sr-only" />
                  <p className="font-medium">{label}</p>
                  <p className="text-xs text-muted-foreground mt-1">{description}</p>
                </label>
              ))}
            </div>
          </fieldset>

          <div>
            <label htmlFor="securityNotes" className="block text-sm font-medium mb-1.5">Security & NDA Notes</label>
            <textarea id="securityNotes" className="input-field" rows={2} maxLength={2000} value={form.securityNotes} onChange={set('securityNotes')} placeholder="Confidential data handling, IP ownership, NDA requirements..." />
          </div>

          <div className="border-t border-border pt-5">
            <label htmlFor="pin" className="block text-sm font-medium mb-1.5">
              Wallet PIN {form.budget && <span className="text-muted-foreground font-normal">— confirms moving {formatINR(form.budget)} to escrow</span>}
            </label>
            <PinInput id="pin" value={form.pin} onChange={set('pin')} placeholder="4-digit PIN" />
          </div>

          <div className="flex gap-3">
            <button type="button" onClick={() => navigate('/dashboard')} className="btn-secondary flex-1">Cancel</button>
            <button type="submit" disabled={busy} className="btn-primary flex-1">{busy ? 'Posting…' : 'Post Job & Lock Funds'}</button>
          </div>
        </form>

        <div className="space-y-4 lg:sticky lg:top-20">
          <div className="card p-6 bg-gradient-to-br from-zinc-900 via-zinc-900 to-zinc-800 text-zinc-50 border-zinc-800 relative overflow-hidden">
            <div className="pointer-events-none absolute -right-6 -top-6 w-28 h-28 rounded-full bg-emerald-500/15 blur-2xl" />
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-medium uppercase tracking-wider text-zinc-400">Live Escrow Preview</span>
              <Shield size={16} className="text-emerald-400" />
            </div>

            <div className="bg-white/5 border border-white/10 rounded-md p-4 space-y-2 mb-4">
              <p className="text-sm font-semibold truncate">{form.title || 'Untitled Project'}</p>
              <p className="text-xs text-zinc-400 line-clamp-2">{form.description || 'Your project scope and deliverables will appear here.'}</p>
              <div className="flex flex-wrap gap-2 pt-2">
                <span className="text-[11px] px-2 py-0.5 rounded bg-white/10 text-zinc-200">{form.privacyLevel}</span>
                {form.reward && <span className="text-[11px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300">+ {form.reward}</span>}
              </div>
            </div>

            <div className="flex items-center justify-between py-3 border-y border-white/10 text-sm">
              <span className="text-zinc-400 flex items-center gap-1.5"><IndianRupee size={14} /> Escrow Hold</span>
              <span className="text-xl font-bold text-white">{form.budget ? formatINR(form.budget) : '₹0'}</span>
            </div>

            <div className="flex items-center justify-between pt-3 text-xs text-zinc-400">
              <span className="flex items-center gap-1"><Clock size={12} /> Deadline</span>
              <span className="text-zinc-200">{form.deadline ? new Date(form.deadline).toLocaleDateString('en-IN') : 'Not set'}</span>
            </div>
            <div className="flex items-center justify-between pt-2 text-xs text-zinc-400">
              <span>Client</span>
              <span className="text-zinc-200">{user?.name}</span>
            </div>
          </div>

          <div className="card p-5 space-y-3">
            <div className="flex items-center gap-2 text-sm font-semibold">
              <Lock size={15} className="text-emerald-600 dark:text-emerald-400" />
              How FreLock Protects Your Budget
            </div>
            <ul className="space-y-2.5 text-xs text-muted-foreground">
              <li className="flex items-start gap-2">
                <CheckCircle2 size={14} className="text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                Funds are locked in escrow — the freelancer is not paid until you approve the submitted work.
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 size={14} className="text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                Delete any unassigned job at any time for an instant 100% refund to your wallet.
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 size={14} className="text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                Neutral Admin dispute resolution protects both sides if deliverables don&apos;t match scope.
              </li>
            </ul>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default CreateJob;
