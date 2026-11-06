import React, { useState, useEffect, useCallback } from 'react';
import { Wallet as WalletIcon, Lock, IndianRupee, CreditCard, Smartphone, KeyRound } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { apiFetch } from '../../services/api';
import { formatINR, CURRENCY, FINANCE_STEPS } from '../../constants/finance';
import Alert from '../ui/Alert';
import PinInput from '../ui/PinInput';

const PAYMENT_METHODS = [
  { id: 'UPI', label: 'UPI', icon: Smartphone },
  { id: 'CARD', label: 'Debit Card', icon: CreditCard },
  { id: 'NETBANKING', label: 'Net Banking', icon: IndianRupee },
];

const EMPTY_FORM = { pin: '', confirmPin: '', currentPin: '', amount: '', topupPin: '' };

const WalletPanel = ({ onUpdate }) => {
  const { token } = useAuth();
  const [wallet, setWallet] = useState(null);
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState('view'); // view | pin | change | add
  const [form, setForm] = useState(EMPTY_FORM);
  const [method, setMethod] = useState('UPI');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const set = (field) => (value) => setForm((f) => ({ ...f, [field]: value }));

  const fetchWallet = useCallback(async () => {
    try {
      const data = await apiFetch('/wallets/me', token);
      setWallet(data);
      onUpdate?.(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [token, onUpdate]);

  useEffect(() => {
    fetchWallet();
  }, [fetchWallet]);

  const openMode = (next) => {
    setMode(next);
    setForm(EMPTY_FORM);
    setError('');
    setMessage('');
  };

  const submit = async (e, path, body, successMessage) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      const data = await apiFetch(path, token, { method: 'POST', body });
      setMessage(successMessage || data.message);
      setMode('view');
      setForm(EMPTY_FORM);
      await fetchWallet();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  if (loading) return <div className="card p-6 text-sm text-muted-foreground">Loading wallet...</div>;

  return (
    <div className="space-y-4">
      <div className="card p-6 bg-gradient-to-br from-zinc-900 via-zinc-900 to-zinc-800 text-zinc-50 border-zinc-800 relative overflow-hidden shadow-lg">
        <div className="pointer-events-none absolute -right-8 -top-8 w-32 h-32 rounded-full bg-emerald-500/10 blur-2xl" />
        <div className="flex items-center justify-between mb-4 relative">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-md bg-white/10 flex items-center justify-center">
              <WalletIcon size={15} />
            </div>
            <span className="text-sm font-medium tracking-wide">INR Wallet</span>
          </div>
          <span className="badge bg-white/10 text-zinc-100 border-white/20 text-xs gap-1.5">
            <span className={`w-1.5 h-1.5 rounded-full ${wallet?.hasPin ? 'bg-emerald-400 animate-pulse-soft' : 'bg-amber-400'}`} />
            {wallet?.hasPin ? 'PIN Secured' : 'PIN not set'}
          </span>
        </div>
        <p className="text-xs text-zinc-400 mb-1">Available Balance</p>
        <p className="text-3xl font-bold tracking-tight">{formatINR(wallet?.balance)}</p>
        <div className="flex gap-2 mt-5 relative">
          {!wallet?.hasPin ? (
            <button type="button" onClick={() => openMode('pin')} className="flex-1 bg-white text-zinc-900 hover:bg-zinc-100 h-9 rounded-md text-sm font-medium inline-flex items-center justify-center gap-1 transition-all duration-200 hover:-translate-y-[1px] active:scale-[0.98]">
              <Lock size={14} /> Set PIN
            </button>
          ) : (
            <>
              <button type="button" onClick={() => openMode('add')} className="flex-1 bg-white text-zinc-900 hover:bg-zinc-100 h-9 rounded-md text-sm font-medium inline-flex items-center justify-center gap-1 transition-all duration-200 hover:-translate-y-[1px] active:scale-[0.98]">
                <IndianRupee size={14} /> Add Money
              </button>
              <button type="button" onClick={() => openMode('change')} className="h-9 px-3 rounded-md text-sm font-medium border border-white/30 text-zinc-50 hover:bg-white/10 inline-flex items-center gap-1 transition-all duration-200" title="Change PIN">
                <KeyRound size={14} />
              </button>
            </>
          )}
        </div>
      </div>

      <Alert type="success" onClose={() => setMessage('')}>{message}</Alert>
      <Alert type="error" onClose={() => setError('')}>{error}</Alert>

      {mode === 'pin' && (
        <form onSubmit={(e) => submit(e, '/wallets/setup-pin', { pin: form.pin, confirmPin: form.confirmPin })} className="card p-5 space-y-4">
          <h3 className="text-sm font-medium">Create a 4-digit wallet PIN</h3>
          <p className="text-xs text-muted-foreground">You&apos;ll need it to add money, post jobs and release payments.</p>
          <PinInput value={form.pin} onChange={set('pin')} placeholder="New PIN" autoFocus />
          <PinInput value={form.confirmPin} onChange={set('confirmPin')} placeholder="Confirm PIN" />
          <div className="flex gap-2">
            <button type="button" onClick={() => setMode('view')} className="btn-secondary flex-1">Cancel</button>
            <button type="submit" disabled={busy} className="btn-primary flex-1">Save PIN</button>
          </div>
        </form>
      )}

      {mode === 'change' && (
        <form
          onSubmit={(e) => submit(e, '/wallets/setup-pin', { currentPin: form.currentPin, pin: form.pin, confirmPin: form.confirmPin })}
          className="card p-5 space-y-4"
        >
          <h3 className="text-sm font-medium">Change wallet PIN</h3>
          <PinInput value={form.currentPin} onChange={set('currentPin')} placeholder="Current PIN" autoFocus />
          <PinInput value={form.pin} onChange={set('pin')} placeholder="New PIN" />
          <PinInput value={form.confirmPin} onChange={set('confirmPin')} placeholder="Confirm new PIN" />
          <div className="flex gap-2">
            <button type="button" onClick={() => setMode('view')} className="btn-secondary flex-1">Cancel</button>
            <button type="submit" disabled={busy} className="btn-primary flex-1">Change PIN</button>
          </div>
        </form>
      )}

      {mode === 'add' && (
        <form onSubmit={(e) => submit(e, '/wallets/add-money', { amount: Number(form.amount), pin: form.topupPin, method })} className="card p-5 space-y-4">
          <h3 className="text-sm font-medium">Add money to wallet ({CURRENCY}) — simulated</h3>
          <div className="grid grid-cols-3 gap-2">
            {PAYMENT_METHODS.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                type="button"
                onClick={() => setMethod(id)}
                aria-pressed={method === id}
                className={`p-3 rounded-md border text-xs font-medium flex flex-col items-center gap-1 ${
                  method === id ? 'border-primary bg-primary/5' : 'border-border'
                }`}
              >
                <Icon size={16} />
                {label}
              </button>
            ))}
          </div>
          <input type="number" min="1" max="1000000" step="0.01" inputMode="decimal" placeholder="Amount in ₹" value={form.amount} onChange={(e) => set('amount')(e.target.value)} className="input-field" required />
          <PinInput value={form.topupPin} onChange={set('topupPin')} />
          <div className="flex gap-2">
            <button type="button" onClick={() => setMode('view')} className="btn-secondary flex-1">Cancel</button>
            <button type="submit" disabled={busy} className="btn-primary flex-1">Add {form.amount ? formatINR(form.amount) : 'Money'}</button>
          </div>
        </form>
      )}

      <div className="card p-5">
        <h3 className="text-sm font-medium mb-4">Payment Workflow</h3>
        <div className="space-y-3">
          {FINANCE_STEPS.map(({ step, title, description }) => (
            <div key={step} className="flex gap-3">
              <span className="w-6 h-6 rounded-full bg-muted flex items-center justify-center text-xs font-medium shrink-0">{step}</span>
              <div>
                <p className="text-sm font-medium">{title}</p>
                <p className="text-xs text-muted-foreground">{description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default WalletPanel;
