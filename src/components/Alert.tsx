import { AlertTriangle, Info, CheckCircle } from "lucide-react";
import type { LucideIcon } from "lucide-react";

type AlertVariant = "info" | "success" | "warning" | "error";

interface AlertProps {
  variant: AlertVariant;
  children: React.ReactNode;
}

/**
 * Variant configuration mapping for Alert component
 * Defines icon and styling for each alert type
 */
const variantConfig: Record<
  AlertVariant,
  { icon: LucideIcon; styles: string }
> = {
  info: {
    icon: Info,
    styles: "text-blue-100 bg-blue-900",
  },
  success: {
    icon: CheckCircle,
    styles: "text-green-100 bg-green-900",
  },
  warning: {
    icon: AlertTriangle,
    styles: "text-yellow-100 bg-yellow-900",
  },
  error: {
    icon: AlertTriangle,
    styles: "text-red-100 bg-red-900",
  },
};

/**
 * Alert component for displaying contextual messages
 * 
 * @param variant - Visual style variant (info, success, warning, error)
 * @param children - Alert message content
 * 
 * @example
 * <Alert variant="error">Something went wrong</Alert>
 */
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




