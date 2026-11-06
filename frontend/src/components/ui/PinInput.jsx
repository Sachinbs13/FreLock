import React from 'react';

// 4-digit numeric PIN field (numeric keypad on mobile, digits only).
const PinInput = ({ value, onChange, placeholder = 'Wallet PIN', autoFocus = false, id }) => (
  <input
    id={id}
    type="password"
    inputMode="numeric"
    autoComplete="off"
    pattern="\d{4}"
    maxLength={4}
    required
    autoFocus={autoFocus}
    placeholder={placeholder}
    value={value}
    onChange={(e) => onChange(e.target.value.replace(/\D/g, '').slice(0, 4))}
    className="input-field tracking-[0.5em]"
    title="4-digit PIN"
  />
);

export default PinInput;
