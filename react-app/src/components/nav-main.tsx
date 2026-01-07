import { IconCirclePlusFilled, IconMail, type Icon } from "@tabler/icons-react"
import { Link, useLocation } from "react-router-dom"

import { Button } from "@/components/ui/button"
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"

export function NavMain({
  items,
  activeView,
  onChatClick,
  onDashboardClick,
}: {
  items: {
    title: string
    url: string
    icon?: Icon
    key?: string
  }[]
  activeView?: "dashboard" | "chat"
  onChatClick?: () => void
  onDashboardClick?: () => void
}) {
  const location = useLocation();

  return (
    <SidebarGroup>
      <SidebarGroupContent className="flex flex-col gap-2">
        <SidebarMenu>
          <SidebarMenuItem className="flex items-center gap-2">
            <SidebarMenuButton
              tooltip="Quick Create"
              className="bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground active:bg-primary/90 active:text-primary-foreground min-w-8 duration-200 ease-linear"
            >
              <IconCirclePlusFilled />
              <span>Quick Create</span>
            </SidebarMenuButton>
            <Button
              size="icon"
              className="size-8 group-data-[collapsible=icon]:opacity-0"
              variant="outline"
            >
              <IconMail />
              <span className="sr-only">Inbox</span>
            </Button>
          </SidebarMenuItem>
        </SidebarMenu>
        <SidebarMenu>
          {items.map((item) => {
            let isActive = false;
            
            if (item.key === "dashboard") {
              isActive = location.pathname === "/" || (activeView === "dashboard" && location.pathname === "/");
            } else if (item.key === "chat") {
              isActive = activeView === "chat";
            } else if (item.key) {
              isActive = location.pathname === item.url;
            }

            const handleClick = (e: React.MouseEvent) => {
              if (item.key === "chat" && onChatClick) {
                e.preventDefault();
                onChatClick();
              } else if (item.key === "dashboard" && onDashboardClick) {
                e.preventDefault();
                onDashboardClick();
              }
            };

            return (
              <SidebarMenuItem key={item.title}>
                {item.key === "chat" || item.key === "dashboard" ? (
                  <SidebarMenuButton
                    tooltip={item.title}
                    isActive={isActive}
                    onClick={handleClick}
                  >
                    {item.icon && <item.icon />}
                    <span>{item.title}</span>
                  </SidebarMenuButton>
                ) : (
                  <SidebarMenuButton
                    tooltip={item.title}
                    isActive={isActive}
                    asChild
                  >
                    <Link to={item.url}>
                      {item.icon && <item.icon />}
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                )}
              </SidebarMenuItem>
            );
          })}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  )
}
