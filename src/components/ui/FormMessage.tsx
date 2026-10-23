import type { ReactNode } from "react";

interface FormMessageProps {
  tone: "error" | "success" | "info";
  children: ReactNode;
}

const toneStyles: Record<FormMessageProps["tone"], string> = {
  error: "border-red-500/60 bg-red-950/60 text-red-100",
  success: "border-green-500/60 bg-green-950/60 text-green-100",
  info: "border-slate-500/60 bg-slate-900 text-gray-200",
};

/** Inline status for forms; errors are announced immediately */
export function FormMessage({ tone, children }: FormMessageProps) {
  return (
    <div
      role={tone === "error" ? "alert" : "status"}
      className={`rounded-md border px-3 py-2.5 text-sm ${toneStyles[tone]}`}
    >
      {children}
    </div>
  );
}
