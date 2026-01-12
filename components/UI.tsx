import React from 'react';
import { LucideIcon } from 'lucide-react';

// --- Card Components ---
export const Card: React.FC<{ children: React.ReactNode; className?: string; onClick?: () => void }> = ({ children, className = '', onClick }) => (
  <div 
    onClick={onClick}
    className={`bg-stone-900 rounded-lg border border-stone-800 p-6 shadow-md ${onClick ? 'cursor-pointer hover:border-stone-600 transition-colors duration-300' : ''} ${className}`}
  >
    {children}
  </div>
);

// --- Button Components ---
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'contrast';
  size?: 'sm' | 'md';
  icon?: LucideIcon;
}

export const Button: React.FC<ButtonProps> = ({ variant = 'primary', size = 'md', icon: Icon, children, className = '', ...props }) => {
  const baseStyles = "inline-flex items-center justify-center gap-2 rounded font-mono font-bold tracking-tight transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-stone-950 disabled:opacity-50 disabled:cursor-not-allowed uppercase";
  
  const sizeStyles = {
    sm: "px-3 py-1.5 text-xs",
    md: "px-6 py-3 text-sm"
  };

  const variants = {
    primary: "bg-stone-800 text-stone-200 hover:bg-stone-700 hover:text-white border border-stone-700 focus:ring-stone-600",
    contrast: "bg-stone-200 text-stone-950 hover:bg-white hover:scale-[1.02] shadow-lg shadow-stone-900/50",
    secondary: "bg-transparent border border-stone-700 text-stone-400 hover:border-stone-500 hover:text-stone-200 focus:ring-stone-600",
    danger: "bg-red-950/30 text-red-400 border border-red-900/50 hover:bg-red-900/50 focus:ring-red-900",
    ghost: "bg-transparent hover:bg-stone-900 text-stone-500 hover:text-stone-300 focus:ring-stone-700",
  };

  return (
    <button className={`${baseStyles} ${sizeStyles[size]} ${variants[variant]} ${className}`} {...props}>
      {Icon && <Icon size={size === 'sm' ? 14 : 16} />}
      {children}
    </button>
  );
};

// --- Input Components ---
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
}

export const Input: React.FC<InputProps> = ({ label, className = '', ...props }) => (
  <div className="flex flex-col gap-2 w-full">
    {label && <label className="text-[10px] font-bold text-stone-500 uppercase tracking-widest">{label}</label>}
    <input 
      className={`bg-stone-950 border border-stone-800 rounded px-4 py-3 text-stone-200 placeholder-stone-700 focus:outline-none focus:border-stone-500 focus:ring-1 focus:ring-stone-500 transition-colors font-mono ${className}`}
      {...props}
    />
  </div>
);

// --- Layout ---
export const SectionHeader: React.FC<{ title: string; subtitle?: string; action?: React.ReactNode }> = ({ title, subtitle, action }) => (
  <div className="flex items-end justify-between mb-8 border-b border-stone-800/50 pb-4">
    <div>
      <h2 className="text-xl font-bold text-white tracking-widest uppercase font-mono">{title}</h2>
      {subtitle && <p className="text-stone-500 text-xs mt-2 font-medium tracking-wide">{subtitle}</p>}
    </div>
    {action}
  </div>
);