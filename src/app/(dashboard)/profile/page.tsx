"use client"

import { useSearchParams } from "next/navigation"
import { useApiGet } from "@/hooks/use-api"
import { apiRequest } from "@/lib/api-client"
import { 
  UserProfileResponse, 
  TrustResultResponse, 
  EligibleResponse, 
  IdentityPathsResponse,
  TrustCardResponse
} from "@/types/api"
import { PremiumCard, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/common/premium-card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { 
  ShieldCheck, User, MapPin, Mail, Phone, Calendar, 
  ArrowLeft, Download, Shield, Fingerprint, Video, 
  Mic, CheckCircle2, Loader2, AlertCircle, TrendingUp,
  CreditCard, Plus
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useEffect, useState } from "react"

export default function UserDetailPage() {
  const searchParams = useSearchParams()
  const viewId = searchParams.get("view_id")

  // 1. Fetch Basic Profile
  const { data: profile, loading: profileLoading, error: profileError } = 
    useApiGet<UserProfileResponse>("/profile", { userId: viewId || undefined })

  // 2. Fetch Identity Paths
  const { data: identity, loading: identityLoading } = 
    useApiGet<IdentityPathsResponse>("/identity", { userId: viewId || undefined })

  // 3. Fetch Trust Results (POST)
  const [trust, setTrust] = useState<TrustResultResponse | null>(null)
  const [trustLoading, setTrustLoading] = useState(false)
  const [trustError, setTrustError] = useState<string | null>(null)

  // 4. Fetch Eligibility (POST)
  const [eligible, setEligible] = useState<EligibleResponse | null>(null)
  const [eligibleLoading, setEligibleLoading] = useState(false)

  // 5. Trust Card State
  const [trustCard, setTrustCard] = useState<TrustCardResponse | null>(null)
  const [isIssuingCard, setIsIssuingCard] = useState(false)

  useEffect(() => {
    if (viewId) {
      const getResults = async () => {
        setTrustLoading(true)
        try {
          const trustRes = await apiRequest<TrustResultResponse>("/trust-result", { method: "POST" }, viewId)
          setTrust(trustRes)
          
          setEligibleLoading(true)
          const eligibleRes = await apiRequest<EligibleResponse>("/eligible", { method: "POST" }, viewId)
          setEligible(eligibleRes)

          // Fetch Trust Card if exists
          try {
            const cardRes = await apiRequest<TrustCardResponse>("/trust-card", { method: "GET" }, viewId)
            setTrustCard(cardRes)
          } catch (e) {
            // No card yet, ignore 404
          }
        } catch (err: any) {
          setTrustError(err.message)
        } finally {
          setTrustLoading(false)
          setEligibleLoading(false)
        }
      }
      getResults()
    }
  }, [viewId])

  if (!viewId) {
    return (
      <div className="flex flex-col items-center justify-center p-20 text-brand-navy/40">
        <AlertCircle className="h-10 w-10 mb-4" />
        <h2 className="text-xl font-bold">No User Selected</h2>
        <p className="text-sm">Please select a user from the verification queue.</p>
        <Button onClick={() => window.location.href = '/verifications'} variant="outline" className="mt-6">
          Back to Queue
        </Button>
      </div>
    )
  }

  if (profileLoading || trustLoading) {
    return (
      <div className="p-40 flex flex-col items-center justify-center gap-4 text-brand-navy/40">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="text-sm font-bold uppercase tracking-widest">Generating Digital Trust Profile...</span>
      </div>
    )
  }

  if (profileError) {
    return (
      <div className="p-20 text-center space-y-4">
        <AlertCircle className="h-6 w-6 text-red-500 mx-auto" />
        <p className="text-brand-navy/60 font-medium">{profileError}</p>
        <Button onClick={() => window.location.reload()} variant="outline">Retry</Button>
      </div>
    )
  }

  return (
    <div className="space-y-10 pb-10">
      {/* breadcrumbs & Header */}
      <div className="space-y-4">
        <a href="/verifications" className="inline-flex items-center text-xs font-bold text-brand-teal uppercase tracking-widest hover:opacity-80">
          <ArrowLeft className="mr-2 h-3 w-3" />
          Back to Verification Queue
        </a>
        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div className="flex items-center gap-6">
            <div className="h-24 w-24 rounded-2xl bg-gradient-to-tr from-brand-navy to-blue-900 border-4 border-white shadow-ambient flex items-center justify-center text-white text-3xl font-bold">
              {profile?.full_name.split(' ').map(n => n[0]).join('')}
            </div>
            <div className="flex flex-col gap-1">
              <h1 className="text-4xl font-bold tracking-tight text-brand-navy">{profile?.full_name}</h1>
              <div className="flex items-center gap-3">
                <Badge className={cn(
                  "font-bold border-none",
                  trust?.combined.combined_score && trust.combined.combined_score > 80 ? "bg-brand-teal text-brand-navy-deep" : "bg-amber-500/20 text-amber-600"
                )}>
                  {trust?.combined.combined_score && trust.combined.combined_score > 80 ? "Verified Prime" : "In Review"}
                </Badge>
                <span className="text-xs text-brand-navy/40 font-medium">Internal Ref: {viewId.slice(0, 8)}</span>
              </div>
            </div>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" className="h-11 border-none bg-surface-container-highest/50 px-5 text-brand-navy/60 font-bold label-caps hover:bg-surface-container-highest">
              Add Investigation Note
            </Button>
            <Button className="h-11 border-none bg-brand-navy px-6 text-white font-bold label-caps hover:bg-brand-navy-deep">
              Approve Identity
            </Button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left Column: Personal Metadata */}
        <div className="lg:col-span-1 space-y-6">
          <PremiumCard>
            <CardHeader className="border-none">
              <CardTitle className="text-sm font-bold uppercase tracking-widest text-brand-navy/40">Core Metadata</CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              {[
                { icon: User, label: "Sex / Identity", value: profile?.sex },
                { icon: Calendar, label: "Date of Birth", value: profile?.date_of_birth || "Not Provided" },
                { icon: MapPin, label: "Nationality", value: profile?.nationality || "Not Provided" },
                { icon: Phone, label: "Contact Phone", value: profile?.phone },
                { icon: Shield, label: "Occupation", value: profile?.occupation },
                { icon: MapPin, label: "Business Sector", value: profile?.business_type },
              ].map((item, i) => (
                <div key={i} className="flex gap-4">
                  <div className="mt-1 flex h-8 w-8 items-center justify-center rounded-lg bg-surface-container-low">
                    <item.icon className="h-4 w-4 text-brand-navy/40" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-brand-navy/20">{item.label}</span>
                    <span className="text-sm font-bold text-brand-navy">{item.value}</span>
                  </div>
                </div>
              ))}
            </CardContent>
          </PremiumCard>

          <PremiumCard className="bg-gradient-to-br from-brand-navy to-brand-navy-deep text-white border-none shadow-ambient overflow-hidden relative">
            <div className="absolute top-0 right-0 p-4 opacity-10">
              <CreditCard className="h-24 w-24" />
            </div>
            <CardHeader className="border-none pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-xs font-bold uppercase tracking-widest text-brand-teal">Digital Trust Card</CardTitle>
                <Badge className="bg-brand-teal/20 text-brand-teal border-none text-[8px] font-bold">Demo Protocol</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-6 pt-4">
              {trustCard ? (
                <div className="space-y-4">
                  <div className="rounded-xl bg-white/5 p-4 border border-white/10 backdrop-blur-sm">
                    <div className="text-[10px] font-bold uppercase tracking-widest text-white/40 mb-3">Active Credential</div>
                    <div className="flex items-center justify-between">
                      <div className="font-mono text-lg tracking-[0.2em] font-bold">{trustCard.masked_number}</div>
                      <ShieldCheck className="h-5 w-5 text-brand-teal" />
                    </div>
                    <div className="mt-4 flex items-center justify-between">
                      <div className="flex flex-col">
                        <span className="text-[8px] font-bold uppercase text-white/20">Issued Score</span>
                        <span className="text-xs font-bold text-brand-teal">{trustCard.combined_score_at_issue}%</span>
                      </div>
                      <div className="flex flex-col items-end">
                        <span className="text-[8px] font-bold uppercase text-white/20">Suffix</span>
                        <span className="text-xs font-bold">{trustCard.card_suffix}</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-[10px] font-medium text-white/40 italic leading-relaxed">
                    This card represents a cryptographic proof of identity verified at the time of issuance.
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex flex-col items-center justify-center p-6 rounded-xl bg-white/5 border border-dashed border-white/10">
                    <CreditCard className="h-8 w-8 text-white/20 mb-3" />
                    <span className="text-xs font-medium text-white/40">No card issued for this identity</span>
                  </div>
                  <Button 
                    variant="secondary" 
                    className="w-full h-11 font-bold label-caps bg-brand-teal text-brand-navy hover:bg-brand-teal/90 disabled:opacity-50"
                    disabled={!trust?.combined.combined_score || trust.combined.combined_score <= 45 || isIssuingCard}
                    onClick={async () => {
                      setIsIssuingCard(true)
                      try {
                        const res = await apiRequest<TrustCardResponse>("/trust-card/issue", { method: "POST" }, viewId)
                        setTrustCard(res)
                      } catch (err) {
                        console.error("Failed to issue card", err)
                      } finally {
                        setIsIssuingCard(false)
                      }
                    }}
                  >
                    {isIssuingCard ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Plus className="h-4 w-4 mr-2" />}
                    Issue Trust Card
                  </Button>
                  {!trustCard && trust?.combined.combined_score !== undefined && trust.combined.combined_score <= 45 && (
                    <div className="flex items-center gap-2 text-[8px] font-bold uppercase text-red-400 justify-center">
                      <AlertCircle className="h-3 w-3" />
                      Score threshold (45%) not met
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </PremiumCard>
        </div>

        {/* Right Column: Deep-Dive Analysis */}
        <div className="lg:col-span-2 space-y-6">
          <PremiumCard>
            <CardHeader className="border-none">
              <CardTitle className="text-xl font-bold text-brand-navy">Biometric Verification Proofs</CardTitle>
              <CardDescription className="text-brand-navy/60 font-medium">Granular digital fiduciary verification results.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                {[
                  { icon: Fingerprint, label: "Government ID", score: trust?.combined.document_score, color: "text-brand-teal" },
                  { icon: Video, label: "Liveness Check", score: trust?.combined.video_score, color: "text-brand-teal" },
                  { icon: Mic, label: "Voice Print", score: trust?.combined.audio_score, color: "text-brand-teal" },
                ].map((bio, i) => (
                  <div key={i} className="flex flex-col items-center gap-3 rounded-2xl bg-surface-container-low/50 p-6 border-none hover:bg-surface-container-low transition-colors">
                    <div className={cn("flex h-12 w-12 items-center justify-center rounded-full bg-white shadow-sm", bio.color)}>
                      <bio.icon className="h-6 w-6" />
                    </div>
                    <div className="text-center space-y-1">
                      <h4 className="text-sm font-bold text-brand-navy">{bio.label}</h4>
                      <div className="flex flex-col gap-1 items-center">
                        <span className="text-[10px] font-bold text-brand-navy/30 uppercase tracking-tighter">
                          Match: {bio.score}%
                        </span>
                        <Badge className={cn(
                          "border-none text-[8px] font-bold uppercase h-5",
                          bio.score && bio.score > 70 ? "bg-brand-teal/10 text-brand-teal" : "bg-red-500/10 text-red-500"
                        )}>
                          {bio.score && bio.score > 70 ? "Verified" : "Low Match"}
                        </Badge>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </PremiumCard>

          <PremiumCard>
            <CardHeader className="border-none">
              <CardTitle className="text-xl font-bold text-brand-navy">Trust Factor Breakdown</CardTitle>
              <CardDescription className="text-brand-navy/60 font-medium">Weighted analysis of user credibility.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-8 py-6">
              {[
                { label: "Document Verification", value: trust?.combined.document_score, modality: trust?.document },
                { label: "Biometric Liveness", value: trust?.combined.video_score, modality: trust?.video },
                { label: "Voice Authentication", value: trust?.combined.audio_score, modality: trust?.audio },
              ].map((factor, i) => (
                <div key={i} className="relative space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                       <CheckCircle2 className="h-4 w-4 text-brand-teal" />
                       <span className="text-sm font-bold text-brand-navy">{factor.label}</span>
                    </div>
                    <span className="text-sm font-mono font-bold text-brand-navy">{factor.value}%</span>
                  </div>
                  <div className="h-4 w-full bg-surface-container-highest rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-brand-navy to-brand-teal transition-all duration-1000"
                      style={{ width: `${factor.value}%` }}
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {factor.modality?.criteria.map((c, ci) => (
                      <div key={ci} className="flex items-center gap-2">
                        <div className={cn(
                          "h-1 w-1 rounded-full",
                          c.status === "pass" ? "bg-brand-teal" : "bg-red-500"
                        )} />
                        <span className="text-[9px] font-medium text-brand-navy/60 uppercase">{c.label}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </CardContent>
          </PremiumCard>
        </div>
      </div>
    </div>
  )
}
