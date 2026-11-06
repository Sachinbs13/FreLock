import React from 'react';
import { X } from 'lucide-react';

const STYLES = {
  info: 'bg-muted border-border text-foreground',
  success: 'bg-emerald-50 border-emerald-200 text-emerald-800 dark:bg-emerald-950/40 dark:border-emerald-800/60 dark:text-emerald-300',
  error: 'bg-destructive/10 border-destructive/30 text-destructive',
};

const Alert = ({ type = 'info', children, onClose, className = '' }) => {
  if (!children) return null;
  return (
    <div role={type === 'error' ? 'alert' : 'status'} className={`flex items-start gap-2 border p-3 rounded-md text-sm ${STYLES[type]} ${className}`}>
      <div className="flex-1">{children}</div>
      {onClose && (
        <button type="button" onClick={onClose} className="shrink-0 opacity-60 hover:opacity-100" aria-label="Dismiss">
          <X size={14} />
        </button>
      )}
    </div>
  );
};

export default Alert;
