"use client"

import { PremiumCard, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/common/premium-card"
import { Badge } from "@/components/ui/badge"
import { Zap, ShieldCheck, PieChart, BarChart3, TrendingUp, Info, AlertTriangle } from "lucide-react"
import { cn } from "@/lib/utils"
import { useApiGet } from "@/hooks/use-api"
import { DashboardStatsResponse, RiskStatsResponse } from "@/types/api"

export default function CreditIntelligencePage() {
  const { data: overview } = useApiGet<DashboardStatsResponse>("/stats/overview")
  const { data: riskStats } = useApiGet<RiskStatsResponse>("/stats/risk")

  const riskMap = new Map((riskStats?.risk_distribution ?? []).map((bucket) => [bucket.level, bucket.count]))
  const total = (riskStats?.risk_distribution ?? []).reduce((sum, bucket) => sum + bucket.count, 0)
  const segmentation = [
    { label: "Low Risk", level: "low", color: "bg-brand-teal" },
    { label: "Medium Risk", level: "medium", color: "bg-blue-500" },
    { label: "High Risk", level: "high", color: "bg-amber-500" },
    { label: "Critical", level: "critical", color: "bg-red-500" },
  ].map((entry) => {
    const count = riskMap.get(entry.level) ?? 0
    const value = total > 0 ? Math.round((count / total) * 100) : 0
    return { ...entry, count, value }
  })

  const readinessIndex = Math.round((overview?.global_trust_score ?? 0) * 8.5)

  return (
    <div className="space-y-10 pb-10">
      {/* Header Section */}
      <div className="flex flex-col gap-1">
        <h1 className="text-display-lg font-bold tracking-tight text-brand-navy">Credit Intelligence</h1>
        <p className="text-brand-navy/60 font-medium text-lg">Deep-dive into financial readiness and user segmentation analytics.</p>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <PremiumCard className="lg:col-span-1 bg-brand-navy text-white">
          <CardHeader className="border-none">
            <CardTitle className="text-brand-teal text-sm font-bold uppercase tracking-widest">Readiness Index</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-center p-8">
              <div className="relative flex h-48 w-48 items-center justify-center rounded-full border-[12px] border-white/5">
                <div className="absolute inset-0 rounded-full border-[12px] border-brand-teal border-t-transparent -rotate-45" />
                <div className="flex flex-col items-center">
                  <span className="text-5xl font-bold tracking-tighter">{readinessIndex}</span>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-brand-teal">Prime Alpha</span>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 border-t border-white/10 pt-6">
              <div className="flex flex-col">
                <span className="text-[10px] uppercase tracking-widest text-white/40 font-bold">Confidence</span>
                <span className="text-lg font-bold text-white">{(overview?.global_trust_score ?? 0).toFixed(1)}%</span>
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] uppercase tracking-widest text-white/40 font-bold">Volatility</span>
                <span className="text-lg font-bold text-brand-teal">{(riskStats?.active_alerts ?? 0) > 0 ? "Moderate" : "Low"}</span>
              </div>
            </div>
          </CardContent>
        </PremiumCard>

        <PremiumCard className="lg:col-span-2">
          <CardHeader className="border-none">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-xl font-bold text-brand-navy">Segmentation Analysis</CardTitle>
                <CardDescription className="text-brand-navy/60 font-medium">Distribution of trust tiers across the active user base.</CardDescription>
              </div>
              <div className="flex gap-2">
                <Badge variant="secondary" className="bg-brand-teal/10 text-brand-teal border-none font-bold uppercase tracking-tighter">Monthly</Badge>
                <Badge variant="outline" className="opacity-40 border-none font-bold uppercase tracking-tighter">Quarterly</Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent className="h-[320px]">
            <div className="flex h-full items-end gap-6 pt-10 px-4">
              {segmentation.map((segment, i) => (
                <div key={i} className="flex-1 group flex flex-col items-center gap-4">
                  <div className="relative flex-1 w-full bg-surface-container-highest/30 rounded-t-lg overflow-hidden flex items-end">
                    <div 
                      className={cn("w-full transition-all duration-1000 ease-out group-hover:brightness-110", segment.color)}
                      style={{ height: `${segment.value}%` }}
                    />
                    <div className="absolute top-[-30px] w-full text-center text-xs font-bold text-brand-navy opacity-0 group-hover:opacity-100 transition-opacity">
                      {segment.value}% ({segment.count})
                    </div>
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-brand-navy/40">{segment.label}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </PremiumCard>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <PremiumCard>
          <CardHeader className="border-none">
            <CardTitle className="text-xl font-bold text-brand-navy">Intelligence Signals</CardTitle>
            <CardDescription className="text-brand-navy/60 font-medium">AI-driven insights on financial behaviors.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {[
              {
                title: "Positive Liquidity Trend",
                description: `Global trust score is ${overview?.global_trust_score.toFixed(1) ?? "0.0"} across verified users.`,
                icon: TrendingUp,
                color: "text-brand-teal",
                bg: "bg-brand-teal/10",
              },
              {
                title: "Inconsistent Debt Patterns",
                description: `${riskMap.get("high") ?? 0} users currently sit in the high-risk bucket.`,
                icon: Info,
                color: "text-blue-500",
                bg: "bg-blue-500/10",
              },
              {
                title: "Trust Anomaly Detected",
                description: `${riskStats?.active_alerts ?? 0} active alerts require review based on latest scores.`,
                icon: AlertTriangle,
                color: "text-amber-500",
                bg: "bg-amber-500/10",
              },
            ].map((signal, i) => (
              <div key={i} className="flex items-start gap-4 p-4 rounded-xl bg-surface-container-low/50 hover:bg-surface-container-low transition-colors">
                <div className={cn("mt-1 p-2 rounded-lg", signal.bg)}>
                  <signal.icon className={cn("h-4 w-4", signal.color)} />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-brand-navy">{signal.title}</h4>
                  <p className="text-xs text-brand-navy/60 leading-relaxed font-medium">{signal.description}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </PremiumCard>

        <PremiumCard>
          <CardHeader className="border-none">
            <CardTitle className="text-xl font-bold text-brand-navy">Economic Indicators</CardTitle>
            <CardDescription className="text-brand-navy/60 font-medium">External factors affecting trust scores.</CardDescription>
          </CardHeader>
          <CardContent className="h-[250px] flex items-center justify-center">
            <div className="text-center space-y-4">
              <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-surface-container-highest">
                <BarChart3 className="h-8 w-8 text-brand-navy/20" />
              </div>
              <p className="text-sm text-brand-navy/40 font-medium max-w-[240px]">
                Regional economic stability data integration is in progress.
              </p>
            </div>
          </CardContent>
        </PremiumCard>
      </div>
    </div>
  )
}
