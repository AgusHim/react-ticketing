import * as React from "react"
import {
  IconDashboard,
  IconLayout,
  IconChairDirector,
  IconTicket,
  IconTable,
  IconCalendarEvent
} from "@tabler/icons-react"

import { NavMain } from "@/components/nav-main"
import { NavUser } from "@/components/nav-user"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { useAuth } from "@/context/AuthContext"

const data = {
  user: {
    name: "Rijal",
    email: "rijal@ynsolo.com",
    avatar: "/avatars/shadcn.jpg",
  },
  navMain: [
    {
      title: "Dashboard",
      url: "/dashboard",
      icon: IconDashboard,
    },
    {
      title: "Events",
      url: "/events",
      icon: IconCalendarEvent,
    },
    {
      title: "Booked Seats",
      url: "/booked-seats",
      icon: IconChairDirector,
    },
    {
      title: "Table Booked",
      url: "/booked",
      icon: IconTable,
    },
    {
      title: "Tickets",
      url: "/tickets",
      icon: IconTicket,
    },
    {
      title: "Layout Kursi",
      url: "/seats",
      icon: IconLayout,
    },
  ],
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { user } = useAuth();
  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className="data-[slot=sidebar-menu-button]:!p-1.5"
            >
              <a href="/">
                <span className="text-base font-semibold">ITTIBA EVENT</span>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={{"name":user?.name??'',email:user?.email??'', avatar:""}} />
      </SidebarFooter>
    </Sidebar>
  )
}
