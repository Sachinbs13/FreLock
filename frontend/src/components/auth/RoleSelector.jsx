import React from 'react';

const RoleSelector = ({ roles, value, onChange, name = 'role' }) => (
  <div className="space-y-2">
    <label className="block text-sm font-medium text-foreground">I am a</label>
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
      {roles.map(({ value: roleValue, label, description }) => (
        <label
          key={roleValue}
          className={`relative flex flex-col p-3 rounded-lg border cursor-pointer transition-all ${
            value === roleValue
              ? 'border-primary bg-primary/5 ring-1 ring-primary'
              : 'border-border hover:bg-muted/50'
          }`}
        >
          <input
            type="radio"
            name={name}
            value={roleValue}
            checked={value === roleValue}
            onChange={() => onChange(roleValue)}
            className="sr-only"
          />
          <span className="text-sm font-medium text-foreground">{label}</span>
          <span className="text-xs text-muted-foreground mt-0.5">{description}</span>
        </label>
      ))}
    </div>
  </div>
);

export default RoleSelector;
