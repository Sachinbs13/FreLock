export const ROLES = {
  ADMIN: 'Admin',
  CLIENT: 'Client',
  FREELANCER: 'Freelancer',
};

export const LOGIN_ROLES = [
  { value: ROLES.ADMIN, label: 'Admin', description: 'Manage clients & freelancers' },
  { value: ROLES.CLIENT, label: 'Client', description: 'Post jobs & fund escrow' },
  { value: ROLES.FREELANCER, label: 'Freelancer', description: 'Accept jobs & get paid' },
];

export const REGISTER_ROLES = LOGIN_ROLES.filter((r) => r.value !== ROLES.ADMIN);

export const DEMO_CREDENTIALS = [
  { role: ROLES.ADMIN, email: 'admin@escrow.com', password: 'Admin@FintechEL2026' },
  { role: ROLES.CLIENT, email: 'client@escrow.com', password: 'client123' },
  { role: ROLES.FREELANCER, email: 'freelancer@escrow.com', password: 'freelancer123' },
];

export const getDashboardPath = (role) => (role === ROLES.ADMIN ? '/admin' : '/dashboard');

