import { type ReactNode, forwardRef } from "react";
import { AlertCircle, AlertTriangle, CheckCircle2, Info, X } from "lucide-react";
import {
  Alert as BaseAlert,
  AlertDescription,
  AlertTitle,
  type AlertProps as BaseAlertProps,
} from "@/components/ui/alert";
import { cn } from "@/lib/utils";

export interface AlertProps extends BaseAlertProps {
  title?: string;
  description?: string;
  icon?: ReactNode;
  onClose?: () => void;
  dismissible?: boolean;
}

const defaultIcons: Record<string, ReactNode> = {
  default: null,
  destructive: <AlertCircle className="size-4 shrink-0 text-red-500" aria-hidden="true" />,
  success: <CheckCircle2 className="size-4 shrink-0 text-emerald-500" aria-hidden="true" />,
  warning: <AlertTriangle className="size-4 shrink-0 text-amber-500" aria-hidden="true" />,
  info: <Info className="size-4 shrink-0 text-blue-500" aria-hidden="true" />,
};

export const Alert = forwardRef<HTMLDivElement, AlertProps>(
  (
    {
      className,
      variant = "default",
      title,
      description,
      icon,
      onClose,
      dismissible = false,
      children,
      ...props
    },
    ref
  ) => {
    const selectedIcon = icon !== undefined ? icon : defaultIcons[variant ?? "default"];

    return (
      <BaseAlert ref={ref} variant={variant} className={cn("relative pr-10", className)} {...props}>
        {selectedIcon}
        <div className="flex-1 space-y-0.5">
          {title && <AlertTitle>{title}</AlertTitle>}
          {description && <AlertDescription>{description}</AlertDescription>}
          {children}
        </div>
        {(dismissible || onClose) && (
          <button
            type="button"
            onClick={onClose}
            className="absolute right-3 top-3 rounded-full p-1 text-muted-foreground opacity-60 transition-opacity hover:opacity-100 hover:bg-black/5 dark:hover:bg-white/10"
            aria-label="Dismiss alert"
          >
            <X className="size-3.5" />
          </button>
        )}
      </BaseAlert>
    );
  }
);
Alert.displayName = "Alert";
