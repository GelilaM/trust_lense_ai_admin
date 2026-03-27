"use client"

import { useRouter } from "next/navigation"
import { useApiGet } from "@/hooks/use-api"
import { RegisteredUsersResponse } from "@/types/api"
import { PremiumCard, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/common/premium-card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { ShieldCheck, MoreHorizontal, Filter, Download, ArrowRight, Clock, AlertCircle, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

export default function VerificationsPage() {
  const router = useRouter()
  const { data, loading, error } = useApiGet<RegisteredUsersResponse>("/auth/registered-users")

  const handleDetailClick = (id: string) => {
    // Navigate to profile with the specific user_id as a view_id param
    router.push(`/profile?view_id=${id}`)
  }

  const users = data?.users || []

  return (
    <div className="space-y-10 pb-10">
      {/* Header Section */}
      <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
        <div className="flex flex-col gap-1">
          <h1 className="text-display-lg font-bold tracking-tight text-brand-navy">User Verifications</h1>
          <p className="text-brand-navy/60 font-medium text-lg">Operational queue for managing the daily verification workload.</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" className="h-11 border-none bg-surface-container-highest/50 px-5 text-brand-navy/60 font-bold label-caps hover:bg-surface-container-highest">
            <Filter className="mr-2 h-4 w-4" />
            Filter Queue
          </Button>
          <Button className="h-11 border-none bg-brand-navy px-6 text-white font-bold label-caps hover:bg-brand-navy-deep">
            <Download className="mr-2 h-4 w-4" />
            Export Data
          </Button>
        </div>
      </div>

      {/* Queue Stats */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        {[
          { label: "Active Queue", value: loading ? "..." : data?.total.toString() || "0", icon: Clock, color: "text-brand-teal" },
          { label: "Priority Flags", value: "08", icon: AlertCircle, color: "text-red-500" },
          { label: "Completion Rate", value: "94%", icon: ShieldCheck, color: "text-blue-500" },
        ].map((stat, i) => (
          <PremiumCard key={i}>
            <CardContent className="flex items-center gap-4 py-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-surface-container-low">
                <stat.icon className={cn("h-6 w-6", stat.color)} />
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-brand-navy/40">{stat.label}</span>
                <div className="text-2xl font-bold text-brand-navy">{stat.value}</div>
              </div>
            </CardContent>
          </PremiumCard>
        ))}
      </div>

      {/* Verification Table */}
      <PremiumCard className="overflow-hidden">
        {error ? (
          <div className="p-20 text-center space-y-4">
            <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-red-50 text-red-500">
              <AlertCircle className="h-6 w-6" />
            </div>
            <p className="text-brand-navy/60 font-medium">{error}</p>
            <Button onClick={() => window.location.reload()} variant="outline" className="label-caps font-bold">Retry</Button>
          </div>
        ) : loading ? (
          <div className="p-40 flex flex-col items-center justify-center gap-4 text-brand-navy/40">
            <Loader2 className="h-8 w-8 animate-spin" />
            <span className="text-sm font-bold uppercase tracking-widest">Synchronizing Registry...</span>
          </div>
        ) : (
          <>
            <Table>
              <TableHeader className="bg-surface-container-low/50">
                <TableRow className="border-none hover:bg-transparent">
                  <TableHead className="label-caps py-6 pl-8">User ID</TableHead>
                  <TableHead className="label-caps py-6">User Identity</TableHead>
                  <TableHead className="label-caps py-6">Nationality</TableHead>
                  <TableHead className="label-caps py-6">DOB</TableHead>
                  <TableHead className="label-caps py-6">Occupation</TableHead>
                  <TableHead className="label-caps py-6">Business Type</TableHead>
                  <TableHead className="label-caps py-6">Income</TableHead>
                  <TableHead className="label-caps py-6 text-right pr-8">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="py-20 text-center text-brand-navy/40 font-medium">
                      No registered users found.
                    </TableCell>
                  </TableRow>
                ) : (
                  users.map((user) => (
                    <TableRow key={user.id} className="group border-none hover:bg-surface-container-low transition-colors duration-200">
                      <TableCell className="py-6 pl-8 font-mono text-[10px] font-bold text-brand-navy/40 tracking-tighter max-w-[100px] truncate">
                        {user.id}
                      </TableCell>
                      <TableCell className="py-6">
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-full bg-gradient-to-tr from-brand-navy/10 to-brand-teal/10 flex items-center justify-center text-[10px] font-bold text-brand-navy/40">
                            {user.full_name.split(' ').map(n => n[0]).join('')}
                          </div>
                          <span className="text-sm font-bold text-brand-navy">{user.full_name}</span>
                        </div>
                      </TableCell>
                      <TableCell className="py-6 text-xs text-brand-navy/60 font-medium">
                        {user.nationality || "—"}
                      </TableCell>
                      <TableCell className="py-6 text-xs text-brand-navy/60 font-medium">
                        {user.date_of_birth ? new Date(user.date_of_birth).toLocaleDateString() : "—"}
                      </TableCell>
                      <TableCell className="py-6 text-xs text-brand-navy/60 font-medium">
                        {user.occupation}
                      </TableCell>
                      <TableCell className="py-6 text-xs text-brand-navy/60 font-medium">
                        {user.business_type}
                      </TableCell>
                      <TableCell className="py-6">
                        <span className="text-xs font-bold text-brand-navy">
                          ${user.monthly_income.toLocaleString()}
                        </span>
                      </TableCell>
                      <TableCell className="py-6 text-right pr-8">
                        <div className="flex justify-end gap-2">
                          <Button variant="ghost" size="sm" className="h-9 w-9 p-0 hover:bg-surface-container-highest text-brand-navy/60">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                          <Button 
                            onClick={() => handleDetailClick(user.id)}
                            size="sm" 
                            className="h-9 w-9 p-0 bg-brand-teal text-brand-navy-deep hover:bg-brand-teal/90 rounded-lg"
                          >
                            <ArrowRight className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
            <div className="flex items-center justify-between bg-surface-container-low/30 px-8 py-6">
              <span className="text-xs text-brand-navy/40 font-medium">
                Showing {users.length} of {data?.total || 0} users
              </span>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" disabled className="h-9 border-none bg-surface-container-low px-4 text-xs font-bold text-brand-navy/40 label-caps">Prev</Button>
                <Button variant="outline" size="sm" className="h-9 border-none bg-surface-container-highest px-4 text-xs font-bold text-brand-navy label-caps hover:bg-brand-teal hover:text-brand-navy-deep">Next</Button>
              </div>
            </div>
          </>
        )}
      </PremiumCard>
    </div>
  )
}
