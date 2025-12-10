import { AlertTriangle, Info, CheckCircle } from "lucide-react";
import type { LucideIcon } from "lucide-react";

type AlertVariant = "info" | "success" | "warning" | "error";

interface AlertProps {
  variant: AlertVariant;
  children: React.ReactNode;
}

const variantConfig: Record<
  AlertVariant,
  { icon: LucideIcon; styles: string }
> = {
  info: {
    icon: Info,
    styles: "text-blue-500 bg-blue-100 dark:bg-blue-900 dark:text-blue-100",
  },
  success: {
    icon: CheckCircle,
    styles: "text-green-500 bg-green-100 dark:bg-green-900 dark:text-green-100",
  },
  warning: {
    icon: AlertTriangle,
    styles:
      "text-yellow-500 bg-yellow-100 dark:bg-yellow-900 dark:text-yellow-100",
  },
  error: {
    icon: AlertTriangle,
    styles: "text-red-500 bg-red-100 dark:bg-red-900 dark:text-red-100",
  },
};

export default function Alert({ variant, children }: AlertProps) {
  const { icon: Icon, styles } = variantConfig[variant];

  return (
    <div
      className={`p-4 text-sm rounded-lg flex items-start gap-2 ${styles}`}
      role="alert"
    >
      <Icon className="shrink-0 mt-0.5" size={18} />
      <div>{children}</div>
    </div>
  );
}
