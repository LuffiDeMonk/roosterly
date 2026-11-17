import { type ComponentPropsWithoutRef, type ReactNode } from "react";
import {
  Avatar as BaseAvatar,
  AvatarImage,
  AvatarFallback,
} from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

export interface AvatarProps extends ComponentPropsWithoutRef<typeof BaseAvatar> {
  name?: string | null;
  imageUrl?: string | null;
  src?: string | null;
  alt?: string;
  fallback?: ReactNode;
  fallbackClassName?: string;
  size?: "sm" | "default" | "lg" | "xl";
}

export function getInitials(name?: string | null): string {
  if (!name || typeof name !== "string") return "";
  const trimmed = name.trim();
  if (!trimmed) return "";

  const words = trimmed.split(/\s+/).filter(Boolean);
  if (words.length === 0) return "";

  if (words.length === 1) {
    return words[0].slice(0, Math.min(2, words[0].length)).toUpperCase();
  }

  const firstInitial = words[0][0] || "";
  const lastInitial = words[words.length - 1][0] || "";
  return `${firstInitial}${lastInitial}`.toUpperCase();
}

export function Avatar({
  name,
  imageUrl,
  src,
  alt,
  fallback,
  fallbackClassName,
  className,
  size = "default",
  children,
  ...props
}: AvatarProps) {
  const effectiveSrc = imageUrl ?? src;
  const initials = getInitials(name);

  const sizeClasses = {
    sm: "size-8 text-xs",
    default: "size-10 text-sm",
    lg: "size-12 text-base",
    xl: "size-16 text-xl",
  };

  if (children) {
    return (
      <BaseAvatar className={cn(sizeClasses[size], className)} {...props}>
        {children}
      </BaseAvatar>
    );
  }

  return (
    <BaseAvatar className={cn(sizeClasses[size], className)} {...props}>
      {effectiveSrc && (
        <AvatarImage src={effectiveSrc} alt={alt || name || "Avatar"} />
      )}
      <AvatarFallback className={cn("bg-muted text-muted-foreground font-medium", fallbackClassName)}>
        {fallback || initials || "?"}
      </AvatarFallback>
    </BaseAvatar>
  );
}
