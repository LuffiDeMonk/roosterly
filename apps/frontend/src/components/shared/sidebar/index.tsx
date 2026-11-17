import {
  isValidElement,
  type ReactNode,
  type ComponentType,
  type ComponentProps,
} from "react";
import {
  Sidebar as BaseSidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarProvider,
  SidebarRail,
  SidebarEdgeTrigger,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { LogOut } from "lucide-react";

export interface SidebarNavItem {
  title: string;
  href?: string;
  icon?: ComponentType<{ className?: string }> | ReactNode;
  badge?: ReactNode;
  isActive?: boolean;
  disabled?: boolean;
  onClick?: () => void;
  items?: {
    title: string;
    href?: string;
    isActive?: boolean;
    onClick?: () => void;
  }[];
}

export interface SidebarNavGroup {
  label?: string;
  items: SidebarNavItem[];
}

export interface SidebarHeaderConfig {
  logo?: ReactNode;
  title?: ReactNode;
  subtitle?: ReactNode;
  children?: ReactNode;
  className?: string;
}

export interface SidebarUserConfig {
  name: string;
  role?: string;
  avatar?: string;
  fallback?: string;
  onLogout?: () => void;
  logoutTooltip?: string;
  isLoggingOut?: boolean;
  children?: ReactNode;
  className?: string;
}

export interface SidebarProps extends ComponentProps<typeof BaseSidebar> {
  header?: SidebarHeaderConfig | ReactNode;
  groups?: SidebarNavGroup[];
  user?: SidebarUserConfig | ReactNode;
  footer?: ReactNode;
  renderLink?: (
    item: SidebarNavItem,
    content: ReactNode
  ) => ReactNode;
  showRail?: boolean;
  /** Whether to render the circular collapse/expand toggle button on the sidebar edge. Defaults to true. */
  showEdgeTrigger?: boolean;
  /** Optional custom class for the edge toggle button. */
  edgeTriggerClassName?: string;
  /** Content rendered inside SidebarInset, i.e. the actual page/app content next to the sidebar. */
  mainContent?: ReactNode;
  /** Optional wrapper class for the SidebarInset element. */
  insetClassName?: string;
  /** Pass-through props for SidebarProvider (e.g. defaultOpen, open, onOpenChange). */
  providerProps?: ComponentProps<typeof SidebarProvider>;
}

function renderItemIcon(
  icon?: ComponentType<{ className?: string }> | ReactNode
) {
  if (!icon) return null;
  if (isValidElement(icon)) {
    return icon;
  }
  if (typeof icon === "function") {
    const IconComp = icon as ComponentType<{ className?: string }>;
    return <IconComp className="h-4 w-4 shrink-0" />;
  }
  return null;
}

function Sidebar({
  header,
  groups,
  user,
  footer,
  renderLink,
  showRail = false,
  showEdgeTrigger = true,
  edgeTriggerClassName,
  children,
  mainContent,
  insetClassName,
  providerProps,
  className,
  collapsible = "icon",
  variant = "sidebar",
  ...props
}: SidebarProps) {
  const isPropDriven = Boolean(header || groups || user || footer);

  return (
    <SidebarProvider {...providerProps}>
      <BaseSidebar
        collapsible={collapsible}
        variant={variant}
        className={className}
        {...props}
      >
        {isPropDriven ? (
          <>
            {showEdgeTrigger && (
              <SidebarEdgeTrigger className={edgeTriggerClassName} />
            )}

            {/* Header */}
            {header && (
              <SidebarHeader className="border-b border-black/5 dark:border-white/10 px-4 py-3.5 group-data-[collapsible=icon]:px-2">
                {isValidElement(header) ? (
                  header
                ) : typeof header === "object" ? (
                  (header as SidebarHeaderConfig).children ? (
                    (header as SidebarHeaderConfig).children
                  ) : (
                    <div
                      className={cn(
                        "flex items-center gap-3 group-data-[collapsible=icon]:justify-center",
                        (header as SidebarHeaderConfig).className
                      )}
                    >
                      {(header as SidebarHeaderConfig).logo && (
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-xs">
                          {(header as SidebarHeaderConfig).logo}
                        </div>
                      )}
                      {((header as SidebarHeaderConfig).title ||
                        (header as SidebarHeaderConfig).subtitle) && (
                        <div className="flex flex-col overflow-hidden transition-all group-data-[collapsible=icon]:hidden">
                          {(header as SidebarHeaderConfig).title && (
                            <span className="truncate text-sm font-semibold tracking-tight text-foreground">
                              {(header as SidebarHeaderConfig).title}
                            </span>
                          )}
                          {(header as SidebarHeaderConfig).subtitle && (
                            <span className="truncate text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
                              {(header as SidebarHeaderConfig).subtitle}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  )
                ) : null}
              </SidebarHeader>
            )}

            {/* Content */}
            <SidebarContent>
              {groups?.map((group, groupIdx) => (
                <SidebarGroup key={group.label || groupIdx}>
                  {group.label && (
                    <SidebarGroupLabel>{group.label}</SidebarGroupLabel>
                  )}
                  <SidebarGroupContent>
                    <SidebarMenu>
                      {group.items.map((item) => {
                        const iconElement = renderItemIcon(item.icon);
                        const hasSubItems = Boolean(
                          item.items && item.items.length > 0
                        );

                        const buttonContent = (
                          <>
                            {iconElement}
                            <span>{item.title}</span>
                          </>
                        );

                        return (
                          <SidebarMenuItem key={item.title}>
                            {renderLink && item.href ? (
                              <SidebarMenuButton
                                asChild
                                isActive={item.isActive}
                                disabled={item.disabled}
                                tooltip={item.title}
                                onClick={item.onClick}
                              >
                                {renderLink(item, buttonContent)}
                              </SidebarMenuButton>
                            ) : item.href ? (
                              <SidebarMenuButton
                                asChild
                                isActive={item.isActive}
                                disabled={item.disabled}
                                tooltip={item.title}
                                onClick={item.onClick}
                              >
                                <a href={item.href}>{buttonContent}</a>
                              </SidebarMenuButton>
                            ) : (
                              <SidebarMenuButton
                                isActive={item.isActive}
                                disabled={item.disabled}
                                tooltip={item.title}
                                onClick={item.onClick}
                              >
                                {buttonContent}
                              </SidebarMenuButton>
                            )}
                            {item.badge && (
                              <SidebarMenuBadge>{item.badge}</SidebarMenuBadge>
                            )}

                            {hasSubItems && (
                              <SidebarMenuSub>
                                {item.items!.map((subItem) => (
                                  <SidebarMenuSubItem key={subItem.title}>
                                    {renderLink && subItem.href ? (
                                      <SidebarMenuSubButton
                                        asChild
                                        isActive={subItem.isActive}
                                        onClick={subItem.onClick}
                                      >
                                        {renderLink(
                                          {
                                            title: subItem.title,
                                            href: subItem.href,
                                            isActive: subItem.isActive,
                                          },
                                          <span>{subItem.title}</span>
                                        )}
                                      </SidebarMenuSubButton>
                                    ) : subItem.href ? (
                                      <SidebarMenuSubButton
                                        asChild
                                        isActive={subItem.isActive}
                                        onClick={subItem.onClick}
                                      >
                                        <a href={subItem.href}>
                                          <span>{subItem.title}</span>
                                        </a>
                                      </SidebarMenuSubButton>
                                    ) : (
                                      <SidebarMenuSubButton
                                        isActive={subItem.isActive}
                                        onClick={subItem.onClick}
                                      >
                                        <span>{subItem.title}</span>
                                      </SidebarMenuSubButton>
                                    )}
                                  </SidebarMenuSubItem>
                                ))}
                              </SidebarMenuSub>
                            )}
                          </SidebarMenuItem>
                        );
                      })}
                    </SidebarMenu>
                  </SidebarGroupContent>
                </SidebarGroup>
              ))}
              {children}
            </SidebarContent>

            {/* Footer */}
            {(user || footer) && (
              <SidebarFooter className="border-t border-black/5 dark:border-white/10 p-3 group-data-[collapsible=icon]:p-2">
                {isValidElement(user) ? (
                  user
                ) : user && typeof user === "object" ? (
                  (user as SidebarUserConfig).children ? (
                    (user as SidebarUserConfig).children
                  ) : (
                    <div
                      className={cn(
                        "flex items-center justify-between gap-2 overflow-hidden group-data-[collapsible=icon]:justify-center",
                        (user as SidebarUserConfig).className
                      )}
                    >
                      <div className="flex items-center gap-2.5 overflow-hidden group-data-[collapsible=icon]:gap-0 group-data-[collapsible=icon]:justify-center">
                        <Avatar className="h-8 w-8 shrink-0">
                          {(user as SidebarUserConfig).avatar && (
                            <AvatarImage
                              src={(user as SidebarUserConfig).avatar}
                              alt={(user as SidebarUserConfig).name}
                            />
                          )}
                          <AvatarFallback className="bg-primary text-primary-foreground text-xs font-semibold">
                            {(user as SidebarUserConfig).fallback ||
                              (user as SidebarUserConfig).name
                                .slice(0, 2)
                                .toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col overflow-hidden group-data-[collapsible=icon]:hidden">
                          <span className="truncate text-xs font-semibold text-foreground">
                            {(user as SidebarUserConfig).name}
                          </span>
                          {(user as SidebarUserConfig).role && (
                            <span className="truncate text-[10px] text-muted-foreground capitalize">
                              {(user as SidebarUserConfig).role}
                            </span>
                          )}
                        </div>
                      </div>
                      {(user as SidebarUserConfig).onLogout && (
                        <button
                          type="button"
                          onClick={(user as SidebarUserConfig).onLogout}
                          disabled={(user as SidebarUserConfig).isLoggingOut}
                          className="group-data-[collapsible=icon]:hidden rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors cursor-pointer"
                          title={
                            (user as SidebarUserConfig).logoutTooltip ||
                            "Log out"
                          }
                        >
                          <LogOut className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  )
                ) : null}
                {footer}
              </SidebarFooter>
            )}

            {showRail && <SidebarRail />}
          </>
        ) : (
          children
        )}
      </BaseSidebar>

      <SidebarInset className={cn("min-w-0 max-w-full overflow-x-hidden", insetClassName)}>
        {mainContent}
      </SidebarInset>
    </SidebarProvider>
  );
}

export { Sidebar, SidebarTrigger, SidebarEdgeTrigger, useSidebar };
