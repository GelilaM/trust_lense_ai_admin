import { useState, useEffect, useCallback } from "react";
import { apiRequest } from "@/lib/api-client";
import { authStore } from "@/lib/auth-store";

export function useApiGet<T>(path: string, options: { enabled?: boolean; userId?: string } = {}) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(options.enabled !== false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    const userId = options.userId || authStore.getUserId();
    if (!userId) {
      setError("Not authenticated");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const result = await apiRequest<T>(path, {}, userId);
      setData(result);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [path, options.userId]);

  useEffect(() => {
    if (options.enabled !== false) {
      fetchData();
    }
  }, [fetchData, options.enabled]);

  return { data, loading, error, refresh: fetchData };
}

export function useApiMutation<TReq, TRes>(
  path: string,
  method: "POST" | "PUT" | "DELETE" = "POST",
  options: { userId?: string } = {}
) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const mutate = async (body?: TReq): Promise<TRes> => {
    const userId = options.userId || authStore.getUserId() || undefined;
    setLoading(true);
    setError(null);
    try {
      const result = await apiRequest<TRes>(
        path,
        {
          method,
          body: body ? JSON.stringify(body) : undefined,
        },
        userId
      );
      return result;
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { mutate, loading, error };
}

