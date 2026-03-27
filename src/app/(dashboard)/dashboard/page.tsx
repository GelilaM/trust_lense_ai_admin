"use client"

import { useApiGet } from "@/hooks/use-api"
import { DashboardStatsResponse, RiskStatsResponse } from "@/types/api"
import { PremiumCard, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/common/premium-card"
import { Badge } from "@/components/ui/badge"
import { Zap, ShieldCheck, Users, AlertTriangle, ArrowUpRight, ArrowDownRight, TrendingUp } from "lucide-react"
import { cn } from "@/lib/utils"

export default function DashboardPage() {
  const { data: overview, loading: overviewLoading } = useApiGet<DashboardStatsResponse>("/stats/overview")
  const { data: riskStats, loading: riskLoading } = useApiGet<RiskStatsResponse>("/stats/risk")

  const volume = overview?.verification_volume_7d ?? []
  const maxVolume = Math.max(...volume.map((d) => d.count), 1)
  const growthPct = volume.length >= 2
    ? (((volume[volume.length - 1].count - volume[0].count) / Math.max(volume[0].count, 1)) * 100)
    : 0

  const riskTotal = (riskStats?.risk_distribution ?? []).reduce((sum, bucket) => sum + bucket.count, 0)
  const riskMap = new Map((riskStats?.risk_distribution ?? []).map((bucket) => [bucket.level, bucket.count]))
  const riskBars = [
    { label: "Critical", level: "critical", color: "bg-red-500" },
    { label: "High", level: "high", color: "bg-amber-500" },
    { label: "Medium", level: "medium", color: "bg-blue-500" },
    { label: "Low", level: "low", color: "bg-brand-teal" },
  ].map((entry) => {
    const count = riskMap.get(entry.level) ?? 0
    const value = riskTotal > 0 ? Math.round((count / riskTotal) * 100) : 0
    return { ...entry, count, value }
  })

  return (
    <div className="space-y-10 pb-10">
      {/* Header Section */}
      <div className="flex flex-col gap-1">
        <h1 className="text-display-lg font-bold tracking-tight text-brand-navy">Dashboard Overview</h1>
        <p className="text-brand-navy/60 font-medium text-lg">Macro-level intelligence and operational KPIs for TrustLens AI.</p>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
        {[
          {
            title: "Global Trust Score",
            value: overviewLoading ? "..." : overview?.global_trust_score.toFixed(1) || "0.0",
            trend: `${growthPct >= 0 ? "+" : ""}${growthPct.toFixed(1)}%`,
            trendUp: growthPct >= 0,
            icon: ShieldCheck,
            color: "text-brand-teal",
            bg: "bg-brand-teal/10",
          },
          {
            title: "Verified Identities",
            value: overviewLoading ? "..." : overview?.total_users.toLocaleString() || "0",
            trend: `${overview?.verified_prime_count ?? 0} prime`,
            trendUp: true,
            icon: Users,
            color: "text-blue-500",
            bg: "bg-blue-500/10",
          },
          {
            title: "Pending Reviews",
            value: riskLoading ? "..." : riskStats?.active_alerts.toString() || "0",
            trend: "combined score < 40",
            trendUp: false,
            icon: Zap,
            color: "text-amber-500",
            bg: "bg-amber-500/10",
          },
          {
            title: "Risk Indicators",
            value: riskLoading ? "..." : (riskStats?.suspicious_patterns.reduce((sum, row) => sum + row.count, 0) ?? 0).toString(),
            trend: "suspicious patterns",
            trendUp: false,
            icon: AlertTriangle,
            color: "text-red-500",
            bg: "bg-red-500/10",
          },
        ].map((kpi, i) => (
          <PremiumCard key={i} className="group overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 border-none">
              <CardTitle className="text-xs font-bold uppercase tracking-widest text-brand-navy/40">
                {kpi.title}
              </CardTitle>
              <div className={cn("p-2 rounded-lg transition-colors", kpi.bg)}>
                <kpi.icon className={cn("h-4 w-4", kpi.color)} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-brand-navy tracking-tight">{kpi.value}</div>
              <div className="mt-1 flex items-center gap-1">
                {kpi.trendUp ? (
                  <ArrowUpRight className="h-3 w-3 text-brand-teal" />
                ) : (
                  <ArrowDownRight className="h-3 w-3 text-red-500" />
                )}
                <span className={cn("text-xs font-bold", kpi.trendUp ? "text-brand-teal" : "text-red-500")}>
                  {kpi.trend}
                </span>
                <span className="text-xs text-brand-navy/30 ml-1 font-medium">vs last 30d</span>
              </div>
            </CardContent>
          </PremiumCard>
        ))}
      </div>

      {/* Trends & Insights */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <PremiumCard className="lg:col-span-2">
          <CardHeader className="border-none">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-xl font-bold text-brand-navy">Identification Trends</CardTitle>
                <CardDescription className="text-brand-navy/60 font-medium">Seven-day verification volume from `/stats/overview`.</CardDescription>
              </div>
              <Badge variant="outline" className="border-brand-teal/20 bg-brand-teal/5 text-brand-teal gap-1 px-3 py-1 font-bold">
                <TrendingUp className="h-3 w-3" />
                Growth: {growthPct.toFixed(1)}%
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="h-[300px] flex items-end gap-3 pb-4">
            {(volume.length ? volume : new Array(7).fill({ date: "", count: 0 })).map((day, i) => (
              <div key={i} className="flex-1 space-y-2">
                <div 
                  className="w-full bg-brand-navy/5 rounded-t-sm hover:bg-brand-teal transition-all duration-500 ease-out cursor-pointer"
                  style={{ height: `${Math.max(8, ((day.count || 0) / maxVolume) * 100)}%` }}
                />
                <div className="text-[10px] text-center font-bold text-brand-navy/20 uppercase tracking-tighter">
                  {day.date ? new Date(`${day.date}T00:00:00Z`).toLocaleDateString(undefined, { weekday: "short" }) : "N/A"}
                </div>
              </div>
            ))}
          </CardContent>
        </PremiumCard>

        <PremiumCard>
          <CardHeader className="border-none">
            <CardTitle className="text-xl font-bold text-brand-navy">Risk Distribution</CardTitle>
            <CardDescription className="text-brand-navy/60 font-medium">Live severity buckets from `/stats/risk`.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {riskBars.map((risk, i) => (
              <div key={i} className="space-y-2">
                <div className="flex justify-between text-xs font-bold text-brand-navy">
                  <span className="uppercase tracking-tight opacity-70">{risk.label}</span>
                  <span>{risk.value}% ({risk.count})</span>
                </div>
                <div className="h-2 w-full bg-surface-container-highest rounded-full overflow-hidden">
                  <div 
                    className={cn("h-full transition-all duration-1000", risk.color)}
                    style={{ width: `${risk.value}%` }}
                  />
                </div>
              </div>
            ))}
            <div className="mt-8 pt-6 border-t border-surface-container-highest">
              <p className="text-xs text-brand-navy/60 leading-relaxed font-medium">
                <span className="text-brand-teal font-bold mr-1">AI INSIGHT:</span>
                {riskStats?.suspicious_patterns[0]?.pattern
                  ? `${riskStats.suspicious_patterns[0].pattern} = ${riskStats.suspicious_patterns[0].count}.`
                  : "Risk insights will appear after the first verification submissions."}
              </p>
            </div>
          </CardContent>
        </PremiumCard>
      </div>
    </div>
  )
}
