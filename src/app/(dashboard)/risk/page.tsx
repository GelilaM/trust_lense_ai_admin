"use client"

import { PremiumCard, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/common/premium-card"
import { Badge } from "@/components/ui/badge"
import { ShieldAlert, Radio, Activity, Terminal, ShieldX } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { useApiGet } from "@/hooks/use-api"
import { RiskStatsResponse } from "@/types/api"

export default function RiskMonitoringPage() {
  const { data: riskStats, loading } = useApiGet<RiskStatsResponse>("/stats/risk")
  const riskMap = new Map((riskStats?.risk_distribution ?? []).map((bucket) => [bucket.level, bucket.count]))
  const total = (riskStats?.risk_distribution ?? []).reduce((sum, bucket) => sum + bucket.count, 0)
  const critical = riskMap.get("critical") ?? 0

  const liveEvents = (riskStats?.suspicious_patterns ?? []).map((pattern, index) => ({
    time: new Date(Date.now() - index * 60_000).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
    event: pattern.pattern,
    status: pattern.count > 0 ? "Flagged" : "Success",
    info: `Count: ${pattern.count}`,
  }))

  return (
    <div className="space-y-10 pb-10">
      <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
        <div className="flex flex-col gap-1">
          <h1 className="text-display-lg font-bold tracking-tight text-brand-navy">Risk Monitoring</h1>
          <p className="text-brand-navy/60 font-medium text-lg">Real-time threat detection and mitigation intelligence.</p>
        </div>
        <div className="flex items-center gap-3 rounded-full bg-brand-teal/10 px-4 py-2">
          <div className="h-2 w-2 animate-pulse rounded-full bg-brand-teal" />
          <span className="text-xs font-bold uppercase tracking-tight text-brand-teal">Live Monitoring Active</span>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
        <div className="lg:col-span-3 space-y-6">
          <PremiumCard className="relative overflow-hidden border-none bg-brand-navy text-white">
            <div className="absolute top-0 right-0 p-8 h-full aspect-square opacity-10 pointer-events-none">
              <Radio className="h-full w-full animate-ping text-brand-teal" />
            </div>
            <CardHeader>
              <CardTitle className="text-xl font-bold">Threat Velocity Index</CardTitle>
              <CardDescription className="text-white/40 font-medium">Distribution intensity from `/stats/risk`.</CardDescription>
            </CardHeader>
            <CardContent className="h-[200px] flex items-end gap-1.5 pb-6">
              {(riskStats?.risk_distribution ?? []).map((bucket, i) => {
                const h = total > 0 ? (bucket.count / total) * 100 : 10
                return (
                  <div key={i} className="flex-1 flex flex-col justify-end">
                    <div
                      className="w-full bg-brand-teal/20 rounded-t-[1px] group transition-all duration-300 hover:bg-brand-teal"
                      style={{ height: `${Math.max(10, h)}%` }}
                    />
                  </div>
                )
              })}
            </CardContent>
          </PremiumCard>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <PremiumCard>
              <CardHeader className="border-none flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-bold uppercase tracking-widest text-brand-navy/40">Attack Surface Lock</CardTitle>
                <ShieldAlert className="h-4 w-4 text-brand-teal" />
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-3xl font-bold text-brand-navy tracking-tight">{loading ? "..." : critical > 0 ? "Watch" : "Stable"}</div>
                <div className="flex gap-2">
                  <Badge className={cn("border-none text-[8px] font-bold uppercase", critical > 0 ? "bg-amber-500/10 text-amber-600" : "bg-brand-teal/10 text-brand-teal")}>
                    {critical > 0 ? `${critical} Critical` : "No Critical Alerts"}
                  </Badge>
                  <Badge className="bg-blue-500/10 text-blue-500 border-none text-[8px] font-bold uppercase">{total} Profiles Scored</Badge>
                </div>
                <p className="text-[10px] text-brand-navy/60 leading-relaxed font-medium">
                  System status reflects current `risk_distribution` and `active_alerts` values from backend scoring.
                </p>
              </CardContent>
            </PremiumCard>

            <PremiumCard>
              <CardHeader className="border-none flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-bold uppercase tracking-widest text-brand-navy/40">AI Decision Logic</CardTitle>
                <Activity className="h-4 w-4 text-brand-teal" />
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-3xl font-bold text-brand-navy tracking-tight">{loading ? "..." : "Active"}</div>
                <div className="flex gap-2">
                  <Badge className="bg-brand-teal/10 text-brand-teal border-none text-[8px] font-bold uppercase font-bold">Alerts: {riskStats?.active_alerts ?? 0}</Badge>
                  <Badge className="bg-amber-500/10 text-amber-500 border-none text-[8px] font-bold uppercase font-bold">Patterns: {riskStats?.suspicious_patterns.length ?? 0}</Badge>
                </div>
                <p className="text-[10px] text-brand-navy/60 leading-relaxed font-medium">
                  Live metrics are sourced from `/stats/risk` suspicious pattern aggregation.
                </p>
              </CardContent>
            </PremiumCard>
          </div>
        </div>

        <div className="space-y-6">
          <PremiumCard className="bg-surface-container-highest/20 border-none">
            <CardHeader className="pb-4">
              <CardTitle className="text-sm font-bold uppercase tracking-widest text-brand-navy/60 flex items-center gap-2">
                <Terminal className="h-3 w-3" />
                Live Events
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-5 px-0">
              {(liveEvents.length ? liveEvents : [{ time: "--:--:--", event: "Waiting for risk feed", status: "Success", info: "No events yet" }]).map((log, i) => (
                <div key={i} className="px-6 border-l-2 border-brand-teal/30 hover:bg-white/50 py-2 transition-colors">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className="font-mono text-[9px] text-brand-navy/30">{log.time}</span>
                    <Badge className={cn(
                      "text-[7px] border-none font-bold uppercase h-4 px-2",
                      log.status === "Blocked" ? "bg-red-500/10 text-red-500" :
                      log.status === "Flagged" ? "bg-amber-500/10 text-amber-500" : "bg-brand-teal/10 text-brand-teal"
                    )}>
                      {log.status}
                    </Badge>
                  </div>
                  <div className="text-[10px] font-bold text-brand-navy tracking-tight truncate">{log.event}</div>
                  <div className="text-[8px] font-medium text-brand-navy/40 truncate">{log.info}</div>
                </div>
              ))}
              <div className="px-6 pt-4">
                <Button variant="ghost" className="w-full text-[10px] font-bold label-caps h-8 hover:bg-brand-navy/5 text-brand-navy/30">
                  Download Event Log
                </Button>
              </div>
            </CardContent>
          </PremiumCard>

          <PremiumCard className="bg-red-500 border-none text-white shadow-lg">
            <CardContent className="p-6 space-y-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 flex items-center justify-center rounded-full bg-white/20">
                  <ShieldX className="h-5 w-5" />
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-white/60">Risk Spike</span>
                  <div className="text-xl font-bold tracking-tighter">Immediate Review Required</div>
                </div>
              </div>
              <p className="text-xs font-medium text-white/80 leading-relaxed">
                {riskStats?.suspicious_patterns[0]?.pattern
                  ? `${riskStats.suspicious_patterns[0].pattern} (${riskStats.suspicious_patterns[0].count}).`
                  : "No suspicious spikes detected in the latest aggregation window."}
              </p>
              <Button className="w-full bg-white text-red-500 font-bold label-caps hover:bg-white/90">
                Initiate Lockout
              </Button>
            </CardContent>
          </PremiumCard>
        </div>
      </div>
    </div>
  )
}
