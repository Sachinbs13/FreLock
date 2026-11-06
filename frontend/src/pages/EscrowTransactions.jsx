import React, { useState, useEffect, useCallback } from 'react';
import { Flag, Shield, Lock, CheckCircle2, AlertTriangle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import DashboardLayout from '../components/dashboard/DashboardLayout';
import Alert from '../components/ui/Alert';
import Modal from '../components/ui/Modal';
import PinInput from '../components/ui/PinInput';
import StatusBadge from '../components/ui/StatusBadge';
import { apiFetch } from '../services/api';
import { formatINR } from '../constants/finance';
import { ROLES } from '../constants/roles';

const EscrowTransactions = () => {
  const { token, user } = useAuth();
  const isClient = user.role === ROLES.CLIENT;
  const isFreelancer = user.role === ROLES.FREELANCER;

  const [escrows, setEscrows] = useState([]);
  const [disputes, setDisputes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [modal, setModal] = useState(null); // { type: 'approve'|'submit'|'dispute', escrow }
  const [pin, setPin] = useState('');
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const [e, d] = await Promise.all([apiFetch('/escrow/my', token), apiFetch('/dispute/my', token)]);
      setEscrows(e);
      setDisputes(d);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const openModal = (type, escrow) => {
    setModal({ type, escrow });
    setPin('');
    setText('');
    setError('');
  };
  const closeModal = () => setModal(null);

  const submitModal = async (e) => {
    e.preventDefault();
    const { type, escrow } = modal;
    const request = {
      approve: ['/escrow/approve', { escrowId: escrow.escrowId, pin }],
      submit: ['/escrow/submit', { escrowId: escrow.escrowId, note: text }],
      dispute: ['/dispute/raise', { escrowId: escrow.escrowId, reason: text }],
    }[type];

    setBusy(true);
    setError('');
    try {
      const data = await apiFetch(request[0], token, { method: 'POST', body: request[1] });
      setMessage(data.message);
      closeModal();
      await fetchData();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const disputeFor = (escrowId) => disputes.find((d) => d.escrowId === escrowId);

  const actionsFor = (escrow) => {
    const canDispute = escrow.freelancerId && ['HELD', 'SUBMITTED'].includes(escrow.status);
    return (
      <div className="flex flex-wrap gap-2 justify-end">
        {isFreelancer && escrow.status === 'HELD' && (
          <button type="button" onClick={() => openModal('submit', escrow)} className="btn-primary h-8 text-xs px-3">Submit Work</button>
        )}
        {isClient && escrow.status === 'SUBMITTED' && (
          <button type="button" onClick={() => openModal('approve', escrow)} className="btn-primary h-8 text-xs px-3">Approve & Pay</button>
        )}
        {canDispute && (
          <button type="button" onClick={() => openModal('dispute', escrow)} className="btn-destructive h-8 text-xs px-3 gap-1">
            <Flag size={12} /> Dispute
          </button>
        )}
      </div>
    );
  };

  const MODAL_COPY = {
    approve: { title: 'Release payment', button: 'Release ₹' },
    submit: { title: 'Submit work', button: 'Submit for review' },
    dispute: { title: 'Raise a dispute', button: 'Raise dispute' },
  };

  const heldTotal = escrows.filter((e) => ['HELD', 'SUBMITTED', 'DISPUTED'].includes(e.status)).reduce((s, e) => s + e.amount, 0);
  const releasedTotal = escrows.filter((e) => e.status === 'RELEASED').reduce((s, e) => s + e.amount, 0);
  const submittedCount = escrows.filter((e) => e.status === 'SUBMITTED').length;

  const summaryStats = [
    { label: 'Total Contracts', value: escrows.length, icon: Shield },
    { label: 'Active in Escrow', value: formatINR(heldTotal), icon: Lock },
    { label: 'Awaiting Review', value: submittedCount, icon: AlertTriangle },
    { label: 'Total Released', value: formatINR(releasedTotal), icon: CheckCircle2 },
  ];

  return (
    <DashboardLayout title="Escrow Vault" subtitle="Track held funds, submit work, release payments and raise disputes">
      <Alert type="success" className="mb-4" onClose={() => setMessage('')}>{message}</Alert>
      {!modal && <Alert type="error" className="mb-4" onClose={() => setError('')}>{error}</Alert>}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {summaryStats.map(({ label, value, icon: Icon }) => (
          <div key={label} className="card card-hover p-4 relative overflow-hidden">
            <div className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-emerald-500/60 to-transparent" />
            <div className="flex items-center justify-between mb-1">
              <p className="text-xs text-muted-foreground">{label}</p>
              <Icon size={14} className="text-muted-foreground" />
            </div>
            <p className="text-xl sm:text-2xl font-semibold tracking-tight">{value}</p>
          </div>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-12 text-muted-foreground text-sm">Loading escrows...</div>
      ) : escrows.length === 0 ? (
        <div className="card p-12 text-center space-y-2">
          <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center mx-auto">
            <Shield size={18} className="text-muted-foreground" />
          </div>
          <p className="text-sm font-medium">No escrow transactions yet</p>
          <p className="text-xs text-muted-foreground max-w-md mx-auto">
            Funds are automatically locked in escrow when a client posts a job and released when submitted work is approved.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {escrows.map((escrow) => {
            const dispute = disputeFor(escrow.escrowId);
            return (
              <div key={escrow.escrowId} className="card card-hover p-5">
                <div className="flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold truncate">{escrow.jobTitle}</p>
                      <StatusBadge status={escrow.status} />
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {isClient ? `Freelancer: ${escrow.freelancerName || 'not hired yet'}` : `Client: ${escrow.clientName}`}
                      {' · '}{new Date(escrow.createdAt).toLocaleDateString('en-IN')}
                    </p>
                  </div>
                  <div className="flex items-center gap-4 justify-between sm:justify-end">
                    <span className="text-lg font-bold">{formatINR(escrow.amount)}</span>
                    {actionsFor(escrow)}
                  </div>
                </div>

                {escrow.submissionNote && (
                  <div className="mt-3 text-sm bg-muted rounded-md p-3 whitespace-pre-wrap break-words">
                    <span className="font-medium">Delivery note: </span>{escrow.submissionNote}
                  </div>
                )}
                {dispute && (
                  <div className={`mt-3 text-sm rounded-md p-3 ${dispute.status === 'OPEN' ? 'bg-red-50 text-red-800 dark:bg-red-950/40 dark:text-red-300' : 'bg-muted'}`}>
                    <span className="font-medium">Dispute ({dispute.status.toLowerCase()}): </span>
                    {dispute.reason}
                    {dispute.status === 'RESOLVED' && (
                      <p className="mt-1 text-xs">
                        Decided in favour of <strong>{dispute.winnerName}</strong>
                        {dispute.resolution && ` — ${dispute.resolution}`}
                      </p>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <Modal open={Boolean(modal)} onClose={closeModal} title={modal ? MODAL_COPY[modal.type].title : ''}>
        {modal && (
          <form onSubmit={submitModal} className="space-y-4">
            <p className="text-sm text-muted-foreground">
              <span className="font-medium text-foreground">{modal.escrow.jobTitle}</span> · {formatINR(modal.escrow.amount)}
            </p>
            {modal.type === 'approve' && (
              <>
                <p className="text-sm text-muted-foreground">This releases the escrow to the freelancer. It cannot be undone.</p>
                <PinInput value={pin} onChange={setPin} autoFocus />
              </>
            )}
            {modal.type === 'submit' && (
              <textarea className="input-field min-h-[90px]" maxLength={2000} value={text} onChange={(e) => setText(e.target.value)} placeholder="Optional: delivery note, links to files or repository…" autoFocus />
            )}
            {modal.type === 'dispute' && (
              <>
                <p className="text-sm text-muted-foreground">Funds stay frozen until an admin decides who receives them.</p>
                <textarea className="input-field min-h-[90px]" required minLength={10} maxLength={2000} value={text} onChange={(e) => setText(e.target.value)} placeholder="Describe the problem (min. 10 characters)" autoFocus />
              </>
            )}
            <Alert type="error">{error}</Alert>
            <div className="flex gap-2">
              <button type="button" onClick={closeModal} className="btn-secondary flex-1">Cancel</button>
              <button type="submit" disabled={busy} className={`${modal.type === 'dispute' ? 'btn-destructive' : 'btn-primary'} flex-1`}>
                {MODAL_COPY[modal.type].button}
              </button>
            </div>
          </form>
        )}
      </Modal>
    </DashboardLayout>
  );
};

export default EscrowTransactions;
