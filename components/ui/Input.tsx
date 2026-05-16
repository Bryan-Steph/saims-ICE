'use client'

import { forwardRef, type InputHTMLAttributes, type TextareaHTMLAttributes } from 'react'

/* ── Text Input ─────────────────────────────────────────── */

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  hint?:  string
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, hint, className = '', id, ...props }, ref) => {
    const fieldId = id ?? label?.toLowerCase().replace(/\s+/g, '-')

    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label htmlFor={fieldId} className="text-sm font-medium text-[var(--color-tx)]">
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={fieldId}
          className={['field', error ? 'field-error' : '', className].filter(Boolean).join(' ')}
          {...props}
        />
        {error  && <p className="text-xs text-[var(--color-danger)]">{error}</p>}
        {!error && hint && <p className="text-xs text-[var(--color-muted)]">{hint}</p>}
      </div>
    )
  }
)
Input.displayName = 'Input'


/* ── Textarea ───────────────────────────────────────────── */

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  error?: string
  hint?:  string
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, hint, className = '', id, ...props }, ref) => {
    const fieldId = id ?? label?.toLowerCase().replace(/\s+/g, '-')

    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label htmlFor={fieldId} className="text-sm font-medium text-[var(--color-tx)]">
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          id={fieldId}
          className={['field field-textarea', error ? 'field-error' : '', className].filter(Boolean).join(' ')}
          {...props}
        />
        {error  && <p className="text-xs text-[var(--color-danger)]">{error}</p>}
        {!error && hint && <p className="text-xs text-[var(--color-muted)]">{hint}</p>}
      </div>
    )
  }
)
Textarea.displayName = 'Textarea'