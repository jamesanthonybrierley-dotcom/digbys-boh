import { forwardRef } from "react";
import type { InputHTMLAttributes, SelectHTMLAttributes, TextareaHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";

interface FieldWrapperProps {
  label?: string;
  error?: string;
  hint?: string;
  htmlFor?: string;
  required?: boolean;
}

function FieldShell({
  label,
  error,
  hint,
  htmlFor,
  required,
  children,
}: FieldWrapperProps & { children: ReactNode }) {
  return (
    <div>
      {label && (
        <label htmlFor={htmlFor} className="mb-1.5 block text-sm font-medium text-ink-700">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}
      {children}
      {hint && !error && <p className="mt-1 text-xs text-ink-400">{hint}</p>}
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}

type InputProps = InputHTMLAttributes<HTMLInputElement> & FieldWrapperProps;

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { label, error, hint, required, className, id, ...props },
  ref
) {
  return (
    <FieldShell label={label} error={error} hint={hint} htmlFor={id} required={required}>
      <input
        ref={ref}
        id={id}
        className={cn(
          "focus-ring w-full rounded-lg border px-3 py-2.5 text-sm text-ink-900 placeholder:text-ink-300",
          error ? "border-red-300" : "border-ink-200",
          className
        )}
        {...props}
      />
    </FieldShell>
  );
});

type SelectProps = SelectHTMLAttributes<HTMLSelectElement> & FieldWrapperProps;

export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { label, error, hint, required, className, id, children, ...props },
  ref
) {
  return (
    <FieldShell label={label} error={error} hint={hint} htmlFor={id} required={required}>
      <select
        ref={ref}
        id={id}
        className={cn(
          "focus-ring w-full rounded-lg border bg-white px-3 py-2.5 text-sm text-ink-900",
          error ? "border-red-300" : "border-ink-200",
          className
        )}
        {...props}
      >
        {children}
      </select>
    </FieldShell>
  );
});

type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & FieldWrapperProps;

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  { label, error, hint, required, className, id, ...props },
  ref
) {
  return (
    <FieldShell label={label} error={error} hint={hint} htmlFor={id} required={required}>
      <textarea
        ref={ref}
        id={id}
        className={cn(
          "focus-ring w-full rounded-lg border px-3 py-2.5 text-sm text-ink-900 placeholder:text-ink-300",
          error ? "border-red-300" : "border-ink-200",
          className
        )}
        {...props}
      />
    </FieldShell>
  );
});
