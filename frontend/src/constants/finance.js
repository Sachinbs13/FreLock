export const CURRENCY = 'INR';
export const CURRENCY_SYMBOL = '₹';

export const formatINR = (amount) =>
  `${CURRENCY_SYMBOL}${Number(amount || 0).toLocaleString('en-IN')}`;

export const PRIVACY_LEVELS = [
  { value: 'PUBLIC', label: 'Public', description: 'Visible to all freelancers' },
  { value: 'PRIVATE', label: 'Private', description: 'Only invited freelancers can view' },
  { value: 'CONFIDENTIAL', label: 'Confidential', description: 'NDA required, limited access' },
];

export const FINANCE_STEPS = [
  { step: 1, title: 'Create Wallet', description: 'Set up your INR wallet with a secure PIN' },
  { step: 2, title: 'Add Funds', description: 'Top up via UPI / card simulation with PIN' },
  { step: 3, title: 'Fund Escrow', description: 'Lock project payment until work is approved' },
  { step: 4, title: 'Release Payment', description: 'Freelancer receives ₹ on approval' },
];

export const TX_LABELS = {
  ESCROW_FUND: 'Escrow funded',
  PAYMENT_RELEASE: 'Payment released',
  REFUND: 'Escrow refund',
  DISPUTE_CREATED: 'Dispute raised',
  ADMIN_ADJUSTMENT: 'Admin adjustment',
  WALLET_TOPUP_UPI: 'Top-up · UPI',
  WALLET_TOPUP_CARD: 'Top-up · Card',
  WALLET_TOPUP_NETBANKING: 'Top-up · Net banking',
};
