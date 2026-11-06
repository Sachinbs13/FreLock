import React, { useState, useEffect } from 'react';
import { ArrowDownLeft, ArrowUpRight, ReceiptText } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import DashboardLayout from '../components/dashboard/DashboardLayout';
import Alert from '../components/ui/Alert';
import { apiFetch } from '../services/api';
import { formatINR, TX_LABELS } from '../constants/finance';

const TransactionHistory = () => {
  const { token, user } = useAuth();
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    apiFetch('/history/transactions/my', token)
      .then(setTransactions)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [token]);

  const signed = (tx) => {
    if (tx.amount === 0) return { text: '—', tone: 'text-muted-foreground' };
    if (tx.to === user.id) return { text: `+${formatINR(tx.amount)}`, tone: 'text-emerald-700 dark:text-emerald-400' };
    return { text: `−${formatINR(tx.amount)}`, tone: 'text-foreground' };
  };

  const totalIn = transactions.filter((tx) => tx.to === user.id).reduce((s, tx) => s + tx.amount, 0);
  const totalOut = transactions.filter((tx) => tx.from === user.id).reduce((s, tx) => s + tx.amount, 0);

  const summary = [
    { label: 'Total Credited', value: formatINR(totalIn), icon: ArrowDownLeft },
    { label: 'Total Debited / Locked', value: formatINR(totalOut), icon: ArrowUpRight },
    { label: 'Ledger Entries', value: transactions.length, icon: ReceiptText },
  ];

  return (
    <DashboardLayout title="Transaction History" subtitle="Complete audit trail of your wallet and escrow activity">
      <Alert type="error" className="mb-4">{error}</Alert>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        {summary.map(({ label, value, icon: Icon }) => (
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
        <div className="text-center py-12 text-muted-foreground text-sm">Loading history...</div>
      ) : transactions.length === 0 ? (
        <div className="card p-12 text-center space-y-2">
          <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center mx-auto">
            <ReceiptText size={18} className="text-muted-foreground" />
          </div>
          <p className="text-sm font-medium">No transactions yet</p>
          <p className="text-xs text-muted-foreground max-w-md mx-auto">
            Every wallet top-up, escrow lock, payout, and refund is recorded here automatically.
          </p>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-muted border-b border-border">
                <tr>
                  <th className="p-4 text-muted-foreground font-medium">Date</th>
                  <th className="p-4 text-muted-foreground font-medium">Type</th>
                  <th className="p-4 text-muted-foreground font-medium">From → To</th>
                  <th className="p-4 text-muted-foreground font-medium text-right">Amount</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((tx) => {
                  const amount = signed(tx);
                  return (
                    <tr key={tx.transactionId} className="border-b border-border hover:bg-muted/50 transition-colors">
                      <td className="p-4 text-muted-foreground text-xs whitespace-nowrap">{new Date(tx.createdAt).toLocaleString('en-IN')}</td>
                      <td className="p-4 whitespace-nowrap"><span className="badge badge-outline">{TX_LABELS[tx.type] || tx.type}</span></td>
                      <td className="p-4 text-xs whitespace-nowrap">
                        {tx.from === user.id ? 'You' : tx.fromName}
                        <span className="text-muted-foreground mx-1">→</span>
                        {tx.to === user.id ? 'You' : tx.toName}
                      </td>
                      <td className={`p-4 text-right font-semibold whitespace-nowrap ${amount.tone}`}>{amount.text}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};

export default TransactionHistory;
