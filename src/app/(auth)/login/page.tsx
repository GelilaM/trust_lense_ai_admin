"use client";

import * as React from "react";
import Image from "next/image";
import { Eye, EyeOff } from "lucide-react";
import { PremiumCard, CardContent } from "@/components/common/premium-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import { useRouter } from "next/navigation";
import { useApiMutation } from "@/hooks/use-api";
import { authStore } from "@/lib/auth-store";
import { UserProfileResponse } from "@/types/api";

export default function LoginPage() {
  const router = useRouter();
  const [phone, setPhone] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [showPassword, setShowPassword] = React.useState(false);

  const {
    mutate: signIn,
    loading,
    error: apiError,
  } = useApiMutation<any, UserProfileResponse>("/auth/sign-in");

  const handleSignIn = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    try {
      const user = await signIn({ phone, password });
      authStore.setUserId(user.id);
      router.push("/dashboard");
    } catch (err) {
      // Error is handled by useApiMutation
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-blue-50 to-white p-4">
      <div className="w-full max-w-md space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
        {/* Logo Section */}
        <div className="flex flex-col items-center gap-4">
          <Image
            src="/Kifiya_Full_Color.svg"
            alt="Kifiya"
            width={591}
            height={250}
            priority
            className="h-14 w-auto max-w-[min(100%,280px)] object-contain sm:h-16"
          />
          <h1 className="text-2xl font-bold tracking-tight text-brand-navy">
            TrustLens AI
          </h1>
        </div>

        {/* Login Card */}
        <PremiumCard className="border-none shadow-2xl shadow-blue-900/5">
          <CardContent className="space-y-6 pt-10 px-8 pb-10">
            <div className="space-y-2 text-center">
              <h2 className="text-2xl font-bold tracking-tight text-brand-navy">
                Sign in to TrustLens AI
              </h2>
              <p className="text-sm font-medium text-brand-navy/40">
                Enter your credentials to access your secure dashboard
              </p>
            </div>

            <form onSubmit={handleSignIn} className="space-y-4">
              {apiError && (
                <div className="p-3 rounded-lg bg-red-50 text-red-600 text-xs font-bold text-center animate-in fade-in zoom-in duration-300">
                  {apiError}
                </div>
              )}

              <div className="space-y-2">
                <label className="text-sm font-bold text-brand-navy/60 label-caps">
                  Phone Number
                </label>
                <Input
                  type="text"
                  placeholder="0911223344"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="h-12 border-none bg-surface-container-low focus-visible:ring-brand-teal/20"
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-bold text-brand-navy/60 label-caps">
                    Password
                  </label>
                  <a
                    href="#"
                    className="text-xs font-bold text-brand-teal hover:underline underline-offset-4"
                  >
                    Forgot password?
                  </a>
                </div>
                <div className="relative">
                  <Input
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="current-password"
                    className="h-12 border-none bg-surface-container-low pr-12 focus-visible:ring-brand-teal/20"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((s) => !s)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1 text-brand-navy/40 outline-none transition-colors hover:text-brand-navy/70 focus-visible:ring-2 focus-visible:ring-brand-teal/30"
                    aria-label={
                      showPassword ? "Hide password" : "Show password"
                    }
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" aria-hidden />
                    ) : (
                      <Eye className="h-4 w-4" aria-hidden />
                    )}
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="remember"
                  className="h-4 w-4 rounded border-gray-300 text-brand-teal focus:ring-brand-teal"
                />
                <label
                  htmlFor="remember"
                  className="text-sm font-medium text-brand-navy/60"
                >
                  Remember me
                </label>
              </div>

              <Button
                type="submit"
                disabled={loading || !phone || !password}
                className="h-12 w-full bg-brand-navy text-base font-bold text-white shadow-lg transition-all hover:bg-brand-navy/90 active:scale-[0.98] disabled:opacity-50"
              >
                {loading ? "Authenticating..." : "Sign In"}
              </Button>
            </form>

            {/* <div className="relative pt-4">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-brand-navy/5" />
              </div>
              <div className="relative flex justify-center text-xs uppercase tracking-widest font-bold text-brand-navy/20">
                <span className="bg-white px-4">Or continue with</span>
              </div>
            </div>

            <Button variant="outline" className="h-12 w-full border-none bg-surface-container-highest/30 text-base font-bold text-brand-navy transition-all hover:bg-surface-container-highest/50">
              <Key className="mr-2 h-4 w-4" />
              Single Sign-On (SSO)
            </Button> */}
          </CardContent>
        </PremiumCard>

        {/* Footer Links */}
        <div className="flex items-center justify-center gap-6 text-[11px] font-bold uppercase tracking-widest text-brand-navy/30">
          <a href="#" className="hover:text-brand-teal transition-colors">
            Privacy Policy
          </a>
          <a href="#" className="hover:text-brand-teal transition-colors">
            Terms of Service
          </a>
          <a href="#" className="hover:text-brand-teal transition-colors">
            Contact Support
          </a>
        </div>
      </div>
    </div>
  );
}
