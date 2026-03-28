import { DashboardStatsResponse, RiskStatsResponse } from "../types/api";

const API_BASE_URL = "http://192.168.7.180:8000";

export async function apiRequest<T>(
  path: string,
  options: RequestInit = {},
  userId?: string,
): Promise<T> {
  const url = new URL(`${API_BASE_URL}${path}`);
  if (userId) {
    url.searchParams.append("user_id", userId);
  }

  const response = await fetch(url.toString(), {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      errorData.detail || `API request failed with status ${response.status}`,
    );
  }

  return response.json();
}

export async function apiUpload<T>(
  path: string,
  formData: FormData,
  userId?: string,
): Promise<T> {
  const url = new URL(`${API_BASE_URL}${path}`);
  if (userId) {
    url.searchParams.append("user_id", userId);
  }

  const response = await fetch(url.toString(), {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      errorData.detail || `API upload failed with status ${response.status}`,
    );
  }

  return response.json();
}

export async function getStatsOverview(
  userId: string,
): Promise<DashboardStatsResponse> {
  return apiRequest<DashboardStatsResponse>("/stats/overview", {}, userId);
}

export async function getRiskStats(userId: string): Promise<RiskStatsResponse> {
  return apiRequest<RiskStatsResponse>("/stats/risk", {}, userId);
}
