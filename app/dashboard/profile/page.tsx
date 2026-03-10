// SETUP: Create a public bucket called "avatars" in Supabase Storage
// Storage → New Bucket → Name: avatars → Public: true

"use client";

import { useState, useEffect, useTransition } from "react";
import { toast } from "sonner";
import {
  Pencil,
  Clock,
  User,
  IdCard,
  Mail,
  Phone,
  Building2,
  ChevronDown,
  Lock,
  ShieldCheck,
  MessageSquare,
  Monitor,
  Smartphone,
  Laptop,
  LogOut,
  Ban,
  BellRing,
  Loader2,
  Upload,
  Camera,
} from "lucide-react";
import {
  getUser,
  updateProfile,
  uploadAvatar,
  updatePassword,
} from "@/lib/supabase/auth-actions";
import { createClient } from "@/lib/supabase/client";

export default function UserProfilePage() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [department, setDepartment] = useState("Security Operations");
  const [loaded, setLoaded] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isPending, startTransition] = useTransition();
  const [sessionInfo, setSessionInfo] = useState<{ created_at: string } | null>(
    null,
  );

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) {
        const session = data.session as any;
        const dt = session.created_at
          ? new Date(session.created_at * 1000)
          : new Date(session.user.created_at);
        setSessionInfo({ created_at: dt.toLocaleString() });
      }
    });
  }, []);

  useEffect(() => {
    getUser().then((user) => {
      if (user) {
        setFullName(user.fullName);
        setEmail(user.email);
        setPhone(user.phone);
        setDepartment(user.department);
        if (user.avatarUrl) setAvatarUrl(user.avatarUrl);
      }
      setLoaded(true);
    });
  }, []);

  useEffect(() => {
    return () => {
      if (previewImage) URL.revokeObjectURL(previewImage);
    };
  }, [previewImage]);

  const getInitials = () => {
    if (fullName) return fullName.charAt(0).toUpperCase();
    if (email) return email.charAt(0).toUpperCase();
    return "?";
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Show local preview immediately
    const localUrl = URL.createObjectURL(file);
    setPreviewImage(localUrl);

    // Upload to Supabase Storage
    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append("avatar", file);
      const result = await uploadAvatar(formData);

      if (result?.error) {
        toast.error(result.error);
        setPreviewImage(null);
      } else {
        toast.success("Avatar uploaded successfully!");
        if (result?.avatarUrl) setAvatarUrl(result.avatarUrl);
        setPreviewImage(null); // Use the real URL now
      }
    } catch {
      toast.error("Failed to upload avatar.");
      setPreviewImage(null);
    } finally {
      setIsUploading(false);
    }
  };

  const handleSave = () => {
    startTransition(async () => {
      const result = await updateProfile({
        fullName,
        phone,
        department,
      });
      if (result?.error) {
        toast.error(result.error);
      } else {
        toast.success("Profile information synchronized.");
        window.dispatchEvent(new Event("profile-updated"));
      }
    });
  };

  const handlePasswordChange = () => {
    if (!newPassword || !confirmPassword) {
      toast.error("Please fill in both password fields.");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match.");
      return;
    }
    if (newPassword.length < 6) {
      toast.error("Password must be at least 6 characters.");
      return;
    }

    startTransition(async () => {
      const result = await updatePassword(newPassword);
      if (result?.error) {
        toast.error(result.error);
      } else {
        toast.success("Password updated successfully.");
        setNewPassword("");
        setConfirmPassword("");
      }
    });
  };

  if (!loaded) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-teal-500" />
      </div>
    );
  }

  const displayAvatar = previewImage || avatarUrl;

  return (
    <div className="bg-[#0a0f1e] text-white font-sans min-h-screen w-full">
      {/* Scrollable Content Area */}
      <div className="w-full max-w-5xl mx-auto space-y-8 pb-12 p-6 md:p-10">
        {/* Profile Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-2 border-b border-slate-800">
          <div className="flex items-center gap-6">
            <div className="relative group">
              <div className="w-24 h-24 rounded-full bg-slate-900 border-4 border-slate-800 shadow-sm flex items-center justify-center overflow-hidden relative">
                {displayAvatar ? (
                  <img
                    src={displayAvatar}
                    alt="Profile"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-3xl font-bold text-teal-400">
                    {getInitials()}
                  </span>
                )}
                {isUploading && (
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center rounded-full">
                    <Loader2 className="w-6 h-6 animate-spin text-white" />
                  </div>
                )}
              </div>
              <label className="absolute bottom-0 right-0 w-8 h-8 bg-slate-900 border border-slate-700 rounded-full flex items-center justify-center text-slate-400 hover:text-teal-400 hover:border-teal-500/50 shadow-sm hover:shadow-md transition-all cursor-pointer">
                <Camera className="w-4 h-4" />
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleImageUpload}
                  disabled={isUploading}
                />
              </label>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">
                {fullName || "Your Profile"}
              </h1>
              <p className="text-slate-400 font-medium">{department}</p>
              <div className="flex items-center gap-2 mt-2 text-sm text-green-400 font-medium">
                <div className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400/50 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-green-400"></span>
                </div>
                <span>Session active</span>
              </div>
            </div>
          </div>
          <div className="flex flex-wrap gap-3 w-full md:w-auto">
            <button
              onClick={handleSave}
              disabled={isPending}
              className="flex-1 md:flex-none px-6 py-2.5 bg-teal-500 hover:bg-teal-400 text-white rounded-lg text-sm font-bold transition-all flex justify-center items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed border-none"
            >
              {isPending && <Loader2 className="w-4 h-4 animate-spin" />}
              {isPending ? "Saving…" : "Save Changes"}
            </button>
          </div>
        </div>

        {/* Personal Information Card */}
        <section className="bg-[#0f1629] rounded-xl border border-slate-800 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-800 bg-slate-900/50 flex justify-between items-center">
            <div>
              <h2 className="text-lg font-semibold text-white">
                Personal Information
              </h2>
              <p className="text-sm text-slate-400">
                Manage your personal details and contact preferences.
              </p>
            </div>
            <User className="w-6 h-6 text-slate-400" />
          </div>
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-1">
              <label className="text-sm font-medium text-slate-400">
                Full Name
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-teal-400">
                  <IdCard className="w-5 h-5" />
                </span>
                <input
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-900 border-slate-700 text-white placeholder:text-slate-500 focus:border-teal-500 focus:ring-1 focus:ring-teal-500/20 border rounded-lg text-sm outline-none"
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium text-slate-400">
                Email Address
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-teal-400">
                  <Mail className="w-5 h-5" />
                </span>
                <input
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-lg text-sm text-slate-500 cursor-not-allowed outline-none"
                  type="email"
                  value={email}
                  disabled
                  title="Email cannot be changed here"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium text-slate-400">
                Phone Number
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-teal-400">
                  <Phone className="w-5 h-5" />
                </span>
                <input
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-900 border-slate-700 text-white placeholder:text-slate-500 focus:border-teal-500 focus:ring-1 focus:ring-teal-500/20 border rounded-lg text-sm outline-none"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+1 (555) 000-0000"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium text-slate-400">
                Department
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-teal-400">
                  <Building2 className="w-5 h-5" />
                </span>
                <select
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-900 border-slate-700 text-white placeholder:text-slate-500 focus:border-teal-500 focus:ring-1 focus:ring-teal-500/20 border rounded-lg text-sm appearance-none outline-none"
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                >
                  <option>Security Operations</option>
                  <option>IT Administration</option>
                  <option>Executive</option>
                  <option>Engineering</option>
                </select>
                <span className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-slate-400">
                  <ChevronDown className="w-5 h-5" />
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* Change Password Card */}
        <section className="bg-[#0f1629] rounded-xl border border-slate-800 overflow-hidden flex flex-col">
          <div className="px-6 py-4 border-b border-slate-800 bg-slate-900/50 flex justify-between items-center">
            <div>
              <h2 className="text-lg font-semibold text-white">
                Change Password
              </h2>
              <p className="text-sm text-slate-400">
                Ensure your account is using a long, random password.
              </p>
            </div>
            <Lock className="w-5 h-5 text-slate-400" />
          </div>
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6 items-end">
            <div className="space-y-1">
              <label className="text-sm font-medium text-slate-400">
                New Password
              </label>
              <input
                className="w-full px-4 py-2.5 bg-slate-900 border-slate-700 text-white placeholder:text-slate-500 focus:border-teal-500 focus:ring-1 focus:ring-teal-500/20 border rounded-lg text-sm outline-none"
                type="password"
                placeholder="••••••••"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium text-slate-400">
                Confirm Password
              </label>
              <input
                className="w-full px-4 py-2.5 bg-slate-900 border-slate-700 text-white placeholder:text-slate-500 focus:border-teal-500 focus:ring-1 focus:ring-teal-500/20 border rounded-lg text-sm outline-none"
                type="password"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </div>
            <div className="md:col-span-2 flex justify-start">
              <button
                onClick={handlePasswordChange}
                disabled={isPending || !newPassword || !confirmPassword}
                className="px-6 py-2.5 bg-teal-500 hover:bg-teal-400 text-white rounded-lg text-sm font-bold transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed border-none"
              >
                {isPending && newPassword ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Lock className="w-4 h-4" />
                )}
                Update Password
              </button>
            </div>
          </div>
        </section>

        {/* Security Settings Group */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 2FA Card Replacement */}
          <section className="lg:col-span-2 bg-[#0f1629] rounded-xl border border-slate-800 overflow-hidden flex flex-col">
            <div className="px-6 py-4 border-b border-slate-800 bg-slate-900/50 flex justify-between items-center">
              <div>
                <h2 className="text-lg font-semibold text-white">
                  Two-Factor Authentication
                </h2>
                <p className="text-sm text-slate-400">
                  Secure your account with an extra layer of protection.
                </p>
              </div>
              <Lock className="w-5 h-5 text-slate-400" />
            </div>
            <div className="p-6 flex-1 flex items-center justify-center text-center">
              <p className="text-slate-400 font-medium">
                Two-factor authentication is managed through your Supabase
                account settings.
              </p>
            </div>
          </section>

          {/* Session Management Card */}
          <section className="bg-[#0f1629] rounded-xl border border-slate-800 overflow-hidden flex flex-col">
            <div className="px-6 py-4 border-b border-slate-800 bg-slate-900/50">
              <h2 className="text-lg font-semibold text-white">
                Active Sessions
              </h2>
              <p className="text-sm text-slate-400">
                Devices logged into your account.
              </p>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center text-green-400">
                  <Monitor className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white flex items-center gap-2">
                    Current Device
                    <span className="w-2 h-2 rounded-full bg-green-400"></span>
                  </p>
                  <p className="text-xs text-green-400 font-bold tracking-tight uppercase">
                    Active now
                  </p>
                </div>
              </div>

              {sessionInfo ? (
                <p className="text-sm text-slate-400 font-medium pt-2 border-t border-slate-800">
                  Session started:{" "}
                  <span className="text-white font-semibold">
                    {sessionInfo.created_at}
                  </span>
                </p>
              ) : (
                <div className="flex justify-center pt-2">
                  <Loader2 className="w-4 h-4 animate-spin text-teal-500" />
                </div>
              )}
            </div>
            <div className="mt-auto px-6 py-4 bg-slate-900/50 border-t border-slate-800 flex flex-col gap-3">
              <button
                onClick={async () => {
                  const supabase = createClient();
                  await supabase.auth.signOut({ scope: "local" });
                  window.location.href = "/auth/login";
                }}
                className="w-full py-2 border border-slate-700 bg-transparent rounded-lg text-sm font-bold text-slate-300 hover:border-slate-500 hover:text-white transition-colors flex items-center justify-center gap-2"
              >
                <LogOut className="w-4 h-4" />
                Logout This Device
              </button>
              <button
                onClick={async () => {
                  const supabase = createClient();
                  await supabase.auth.signOut({ scope: "global" });
                  window.location.href = "/auth/login";
                }}
                className="w-full py-2 border border-red-500/20 bg-red-500/10 rounded-lg text-sm font-bold text-red-400 hover:bg-red-500/20 transition-colors flex items-center justify-center gap-2"
              >
                <Ban className="w-4 h-4" />
                Logout All Devices
              </button>
            </div>
          </section>
        </div>

        {/* Danger Zone */}
        <div className="pt-6">
          <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <h3 className="text-base font-semibold text-red-400">
                Delete Account
              </h3>
              <p className="text-sm text-red-400/80 mt-1">
                Once you delete your account, there is no going back. Please be
                certain.
              </p>
            </div>
            <button
              onClick={() =>
                toast.error("Account termination workflow initiated.")
              }
              className="px-4 py-2 bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg text-sm font-medium hover:bg-red-500/20 hover:text-red-300 transition-colors whitespace-nowrap"
            >
              Delete Account
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
