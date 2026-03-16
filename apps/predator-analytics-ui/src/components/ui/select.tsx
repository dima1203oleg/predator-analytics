import React from 'react';

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  children: React.ReactNode;
}

export function Select({ children, className = '', ...props }: SelectProps) {
  return (
    <select
      className={`bg-slate-950/70 border border-slate-700/70 text-slate-100 rounded px-3 py-2 focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/30 ${className}`}
      {...props}
    >
      {children}
    </select>
  );
}

interface SelectItemProps extends React.OptionHTMLAttributes<HTMLOptionElement> {
  children: React.ReactNode;
}

export function SelectItem({ children, ...props }: SelectItemProps) {
  return <option {...props}>{children}</option>;
}
