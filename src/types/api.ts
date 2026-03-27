export type UserProfileResponse = {
  id: string; // UUID
  full_name: string;
  phone: string;
  sex: string;
  date_of_birth: string | null; // ISO date
  nationality: string | null;
  occupation: string;
  business_type: string;
  monthly_income: number;
}

export type RegisteredUsersResponse = {
  total: number;
  limit: number;
  offset: number;
  users: UserProfileResponse[];
}

export type IdentitySubmissionMetaResponse = {
  id: string;
  user_id: string;
  created_at: string;
  document_front_content_type: string | null;
  document_back_content_type: string | null;
  video_content_type: string | null;
  sound_content_type: string | null;
  document_front_size_bytes: number | null;
  document_back_size_bytes: number | null;
  video_size_bytes: number | null;
  sound_size_bytes: number | null;
  eligible: boolean;
  eligibility_reasons: string[];
  trust_score: number | null;
  risk_level: string | null;
  trust_reasons: string[];
}

export type RequirementCheck = {
  key: string;
  label: string;
  status: "pass" | "fail" | "uncertain";
  score: number;
  detail: string;
}

export type ModalityTrustBreakdown = {
  modality: "document" | "video" | "audio";
  criteria: RequirementCheck[];
  section_score: number;
}

export type CombinedTrustBreakdown = {
  document_score: number;
  video_score: number;
  audio_score: number;
  combined_score: number;
}

export type TrustResultResponse = {
  submission_id: string;
  document: ModalityTrustBreakdown;
  video: ModalityTrustBreakdown;
  audio: ModalityTrustBreakdown;
  combined: CombinedTrustBreakdown;
}

export type EligibilityMetrics = {
  modality_min_score: number;
  modality_max_score: number;
  modality_spread: number;
  weakest_modality: "document" | "video" | "audio";
  strongest_modality: "document" | "video" | "audio";
}

export type EligibleResponse = {
  submission_id: string;
  document_score: number;
  video_score: number;
  audio_score: number;
  combined_score: number;
  loan_tier: string;
  loan_offer: string;
  eligible_for_loan: boolean;
  eligible_for_device_financing: boolean;
  device_financing_offer: string;
  eligible_for_credit_card: boolean;
  credit_card_offer: string;
  metrics: EligibilityMetrics;
}

export type AuthErrorResponse = {
  detail: string;
}

export type ValidationErrorResponse = {
  detail: Array<{
    loc: (string | number)[];
    msg: string;
    type: string;
  }>;
}

export type IdentityPathsResponse = {
  user_id: string;
  submission_id: string;
  media: {
    document_front_path: string | null;
    document_back_path: string | null;
    video_path: string | null;
    sound_path: string | null;
  };
}

export type TrustCardProductOption = {
  key: "loan" | "device_financing" | "invoice_financing";
  label: string;
  description: string;
}

export type TrustCardResponse = {
  id: string;
  user_id: string;
  submission_id: string | null;
  combined_score_at_issue: number;
  masked_number: string;
  card_suffix: string;
  selected_product: "loan" | "device_financing" | "invoice_financing" | null;
  available_products: TrustCardProductOption[];
  created_at: string;
}

export type TrustCardSelectRequest = {
  product: "loan" | "device_financing" | "invoice_financing";
}

export type VerificationDayVolume = {
  date: string; // ISO date YYYY-MM-DD
  count: number;
}

export type ModalityHealth = {
  document_pass_rate_pct: number;
  video_pass_rate_pct: number;
  audio_pass_rate_pct: number;
}

export type DashboardStatsResponse = {
  total_users: number;
  verified_prime_count: number;
  global_trust_score: number;
  verification_volume_7d: VerificationDayVolume[];
  modality_health: ModalityHealth;
}

export type RiskBucket = {
  level: "critical" | "high" | "medium" | "low";
  count: number;
}

export type SuspiciousPattern = {
  pattern: string;
  count: number;
}

export type RiskStatsResponse = {
  active_alerts: number;
  risk_distribution: RiskBucket[];
  suspicious_patterns: SuspiciousPattern[];
}
