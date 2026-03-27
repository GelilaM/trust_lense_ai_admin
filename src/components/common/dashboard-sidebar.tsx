"use client"

import * as React from "react"
import {
  LayoutDashboard,
  Zap,
  ShieldCheck,
  User,
  AlertTriangle,
  ChevronRight,
  Search,
  Bell,
  Settings,
} from "lucide-react"

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import { cn } from "@/lib/utils"
import { useApiGet } from "@/hooks/use-api"
import { UserProfileResponse } from "@/types/api"

const navItems = [
  {
    title: "Dashboard Overview",
    icon: LayoutDashboard,
    url: "/dashboard",
  },
  {
    title: "Credit Intelligence",
    icon: Zap,
    url: "/credit-intelligence",
  },
  {
    title: "User Verifications",
    icon: ShieldCheck,
    url: "/verifications",
    badge: "12",
  },
  {
    title: "Risk Monitoring",
    icon: AlertTriangle,
    url: "/risk",
    badge: "03",
  },
]

export function DashboardSidebar() {
  const { data: profile } = useApiGet<UserProfileResponse>("/profile")
  const fullName = profile?.full_name || "Alex Morgan"
  
  return (
    <Sidebar variant="sidebar" collapsible="icon" className="border-none bg-white text-brand-navy shadow-ambient">
      <SidebarHeader className="p-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-navy text-white shadow-lg shadow-brand-navy/10">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <div className="flex flex-col group-data-[collapsible=icon]:hidden">
            <span className="text-lg font-bold tracking-tight text-brand-navy">TrustLens</span>
            <span className="text-xs font-bold text-brand-teal label-caps">Admin Portal</span>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent className="px-3">
        <SidebarGroup>
          <SidebarGroupLabel className="px-3 text-[10px] font-bold uppercase tracking-widest text-brand-navy/30">
            Navigation
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => (
                <SidebarMenuItem key={item.title} className="mb-1">
                  <SidebarMenuButton
                    render={<a href={item.url} />}
                    tooltip={item.title}
                    className="h-11 rounded-xl px-3 transition-all duration-200 hover:bg-brand-navy/5 hover:text-brand-navy group-data-[active=true]:bg-brand-navy group-data-[active=true]:text-white shadow-none data-[active=true]:shadow-lg data-[active=true]:shadow-brand-navy/10"
                  >
                    <item.icon className="h-5 w-5 shrink-0" />
                    <span className="font-bold group-data-[collapsible=icon]:hidden">{item.title}</span>
                    {item.badge && (
                      <span className="ml-auto flex h-5 w-5 items-center justify-center rounded-full bg-brand-teal text-[10px] font-bold text-brand-navy-deep group-data-[collapsible=icon]:hidden">
                        {item.badge}
                      </span>
                    )}
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="p-4">
        <div className="flex items-center gap-3 rounded-2xl bg-brand-navy/5 p-3 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:p-2 border border-brand-navy/5">
          <div className="h-8 w-8 rounded-full bg-gradient-to-tr from-brand-navy to-brand-teal" />
          <div className="flex flex-col group-data-[collapsible=icon]:hidden">
            <span className="text-sm font-bold text-brand-navy">{fullName}</span>
            <span className="text-[10px] font-bold text-brand-navy/40 uppercase tracking-tight">Admin Access</span>
          </div>
          <Settings className="ml-auto h-4 w-4 text-brand-navy/20 hover:text-brand-navy group-data-[collapsible=icon]:hidden cursor-pointer" />
        </div>
      </SidebarFooter>

    </Sidebar>
  )
}
