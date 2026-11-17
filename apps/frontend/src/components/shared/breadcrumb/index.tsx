import {
  type ComponentPropsWithoutRef,
  type MouseEvent,
  type ReactNode,
  Fragment,
} from "react";
import { ChevronRight } from "lucide-react";
import {
  Breadcrumb as BaseBreadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { cn } from "@/lib/utils";

export interface BreadcrumbItemType {
  label: ReactNode;
  href?: string;
  onClick?: (event: MouseEvent<HTMLElement>) => void;
  icon?: ReactNode;
  isCurrentPage?: boolean;
  className?: string;
}

export interface BreadcrumbProps
  extends Omit<ComponentPropsWithoutRef<"nav">, "children"> {
  items: BreadcrumbItemType[];
  separator?: ReactNode;
}

export function Breadcrumb({
  items,
  separator = <ChevronRight className="size-3.5 text-muted-foreground/50" />,
  className,
  ...props
}: BreadcrumbProps) {
  if (!items || items.length === 0) return null;

  return (
    <BaseBreadcrumb className={cn("text-sm", className)} {...props}>
      <BreadcrumbList>
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          const isCurrent = item.isCurrentPage ?? isLast;

          return (
            <Fragment key={index}>
              <BreadcrumbItem className={item.className}>
                {isCurrent ? (
                  <BreadcrumbPage className="flex items-center gap-1.5 font-medium text-foreground">
                    {item.icon && <span className="shrink-0">{item.icon}</span>}
                    {item.label}
                  </BreadcrumbPage>
                ) : (
                  <BreadcrumbLink
                    href={item.href}
                    onClick={item.onClick}
                    className="flex items-center gap-1.5 text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {item.icon && <span className="shrink-0">{item.icon}</span>}
                    {item.label}
                  </BreadcrumbLink>
                )}
              </BreadcrumbItem>
              {!isLast && <BreadcrumbSeparator>{separator}</BreadcrumbSeparator>}
            </Fragment>
          );
        })}
      </BreadcrumbList>
    </BaseBreadcrumb>
  );
}
