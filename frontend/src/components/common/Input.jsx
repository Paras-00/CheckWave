import React from 'react';

const Input = ({
  label,
  error,
  helperText,
  icon: Icon,
  id,
  className = '',
  wrapperClassName = '',
  required = false,
  ...props
}) => {
  const inputId = id || props.name || Math.random().toString(36).substring(2, 9);

  return (
    <div className={`w-full ${wrapperClassName}`}>
      {label && (
        <label htmlFor={inputId} className="block text-sm font-medium text-slate-300 mb-1.5">
          {label}
          {required && <span className="text-red-400 ml-1">*</span>}
        </label>
      )}
      <div className="relative">
        {Icon && (
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
            <Icon className="w-4 h-4" />
          </div>
        )}
        <input
          id={inputId}
          required={required}
          className={`w-full bg-navy-800 border ${
            error ? 'border-red-500/80 focus:border-red-500 focus:ring-red-500/40' : 'border-navy-500 focus:border-blue-500 focus:ring-blue-500/40'
          } text-slate-200 placeholder-slate-500 rounded-lg ${
            Icon ? 'pl-10 pr-4' : 'px-4'
          } py-2.5 text-sm focus:outline-none focus:ring-2 transition-all duration-200 disabled:opacity-50 disabled:bg-navy-900 ${className}`}
          {...props}
        />
      </div>
      {error && <p className="mt-1.5 text-xs text-red-400 font-medium">{error}</p>}
      {!error && helperText && <p className="mt-1.5 text-xs text-slate-400">{helperText}</p>}
    </div>
  );
};

export default Input;
