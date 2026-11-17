import {
  type ComponentProps,
  type ButtonHTMLAttributes,
  type AnchorHTMLAttributes,
  type MouseEventHandler,
} from "react";
import { ChevronLeft, ChevronRight, MoreHorizontal } from "lucide-react";
import { Button, type ButtonProps } from "@/components/ui/button";
import { cn } from "@/lib/utils";

function Pagination({ className, ...props }: ComponentProps<"nav">) {
  return (
    <nav
      role="navigation"
      aria-label="pagination"
      data-slot="pagination"
      className={cn("mx-auto flex w-full justify-center select-none", className)}
      {...props}
    />
  );
}

function PaginationContent({
  className,
  ...props
}: ComponentProps<"ul">) {
  return (
    <ul
      data-slot="pagination-content"
      className={cn("flex items-center gap-1", className)}
      {...props}
    />
  );
}

function PaginationItem({ ...props }: ComponentProps<"li">) {
  return <li data-slot="pagination-item" {...props} />;
}

export type PaginationLinkProps = {
  isActive?: boolean;
  size?: ButtonProps["size"];
  href?: string;
  disabled?: boolean;
} & Omit<ButtonHTMLAttributes<HTMLButtonElement>, "size"> &
  Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "size" | "onClick"> & {
    onClick?: MouseEventHandler<HTMLElement>;
  };

function PaginationLink({
  className,
  isActive,
  size = "icon",
  href,
  disabled,
  onClick,
  children,
  ...props
}: PaginationLinkProps) {
  if (href) {
    return (
      <Button
        asChild
        variant={isActive ? "default" : "ghost"}
        size={size}
        className={cn(
          "rounded-lg font-medium transition-colors",
          isActive
            ? "bg-primary text-primary-foreground hover:bg-primary/90 shadow-xs"
            : "text-foreground hover:bg-muted",
          className
        )}
      >
        <a
          href={href}
          aria-current={isActive ? "page" : undefined}
          aria-disabled={disabled ? "true" : undefined}
          data-slot="pagination-link"
          data-active={isActive}
          onClick={onClick}
          {...(props as AnchorHTMLAttributes<HTMLAnchorElement>)}
        >
          {children}
        </a>
      </Button>
    );
  }

  return (
    <Button
      variant={isActive ? "default" : "ghost"}
      size={size}
      className={cn(
        "rounded-lg font-medium transition-colors",
        isActive
          ? "bg-primary text-primary-foreground hover:bg-primary/90 shadow-xs"
          : "text-foreground hover:bg-muted",
        className
      )}
      disabled={disabled}
      data-slot="pagination-link"
      data-active={isActive}
      onClick={onClick}
      {...(props as ButtonHTMLAttributes<HTMLButtonElement>)}
    >
      {children}
    </Button>
  );
}

function PaginationPrevious({
  className,
  text = "Previous",
  ...props
}: ComponentProps<typeof PaginationLink> & { text?: string }) {
  return (
    <PaginationLink
      aria-label="Go to previous page"
      size="default"
      className={cn("px-2.5 gap-1", className)}
      {...props}
    >
      <ChevronLeft className="h-4 w-4" />
      <span className="hidden sm:inline text-sm">{text}</span>
    </PaginationLink>
  );
}

function PaginationNext({
  className,
  text = "Next",
  ...props
}: ComponentProps<typeof PaginationLink> & { text?: string }) {
  return (
    <PaginationLink
      aria-label="Go to next page"
      size="default"
      className={cn("px-2.5 gap-1", className)}
      {...props}
    >
      <span className="hidden sm:inline text-sm">{text}</span>
      <ChevronRight className="h-4 w-4" />
    </PaginationLink>
  );
}

function PaginationEllipsis({
  className,
  ...props
}: ComponentProps<"span">) {
  return (
    <span
      data-slot="pagination-ellipsis"
      className={cn(
        "flex size-9 items-center justify-center text-muted-foreground",
        className
      )}
      {...props}
    >
      <MoreHorizontal className="size-4" />
      <span className="sr-only">More pages</span>
    </span>
  );
}

export {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
};
