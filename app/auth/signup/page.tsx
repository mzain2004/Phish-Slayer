"use client";

import { useEffect, useState, useTransition } from "react";
import { toast } from "sonner";
import Link from "next/link";
import {
  ShieldAlert,
  Mail,
  Lock,
  Eye,
  EyeOff,
  User,
  Building2,
  ArrowRight,
  CheckCircle2,
  Github,
  Loader2,
} from "lucide-react";
import { signUpWithEmail, signInWithSocial } from "@/lib/supabase/auth-actions";

export default function SignupPage() {
  const [fullName, setFullName] = useState("");
  const [orgName, setOrgName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleEmailSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      const result = await signUpWithEmail({
        email,
        password,
        fullName,
        orgName,
      });
      if (result?.error) {
        toast.error(result.error);
      } else if (result?.success) {
        toast.success(result.success);
      }
    });
  };

  const handleSocial = (provider: "google" | "github") => {
    startTransition(async () => {
      const result = await signInWithSocial(provider);
      if (result?.error) {
        toast.error(result.error);
      }
    });
  };

  return (
    <div className="flex min-h-screen w-full bg-[#fafafa] font-sans text-slate-900">
      {/* Left — Brand Panel */}
      <div className="hidden lg:flex lg:w-[45%] xl:w-[42%] relative flex-col justify-between bg-slate-950 text-white overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-900 to-teal-900 opacity-80" />
        <div className="absolute -top-32 -left-32 w-[30rem] h-[30rem] bg-teal-500/10 rounded-full blur-[100px]" />
        <div className="absolute bottom-0 right-0 w-[20rem] h-[20rem] bg-cyan-500/10 rounded-full blur-[80px]" />

        <div className="relative z-10 flex flex-col justify-between h-full px-12 py-14">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 backdrop-blur-md">
              <ShieldAlert className="w-6 h-6 text-teal-400" />
            </div>
            <span className="text-xl font-bold tracking-tight text-white">
              Phish-Slayer
            </span>
          </div>

          <div className="max-w-md">
            <h1 className="text-4xl xl:text-5xl font-black leading-[1.1] tracking-tight mb-6">
              Start defending your domain today.
            </h1>
            <p className="text-teal-50/70 text-base leading-relaxed mb-4">
              Set up your free enterprise security account in under 60 seconds.
            </p>
          </div>

          <p className="text-xs text-slate-500 font-medium">
            © {mounted ? new Date().getFullYear() : "-"} Phish-Slayer Enterprise
            Security
          </p>
        </div>
      </div>

      {/* Right — Signup Form */}
      <div className="flex-1 flex items-center justify-center px-6 py-12 sm:px-12">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="flex items-center gap-3 mb-10 lg:hidden">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900 text-teal-400">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <span className="text-xl font-bold tracking-tight text-slate-900">
              Phish-Slayer
            </span>
          </div>

          <div className="mb-8">
            <h2 className="text-2xl font-bold text-slate-900 tracking-tight mb-2">
              Create your account
            </h2>
            <p className="text-sm text-slate-500">
              Get started with enterprise-grade phishing protection.
            </p>
          </div>

          {/* Social Buttons */}
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              type="button"
              disabled={isPending}
              onClick={() => handleSocial("google")}
              className="flex flex-1 items-center justify-center gap-3 rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50 hover:border-slate-300 transition-all disabled:opacity-50"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
                  fill="#4285F4"
                />
                <path
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  fill="#34A853"
                />
                <path
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  fill="#FBBC05"
                />
                <path
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  fill="#EA4335"
                />
              </svg>
              Google
            </button>
            <button
              type="button"
              disabled={isPending}
              onClick={() => handleSocial("github")}
              className="flex flex-1 items-center justify-center gap-3 rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50 hover:border-slate-300 transition-all disabled:opacity-50"
            >
              <Github className="w-5 h-5" />
              GitHub
            </button>
          </div>

          {/* Divider */}
          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-[#fafafa] px-4 text-slate-400 font-medium uppercase tracking-wider">
                or create with email
              </span>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleEmailSubmit} className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="fullName"
                  className="block text-sm font-semibold text-slate-700 mb-1.5"
                >
                  Full name
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                    <User className="w-4 h-4" />
                  </span>
                  <input
                    id="fullName"
                    name="fullName"
                    type="text"
                    autoComplete="name"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    disabled={isPending}
                    placeholder="Alex Morgan"
                    className="block w-full rounded-lg border border-slate-200 bg-white py-3 pl-10 pr-4 text-sm text-slate-900 placeholder:text-slate-400 shadow-sm focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition-colors disabled:opacity-50"
                  />
                </div>
              </div>
              <div>
                <label
                  htmlFor="orgName"
                  className="block text-sm font-semibold text-slate-700 mb-1.5"
                >
                  Organization
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                    <Building2 className="w-4 h-4" />
                  </span>
                  <input
                    id="orgName"
                    name="orgName"
                    type="text"
                    autoComplete="organization"
                    value={orgName}
                    onChange={(e) => setOrgName(e.target.value)}
                    disabled={isPending}
                    placeholder="Acme Corp"
                    className="block w-full rounded-lg border border-slate-200 bg-white py-3 pl-10 pr-4 text-sm text-slate-900 placeholder:text-slate-400 shadow-sm focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition-colors disabled:opacity-50"
                  />
                </div>
              </div>
            </div>

            <div>
              <label
                htmlFor="email"
                className="block text-sm font-semibold text-slate-700 mb-1.5"
              >
                Work email
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                  <Mail className="w-4 h-4" />
                </span>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isPending}
                  placeholder="alex@acme-corp.com"
                  className="block w-full rounded-lg border border-slate-200 bg-white py-3 pl-10 pr-4 text-sm text-slate-900 placeholder:text-slate-400 shadow-sm focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition-colors disabled:opacity-50"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-semibold text-slate-700 mb-1.5"
              >
                Password
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                  <Lock className="w-4 h-4" />
                </span>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  required
                  minLength={8}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isPending}
                  placeholder="Min. 8 characters"
                  className="block w-full rounded-lg border border-slate-200 bg-white py-3 pl-10 pr-12 text-sm text-slate-900 placeholder:text-slate-400 shadow-sm focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition-colors disabled:opacity-50"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
              {password.length > 0 && (
                <div className="mt-2 flex gap-1.5">
                  <div
                    className={`h-1 flex-1 rounded-full transition-colors ${password.length >= 1 ? (password.length >= 8 ? "bg-emerald-500" : "bg-orange-400") : "bg-slate-200"}`}
                  />
                  <div
                    className={`h-1 flex-1 rounded-full transition-colors ${password.length >= 6 ? (password.length >= 10 ? "bg-emerald-500" : "bg-orange-400") : "bg-slate-200"}`}
                  />
                  <div
                    className={`h-1 flex-1 rounded-full transition-colors ${password.length >= 10 ? "bg-emerald-500" : "bg-slate-200"}`}
                  />
                </div>
              )}
            </div>

            <div className="flex items-start gap-2">
              <input
                id="terms"
                name="terms"
                type="checkbox"
                required
                className="mt-0.5 h-4 w-4 rounded border-slate-300 text-teal-600 focus:ring-teal-500"
              />
              <label
                htmlFor="terms"
                className="text-sm text-slate-500 leading-snug"
              >
                I agree to the{" "}
                <a
                  href="#"
                  className="font-semibold text-teal-600 hover:text-teal-500 transition-colors"
                >
                  Terms of Service
                </a>{" "}
                and{" "}
                <a
                  href="#"
                  className="font-semibold text-blue-600 hover:text-blue-700 transition-colors"
                >
                  Privacy Policy
                </a>
              </label>
            </div>

            <button
              type="submit"
              disabled={isPending}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-teal-400 to-blue-500 px-4 py-3 text-sm font-bold text-white shadow-lg hover:shadow-cyan-500/25 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed border-none"
            >
              {isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <ArrowRight className="w-4 h-4" />
              )}
              {isPending ? "Creating account…" : "Create account"}
            </button>
          </form>

          <p className="mt-8 text-center text-sm text-slate-500">
            Already have an account?{" "}
            <Link
              href="/auth/login"
              className="font-semibold text-teal-600 hover:text-teal-500 transition-colors"
            >
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
