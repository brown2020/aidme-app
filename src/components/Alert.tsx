import { AlertTriangle } from "lucide-react";

type AlertVariant = "warning" | "error";

interface AlertProps {
  variant: AlertVariant;
  children: React.ReactNode;
}

const variantStyles: Record<AlertVariant, string> = {
  warning:
    "text-yellow-500 bg-yellow-100 dark:bg-yellow-900 dark:text-yellow-100",
  error: "text-red-500 bg-red-100 dark:bg-red-900 dark:text-red-100",
};

export default function Alert({ variant, children }: AlertProps) {
  return (
    <div
      className={`p-4 text-sm rounded-lg flex items-start gap-2 ${variantStyles[variant]}`}
      role="alert"
    >
      <AlertTriangle className="shrink-0 mt-0.5" size={18} />
      <div>{children}</div>
    </div>
  );
}
