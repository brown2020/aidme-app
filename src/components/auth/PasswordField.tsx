"use client";

import { useState, type InputHTMLAttributes, type ReactNode } from "react";
import { Eye, EyeOff } from "lucide-react";
import { TextField } from "../ui/TextField";

interface PasswordFieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "type"> {
  label: string;
  hint?: ReactNode;
}

/** Password input, hidden by default, with an accessible show/hide toggle */
export function PasswordField({ label, ...props }: PasswordFieldProps) {
  const [isVisible, setIsVisible] = useState(false);
  return (
    <TextField
      label={label}
      type={isVisible ? "text" : "password"}
      autoCapitalize="none"
      autoCorrect="off"
      spellCheck={false}
      {...props}
      trailing={
        <button
          type="button"
          onClick={() => setIsVisible((v) => !v)}
          aria-label={isVisible ? `Hide ${label.toLowerCase()}` : `Show ${label.toLowerCase()}`}
          aria-pressed={isVisible}
          className="flex h-10 w-10 items-center justify-center rounded-md text-gray-300 hover:text-white hover:bg-slate-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
        >
          {isVisible ? <EyeOff size={20} aria-hidden /> : <Eye size={20} aria-hidden />}
        </button>
      }
    />
  );
}
