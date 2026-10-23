import { forwardRef, useId, type InputHTMLAttributes, type ReactNode } from "react";

export const inputClassName =
  "w-full rounded-md bg-slate-900 text-white text-base px-3 py-2.5 border border-slate-600 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-60";

interface TextFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  hint?: ReactNode;
  /** Rendered to the right of the input (e.g. a visibility toggle) */
  trailing?: ReactNode;
}

/** Labeled text input matching the app's dark form style */
export const TextField = forwardRef<HTMLInputElement, TextFieldProps>(
  ({ label, hint, trailing, id, className = "", ...props }, ref) => {
    const generatedId = useId();
    const inputId = id ?? generatedId;
    const hintId = hint ? `${inputId}-hint` : undefined;
    return (
      <div className="flex flex-col gap-1.5">
        <label htmlFor={inputId} className="text-sm font-medium text-gray-200">
          {label}
        </label>
        <div className="relative">
          <input
            ref={ref}
            id={inputId}
            aria-describedby={hintId}
            className={`${inputClassName} ${trailing ? "pr-12" : ""} ${className}`}
            {...props}
          />
          {trailing && (
            <div className="absolute inset-y-0 right-0 flex items-center pr-1">{trailing}</div>
          )}
        </div>
        {hint && (
          <p id={hintId} className="text-sm text-gray-400">
            {hint}
          </p>
        )}
      </div>
    );
  }
);

TextField.displayName = "TextField";
