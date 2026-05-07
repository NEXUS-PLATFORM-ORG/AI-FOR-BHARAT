import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { Link, useLocation } from "react-router-dom"

export function AppSidebar({ items = [], title = "VidhanSeva" }) {
  const location = useLocation()

  return (
    <Sidebar className="bg-white border-r border-slate-200" collapsible="icon">
      <SidebarHeader className="h-16 flex items-center justify-center border-b border-slate-200">
        <h2 className="font-bold text-lg text-[#0F172A] px-4 w-full truncate group-data-[collapsible=icon]:hidden transition-opacity duration-200">{title}</h2>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-slate-500 font-medium">Menu</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-2 mt-2">
              {items.map((item) => {
                const isActive = location.pathname.startsWith(item.url)
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton 
                      asChild 
                      isActive={isActive}
                      className="hover:bg-slate-100 hover:text-[#0F172A] data-[active=true]:bg-[#0F172A] data-[active=true]:text-white data-[active=true]:hover:bg-slate-800 data-[active=true]:hover:text-white h-auto py-2.5 px-3 transition-colors"
                    >
                      <Link to={item.url} className="flex items-center gap-3">
                        {item.icon && (
                          <item.icon
                            className="w-5 h-5"
                            {...(item.icon.displayName?.includes('Icon') === false
                              ? { weight: isActive ? 'fill' : 'regular' }
                              : {})}
                          />
                        )}
                        <span className="text-[15px] font-bold">{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  )
}
