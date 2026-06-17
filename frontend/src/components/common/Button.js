import React from 'react';

const Button = ({
  children,
  variant = 'primary',
  size = 'md',
  className = '',
  icon: Icon,
  isLoading,
  ...props
}) => {
  const baseStyles = 'inline-flex items-center justify-center font-medium transition-all duration-150 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';

  const variants = {
    primary: 'bg-primary-600 text-white hover:bg-primary-700 focus:ring-primary-500 shadow-sm border border-transparent',
    secondary: 'bg-white text-neutral-800 border border-neutral-200 hover:bg-neutral-50 focus:ring-neutral-200 shadow-sm',
    danger: 'bg-danger-500 text-white hover:bg-danger-700 focus:ring-danger-500 shadow-sm border border-transparent',
    ghost: 'bg-transparent text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900 border border-transparent',
    success: 'bg-success-500 text-white hover:bg-success-700 focus:ring-success-500 shadow-sm border border-transparent',
  };

  const sizes = {
    xs: 'px-2 py-1 text-[10px]',
    sm: 'px-3 py-1.5 text-xs',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base',
  };

  return (
    <button
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
      disabled={isLoading}
      {...props}
    >
      {isLoading ? (
        <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2"></span>
      ) : Icon ? (
        <Icon size={size === 'xs' ? 12 : size === 'sm' ? 16 : 18} className="mr-2" />
      ) : null}
      {children}
    </button>
  );
};

export default Button;
