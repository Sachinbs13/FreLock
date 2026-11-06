import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, Users, Briefcase, IndianRupee, MessageSquare, Shield, Flag, Lock } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import Alert from '../components/ui/Alert';
import Modal from '../components/ui/Modal';
import StatusBadge from '../components/ui/StatusBadge';
import ThemeToggle from '../components/ui/ThemeToggle';
import { apiFetch } from '../services/api';
import { formatINR, TX_LABELS } from '../constants/finance';
import { ROLES } from '../constants/roles';

const TABS = ['disputes', 'users', 'wallets', 'escrows', 'transactions'];

const Table = ({ headers, children, empty }) => (
  <div className="overflow-x-auto">
    <table className="w-full text-sm">
      <thead>
        <tr className="border-b border-border">
          {headers.map((h) => (
            <th key={h} className={`pb-2 font-medium text-muted-foreground ${h.endsWith(' ') ? 'text-right' : 'text-left'}`}>{h.trim()}</th>
          ))}
        </tr>
      </thead>
      <tbody>{children}</tbody>
    </table>
    {empty && <p className="text-sm text-muted-foreground py-6 text-center">{empty}</p>}
  </div>
);

const AdminDashboard = () => {
  const { token, logout } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState({ users: [], wallets: [], stats: null, disputes: [], escrows: [], transactions: [] });
  const [tab, setTab] = useState('disputes');
  const [userFilter, setUserFilter] = useState(ROLES.CLIENT);
  const [assignForm, setAssignForm] = useState({ userId: '', amount: '' });
  const [resolving, setResolving] = useState(null);
  const [resolution, setResolution] = useState({ winnerId: '', note: '' });
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const fetchAll = useCallback(async () => {
    try {
      const [users, wallets, stats, disputes, escrows, transactions] = await Promise.all([
        apiFetch('/users', token),
        apiFetch('/wallets', token),
        apiFetch('/admin/stats', token),
        apiFetch('/dispute', token),
        apiFetch('/escrow', token),
        apiFetch('/history/transactions/all', token),
      ]);
      setData({ users, wallets, stats, disputes, escrows, transactions });
    } catch (err) {
      setError(err.message);
    }
  }, [token]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const run = async (fn) => {
    setMessage('');
    setError('');
    try {
      const res = await fn();
      setMessage(res.message);
      await fetchAll();
      return true;
    } catch (err) {
      setError(err.message);
      return false;
    }
  };

  const handleAssign = async (e) => {
    e.preventDefault();
    const target = data.users.find((u) => u.id === assignForm.userId);
    if (!window.confirm(`Set ${target?.name}'s wallet balance to exactly ${formatINR(assignForm.amount)}?`)) return;
    if (await run(() => apiFetch('/wallets/assign', token, { method: 'POST', body: assignForm }))) {
      setAssignForm({ userId: '', amount: '' });
    }
  };

  const handleFreeze = (u) => {
    const verb = u.status === 'FROZEN' ? 'Unfreeze' : 'Freeze';
    if (!window.confirm(`${verb} ${u.name}? ${verb === 'Freeze' ? 'They will be signed out immediately.' : ''}`)) return;
    run(() => apiFetch(`/users/${u.id}/freeze`, token, { method: 'PUT' }));
  };

  const openResolve = (d) => {
    setResolving(d);
    setResolution({ winnerId: '', note: '' });
    setError('');
  };

  const handleResolve = async (e) => {
    e.preventDefault();
    const ok = await run(() =>
      apiFetch('/dispute/resolve', token, {
        method: 'POST',
        body: { disputeId: resolving.disputeId, winnerId: resolution.winnerId, resolution: resolution.note },
      })
    );
    if (ok) setResolving(null);
  };

  const { stats } = data;
  const statCards = stats
    ? [
        { label: 'Clients', value: stats.clients, icon: Users },
        { label: 'Freelancers', value: stats.freelancers, icon: Briefcase },
        { label: 'Wallet Balances', value: formatINR(stats.totalBalance), icon: IndianRupee },
        { label: 'Held in Escrow', value: formatINR(stats.escrowHeld), icon: Lock },
        { label: 'Open Jobs', value: `${stats.openJobs} / ${stats.totalJobs}`, icon: Shield },
        { label: 'Open Disputes', value: stats.openDisputes, icon: Flag, alert: stats.openDisputes > 0 },
        { label: 'Messages', value: stats.totalMessages, icon: MessageSquare },
      ]
    : [];

  const openDisputes = data.disputes.filter((d) => d.status === 'OPEN').length;
  const shownUsers = data.users.filter((u) => u.role === userFilter);

  return (
    <div className="page-container bg-muted/30 bg-grid-pattern">
      <div className="w-full max-w-[1600px] mx-auto">
        <header className="card p-5 mb-6 bg-gradient-to-r from-card via-card to-muted/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative overflow-hidden">
          <div className="absolute inset-y-0 left-0 w-1 bg-gradient-to-b from-emerald-500 to-zinc-900 dark:to-zinc-100" />
          <div className="pl-2">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-7 h-7 bg-primary rounded-md flex items-center justify-center">
                <Shield size={14} className="text-primary-foreground" />
              </div>
              <span className="font-serif text-lg font-semibold tracking-tight">FreLock</span>
              <span className="badge badge-secondary text-xs">Admin</span>
            </div>
            <h1 className="page-title">Admin Control Centre</h1>
            <p className="text-sm text-muted-foreground mt-1">Users, INR wallets, escrow and dispute resolution</p>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <button type="button" onClick={() => { logout(); navigate('/'); }} className="btn-secondary gap-2">
              <LogOut size={16} /> Logout
            </button>
          </div>
        </header>

        <Alert type="success" className="mb-4" onClose={() => setMessage('')}>{message}</Alert>
        {!resolving && <Alert type="error" className="mb-4" onClose={() => setError('')}>{error}</Alert>}

        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3 mb-6">
          {statCards.map(({ label, value, icon: Icon, alert }) => (
            <div key={label} className={`card p-4 ${alert ? 'border-red-200 bg-red-50 dark:border-red-900/60 dark:bg-red-950/30' : ''}`}>
              <div className="flex items-center justify-between mb-1">
                <p className="text-xs text-muted-foreground">{label}</p>
                <Icon size={14} className={alert ? 'text-red-600 dark:text-red-400' : 'text-muted-foreground'} />
              </div>
              <p className="text-lg font-semibold">{value}</p>
            </div>
          ))}
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          <div className="card p-6 h-fit">
            <h2 className="text-sm font-medium mb-1">Set Wallet Balance</h2>
            <p className="text-xs text-muted-foreground mb-4">Sets the exact balance. The difference is logged as an admin adjustment.</p>
            <form onSubmit={handleAssign} className="space-y-3">
              <select className="input-field" value={assignForm.userId} onChange={(e) => setAssignForm({ ...assignForm, userId: e.target.value })} required>
                <option value="">Select user</option>
                {data.users.map((u) => <option key={u.id} value={u.id}>{u.name} ({u.role})</option>)}
              </select>
              <input type="number" min="0" step="0.01" className="input-field" placeholder="New balance in ₹" value={assignForm.amount} onChange={(e) => setAssignForm({ ...assignForm, amount: e.target.value })} required />
              <button type="submit" className="btn-primary w-full">Set Balance</button>
            </form>
          </div>

          <div className="card p-6 lg:col-span-2 min-w-0">
            <div className="flex gap-1 mb-4 overflow-x-auto -mx-1 px-1">
              {TABS.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTab(t)}
                  className={`px-3 py-1.5 rounded-md text-sm font-medium capitalize whitespace-nowrap ${tab === t ? 'bg-primary text-primary-foreground' : 'bg-muted hover:opacity-80'}`}
                >
                  {t}{t === 'disputes' && openDisputes > 0 ? ` (${openDisputes})` : ''}
                </button>
              ))}
            </div>

            {tab === 'disputes' && (
              <div className="space-y-3">
                {data.disputes.length === 0 && <p className="text-sm text-muted-foreground py-6 text-center">No disputes raised.</p>}
                {data.disputes.map((d) => (
                  <div key={d.disputeId} className={`border rounded-md p-4 ${d.status === 'OPEN' ? 'border-red-200' : 'border-border'}`}>
                    <div className="flex flex-wrap justify-between gap-2 mb-2">
                      <div>
                        <p className="font-medium">{d.jobTitle} · {formatINR(d.amount)}</p>
                        <p className="text-xs text-muted-foreground">
                          Client: {d.client?.name} · Freelancer: {d.freelancer?.name} · Raised by {d.raisedByName} on {new Date(d.createdAt).toLocaleDateString('en-IN')}
                        </p>
                      </div>
                      <StatusBadge status={d.status} />
                    </div>
                    <p className="text-sm bg-muted rounded p-2 whitespace-pre-wrap">{d.reason}</p>
                    {d.status === 'OPEN' ? (
                      <button type="button" onClick={() => openResolve(d)} className="btn-primary h-8 text-xs mt-3">Resolve</button>
                    ) : (
                      <p className="text-xs text-muted-foreground mt-2">Awarded to <strong>{d.winnerName}</strong>{d.resolution && ` — ${d.resolution}`}</p>
                    )}
                  </div>
                ))}
              </div>
            )}

            {tab === 'users' && (
              <>
                <div className="flex gap-2 mb-3">
                  {[ROLES.CLIENT, ROLES.FREELANCER].map((r) => (
                    <button key={r} type="button" onClick={() => setUserFilter(r)} className={`text-xs px-3 py-1 rounded-full border ${userFilter === r ? 'border-primary bg-primary/5' : 'border-border'}`}>
                      {r}s ({data.users.filter((u) => u.role === r).length})
                    </button>
                  ))}
                </div>
                <Table headers={['Name', 'Email', 'Status', 'Action ']} empty={shownUsers.length === 0 && 'No users'}>
                  {shownUsers.map((u) => (
                    <tr key={u.id} className="border-b border-border">
                      <td className="py-2 pr-2">{u.name}</td>
                      <td className="py-2 pr-2 text-muted-foreground">{u.email}</td>
                      <td className="py-2 pr-2"><StatusBadge status={u.status} /></td>
                      <td className="py-2 text-right">
                        <button type="button" onClick={() => handleFreeze(u)} className={`${u.status === 'FROZEN' ? 'btn-secondary' : 'btn-destructive'} h-7 text-xs px-2`}>
                          {u.status === 'FROZEN' ? 'Unfreeze' : 'Freeze'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </Table>
              </>
            )}

            {tab === 'wallets' && (
              <Table headers={['User', 'Role', 'PIN', 'Balance ']} empty={data.wallets.length === 0 && 'No wallets yet'}>
                {data.wallets.map((w) => (
                  <tr key={w.id} className="border-b border-border">
                    <td className="py-2 pr-2">{w.userName}<p className="text-xs text-muted-foreground">{w.userEmail}</p></td>
                    <td className="py-2 pr-2 text-muted-foreground">{w.userRole}</td>
                    <td className="py-2 pr-2">{w.hasPin ? 'Set' : 'Not set'}</td>
                    <td className="py-2 text-right font-medium">{formatINR(w.balance)}</td>
                  </tr>
                ))}
              </Table>
            )}

            {tab === 'escrows' && (
              <Table headers={['Job', 'Parties', 'Status', 'Amount ']} empty={data.escrows.length === 0 && 'No escrows yet'}>
                {data.escrows.map((e) => (
                  <tr key={e.escrowId} className="border-b border-border">
                    <td className="py-2 pr-2">{e.jobTitle}</td>
                    <td className="py-2 pr-2 text-xs text-muted-foreground">{e.clientName} → {e.freelancerName || '—'}</td>
                    <td className="py-2 pr-2"><StatusBadge status={e.status} /></td>
                    <td className="py-2 text-right font-medium">{formatINR(e.amount)}</td>
                  </tr>
                ))}
              </Table>
            )}

            {tab === 'transactions' && (
              <Table headers={['Date', 'Type', 'From → To', 'Amount ']} empty={data.transactions.length === 0 && 'No transactions yet'}>
                {data.transactions.slice(0, 200).map((t) => (
                  <tr key={t.transactionId} className="border-b border-border">
                    <td className="py-2 pr-2 text-xs text-muted-foreground whitespace-nowrap">{new Date(t.createdAt).toLocaleString('en-IN')}</td>
                    <td className="py-2 pr-2 whitespace-nowrap"><span className="badge badge-outline">{TX_LABELS[t.type] || t.type}</span></td>
                    <td className="py-2 pr-2 text-xs whitespace-nowrap">{t.fromName} → {t.toName}</td>
                    <td className="py-2 text-right font-medium whitespace-nowrap">{formatINR(t.amount)}</td>
                  </tr>
                ))}
              </Table>
            )}
          </div>
        </div>
      </div>

      <Modal open={Boolean(resolving)} onClose={() => setResolving(null)} title="Resolve dispute">
        {resolving && (
          <form onSubmit={handleResolve} className="space-y-4">
            <p className="text-sm text-muted-foreground">{resolving.jobTitle} · {formatINR(resolving.amount)}</p>
            <fieldset className="space-y-2">
              <legend className="text-sm font-medium mb-1">Award the escrow to</legend>
              {[
                { party: resolving.client, effect: 'refund to client' },
                { party: resolving.freelancer, effect: 'release to freelancer' },
              ].filter((o) => o.party).map(({ party, effect }) => (
                <label key={party.id} className={`flex items-center gap-3 p-3 rounded-md border cursor-pointer ${resolution.winnerId === party.id ? 'border-primary bg-primary/5' : 'border-border'}`}>
                  <input type="radio" name="winner" required value={party.id} checked={resolution.winnerId === party.id} onChange={() => setResolution({ ...resolution, winnerId: party.id })} />
                  <span className="text-sm"><strong>{party.name}</strong> <span className="text-muted-foreground">({effect})</span></span>
                </label>
              ))}
            </fieldset>
            <textarea className="input-field min-h-[80px]" maxLength={2000} placeholder="Resolution note (visible to both parties)" value={resolution.note} onChange={(e) => setResolution({ ...resolution, note: e.target.value })} />
            <Alert type="error">{error}</Alert>
            <div className="flex gap-2">
              <button type="button" onClick={() => setResolving(null)} className="btn-secondary flex-1">Cancel</button>
              <button type="submit" className="btn-primary flex-1">Confirm decision</button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
};

export default AdminDashboard;
