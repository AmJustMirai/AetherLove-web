// Labelled text field / textarea, port of the plugin's UI/Fields helpers. Carries an optional label,
// char counter, and inline error (UiColors.Danger). NSFW-flagged controls get the red frame variant.

import type { TextareaHTMLAttributes } from 'react';
import { cn } from '../cn';

interface FieldProps {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  multiline?: boolean;
  rows?: number;
  maxLength?: number;
  error?: string | null;
  type?: 'text' | 'password';
  nsfw?: boolean;
  autoFocus?: boolean;
}

export function TextInput({
  label,
  value,
  onChange,
  placeholder,
  multiline = false,
  rows = 3,
  maxLength,
  error,
  type = 'text',
  nsfw = false,
  autoFocus,
}: FieldProps) {
  const base = cn(
    'w-full rounded-xl border bg-void/30 px-3 py-2 text-[15px] text-body outline-none transition-colors',
    'placeholder:text-muted focus:border-accent',
    nsfw ? 'border-danger/70 bg-[rgb(140_26_26/0.35)]' : 'border-line/10',
    error && 'border-danger'
  );

  const common = {
    value,
    placeholder,
    maxLength,
    autoFocus,
    onChange: (e: { target: { value: string } }) => onChange(e.target.value),
  };

  return (
    <label className="block">
      {label && <span className="mb-1 block text-[13px] font-medium text-subtle">{label}</span>}
      {multiline ? (
        <textarea
          {...(common as TextareaHTMLAttributes<HTMLTextAreaElement>)}
          rows={rows}
          className={cn(base, 'resize-none')}
        />
      ) : (
        <input {...common} type={type} className={base} />
      )}
      <span className="mt-1 flex justify-between text-[11px]">
        {error ? <span className="text-danger">{error}</span> : <span />}
        {maxLength != null && (
          <span
            className={cn('font-mono', value.length > maxLength ? 'text-danger' : 'text-muted')}
          >
            {value.length}/{maxLength}
          </span>
        )}
      </span>
    </label>
  );
}
