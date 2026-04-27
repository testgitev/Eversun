'use client';

import React, { forwardRef, useId } from 'react';
import { cn } from '@/lib/utils';
import type { WithLabelError, WithIcon } from '@/types/common';
import { Calendar } from '@phosphor-icons/react';

interface DatePickerProps extends WithLabelError, WithIcon {
  value?: string | Date | null;
  onChange: (value: string) => void;
  placeholderText?: string;
  minDate?: Date;
  maxDate?: Date;
  name?: string;
  id?: string;
  className?: string;
  disabled?: boolean;
  readOnly?: boolean;
}

const DatePicker = forwardRef<HTMLInputElement, DatePickerProps>(
  (
    {
      className,
      label,
      error,
      helperText,
      id,
      icon,
      name,
      value,
      onChange,
      placeholderText,
      minDate,
      maxDate,
      disabled,
      readOnly,
      ...props
    },
    ref
  ) => {
    const generatedId = useId();
    const inputId = id || generatedId;

    const formatDateForInput = (val: string | Date | null | undefined): string => {
      if (!val) return '';
      if (val instanceof Date) {
        return val.toISOString().split('T')[0];
      }
      return val;
    };

    const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = e.target.value;
      onChange(val);
    };

    return (
      <div className="space-y-2">
        {label && (
          <label
            htmlFor={inputId}
            className="text-sm font-semibold text-slate-700 dark:text-slate-300"
          >
            {label}
          </label>
        )}
        <div className="relative group">
          <div className="absolute left-4 top-1/2 transform -translate-y-1/2 pointer-events-none text-gray-400 dark:text-gray-500">
            <Calendar className="h-5 w-5" weight="bold" />
          </div>
          <input
            type="date"
            id={inputId}
            name={name}
            value={formatDateForInput(value)}
            onChange={handleDateChange}
            min={minDate ? minDate.toISOString().split('T')[0] : undefined}
            max={maxDate ? maxDate.toISOString().split('T')[0] : undefined}
            disabled={disabled}
            readOnly={readOnly}
            ref={ref}
            className={cn(
              'flex h-12 w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-3 text-sm text-slate-900 dark:text-white pl-12 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 focus-visible:border-cyan-500 disabled:cursor-not-allowed disabled:opacity-50 transition-all duration-200 shadow-sm hover:shadow-md',
              error && 'border-red-500 focus-visible:ring-red-500 focus-visible:border-red-500',
              className
            )}
            aria-describedby={
              error
                ? `${inputId}-error`
                : helperText
                  ? `${inputId}-helper`
                  : undefined
            }
            aria-invalid={error ? 'true' : undefined}
            {...props}
          />
        </div>
        {error && (
          <p
            id={`${inputId}-error`}
            className="text-sm text-red-600 dark:text-red-400 font-medium"
            role="alert"
          >
            {error}
          </p>
        )}
        {helperText && !error && (
          <p
            id={`${inputId}-helper`}
            className="text-sm text-slate-500 dark:text-slate-400"
          >
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

DatePicker.displayName = 'DatePicker';

export default DatePicker;
