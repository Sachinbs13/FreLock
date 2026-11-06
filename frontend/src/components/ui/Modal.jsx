import React, { useEffect } from 'react';

// Accessible overlay dialog: closes on Escape or backdrop click.
const Modal = ({ open, onClose, title, children }) => {
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-end sm:items-center justify-center p-4 z-50 animate-fade-in"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <div role="dialog" aria-modal="true" aria-label={title} className="card p-6 w-full max-w-md space-y-4 animate-scale-in shadow-xl">
        {title && <h3 className="font-semibold">{title}</h3>}
        {children}
      </div>
    </div>
  );
};

export default Modal;
