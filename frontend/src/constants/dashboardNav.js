import {
  LayoutDashboard,
  Briefcase,
  PlusCircle,
  Shield,
  Activity,
  MessageSquare,
  Search,
  Heart,
} from 'lucide-react';
import { ROLES } from './roles';

// Single source of truth for dashboard navigation (was copy-pasted into 5 pages).
export const CLIENT_NAV = [
  { label: 'Overview', path: '/dashboard', icon: LayoutDashboard },
  { label: 'Post Job', path: '/jobs/create', icon: PlusCircle },
  { label: 'My Jobs', path: '/jobs/my', icon: Briefcase },
  { label: 'Escrow', path: '/escrow', icon: Shield },
  { label: 'Messages', path: '/messages', icon: MessageSquare },
  { label: 'History', path: '/history', icon: Activity },
];

export const FREELANCER_NAV = [
  { label: 'Overview', path: '/dashboard', icon: LayoutDashboard },
  { label: 'Find Jobs', path: '/jobs', icon: Search },
  { label: 'Applications', path: '/jobs/applied', icon: Briefcase },
  { label: 'Wishlist', path: '/jobs?tab=wishlist', icon: Heart },
  { label: 'Escrow', path: '/escrow', icon: Shield },
  { label: 'Messages', path: '/messages', icon: MessageSquare },
  { label: 'History', path: '/history', icon: Activity },
];

export const getDashboardNav = (role) => (role === ROLES.FREELANCER ? FREELANCER_NAV : CLIENT_NAV);
