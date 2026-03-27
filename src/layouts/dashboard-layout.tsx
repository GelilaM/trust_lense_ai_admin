"use client"

import * as React from "react"
import { DashboardSidebar } from "@/components/common/dashboard-sidebar"
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { Bell, Search, HelpCircle } from "lucide-react"
import { useApiGet } from "@/hooks/use-api"
import { UserProfileResponse } from "@/types/api"

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { data: profile, loading } = useApiGet<UserProfileResponse>("/profile")
  const fullName = profile?.full_name || "Admin Operator"
  const initials = fullName.split(" ").filter(Boolean).map((n) => n[0]).join("").slice(0, 2).toUpperCase()
  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-surface-container-low">
        <DashboardSidebar />
        <SidebarInset className="flex w-full flex-col">
          <header className="sticky top-0 z-30 flex h-20 shrink-0 items-center justify-between bg-white/80 px-8 backdrop-blur-md">
            <div className="flex items-center gap-6">
              <div className="relative w-[480px] max-md:hidden">
                <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/50" />
                <input
                  type="text"
                  placeholder="Search enterprise data..."
                  className="h-11 w-full rounded-xl bg-surface-container-low/50 pl-11 pr-4 text-sm outline-none transition-all placeholder:text-muted-foreground/40 focus:bg-white focus:ring-1 focus:ring-brand-teal/20"
                />
              </div>
            </div>
            
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <button className="flex h-10 w-10 items-center justify-center rounded-full text-muted-foreground/60 transition-colors hover:bg-surface-container-highest/50">
                  <Bell className="h-5 w-5" />
                </button>
                <button className="flex h-10 w-10 items-center justify-center rounded-full text-muted-foreground/60 transition-colors hover:bg-surface-container-highest/50">
                  <HelpCircle className="h-5 w-5" />
                </button>
              </div>

              <div className="h-8 w-[1px] bg-surface-container-highest" />

              <div className="flex items-center gap-3">
                <div className="flex flex-col items-end">
                  <span className="text-sm font-bold text-brand-navy">{loading ? "Loading..." : fullName}</span>
                  <span className="text-[10px] font-medium text-muted-foreground/60 uppercase tracking-tight">
                    {profile?.id ? `ID ${profile.id.slice(0, 8)}` : "Admin Access"}
                  </span>
                </div>
                <div className="group relative h-10 w-10 overflow-hidden rounded-full border-2 border-surface-container-highest bg-surface-container-highest shrink-0 flex items-center justify-center">
                  <div className="h-full w-full bg-gradient-to-tr from-brand-navy to-brand-teal flex items-center justify-center text-white font-bold text-xs">
                    {initials}
                  </div>
                </div>
              </div>
            </div>
          </header>
          
          <main className="flex-1 overflow-y-auto p-10">
            <div className="mx-auto max-w-[1600px]">
              {children}
            </div>
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  )
}
