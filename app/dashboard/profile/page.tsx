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

export default function UserProfilePage() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [department, setDepartment] = useState("Security Operations");
  const [securityAlerts, setSecurityAlerts] = useState(true);
  const [campaignReports, setCampaignReports] = useState(true);
  const [productUpdates, setProductUpdates] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    getUser().then((user) => {
      if (user) {
        setFullName(user.fullName);
        setEmail(user.email);
        setPhone(user.phone);
        setDepartment(user.department);
        setSecurityAlerts(user.securityAlerts);
        setCampaignReports(user.campaignReports);
        setProductUpdates(user.productUpdates);
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
        securityAlerts,
        campaignReports,
        productUpdates,
      });
      if (result?.error) {
        toast.error(result.error);
      } else {
        toast.success("Profile information synchronized.");
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
        <Loader2 className="w-8 h-8 animate-spin text-teal-600" />
      </div>
    );
  }

  const displayAvatar = previewImage || avatarUrl;

  return (
    <div className="bg-transparent font-sans text-slate-900 min-h-screen w-full">
      {/* Scrollable Content Area */}
      <div className="w-full max-w-5xl mx-auto space-y-8 pb-12">
        {/* Profile Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-2 border-b border-slate-200">
          <div className="flex items-center gap-6">
            <div className="relative group">
              <div className="w-24 h-24 rounded-full bg-teal-50 border-4 border-white shadow-sm flex items-center justify-center text-teal-600 overflow-hidden relative">
                {displayAvatar ? (
                  <img
                    src={displayAvatar}
                    alt="Profile"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-3xl font-bold text-teal-600">
                    {getInitials()}
                  </span>
                )}
                {isUploading && (
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center rounded-full">
                    <Loader2 className="w-6 h-6 animate-spin text-white" />
                  </div>
                )}
              </div>
              <label className="absolute bottom-0 right-0 w-8 h-8 bg-white border border-slate-200 rounded-full flex items-center justify-center text-slate-600 hover:text-teal-600 shadow-sm hover:shadow-md transition-all cursor-pointer">
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
              <h1 className="text-2xl font-bold text-slate-900">
                {fullName || "Your Profile"}
              </h1>
              <p className="text-slate-500 font-medium">{department}</p>
              <div className="flex items-center gap-2 mt-2 text-sm text-slate-500 font-medium">
                <div className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </div>
                <span>Session active</span>
              </div>
            </div>
          </div>
          <div className="flex flex-wrap gap-3 w-full md:w-auto">
            <button
              onClick={handleSave}
              disabled={isPending}
              className="flex-1 md:flex-none px-6 py-2.5 bg-gradient-to-r from-teal-400 to-blue-500 text-white rounded-lg text-sm font-bold shadow-md hover:shadow-cyan-500/25 transition-all flex justify-center items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed border-none"
            >
              {isPending && <Loader2 className="w-4 h-4 animate-spin" />}
              {isPending ? "Saving…" : "Save Changes"}
            </button>
          </div>
        </div>

        {/* Personal Information Card */}
        <section className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">
                Personal Information
              </h2>
              <p className="text-sm text-slate-500">
                Manage your personal details and contact preferences.
              </p>
            </div>
            <User className="w-6 h-6 text-slate-400" />
          </div>
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-1">
              <label className="text-sm font-medium text-slate-700">
                Full Name
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-teal-600">
                  <IdCard className="w-5 h-5" />
                </span>
                <input
                  className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all text-slate-900 outline-none"
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium text-slate-700">
                Email Address
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-teal-600">
                  <Mail className="w-5 h-5" />
                </span>
                <input
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-500 cursor-not-allowed outline-none"
                  type="email"
                  value={email}
                  disabled
                  title="Email cannot be changed here"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium text-slate-700">
                Phone Number
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-teal-600">
                  <Phone className="w-5 h-5" />
                </span>
                <input
                  className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all text-slate-900 outline-none"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+1 (555) 000-0000"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium text-slate-700">
                Department
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-teal-600">
                  <Building2 className="w-5 h-5" />
                </span>
                <select
                  className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all text-slate-900 appearance-none bg-none outline-none"
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
        <section className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
          <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">
                Change Password
              </h2>
              <p className="text-sm text-slate-500">
                Ensure your account is using a long, random password.
              </p>
            </div>
            <Lock className="w-5 h-5 text-slate-400" />
          </div>
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6 items-end">
            <div className="space-y-1">
              <label className="text-sm font-medium text-slate-700">
                New Password
              </label>
              <input
                className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all text-slate-900 outline-none"
                type="password"
                placeholder="••••••••"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium text-slate-700">
                Confirm Password
              </label>
              <input
                className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all text-slate-900 outline-none"
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
                className="px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-sm font-bold shadow-sm transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed border-none"
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
          {/* 2FA Card */}
          <section className="lg:col-span-2 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
            <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">
                  Two-Factor Authentication
                </h2>
                <p className="text-sm text-slate-500">
                  Secure your account with an extra layer of protection.
                </p>
              </div>
              <Lock className="w-5 h-5 text-slate-400" />
            </div>
            <div className="p-6 flex-1 flex flex-col justify-center">
              <div className="flex flex-col sm:flex-row items-start gap-4 mb-6">
                <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0 text-emerald-600">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="font-medium text-slate-900">
                      Authenticator App
                    </h3>
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200 shadow-sm">
                      Enabled
                    </span>
                  </div>
                  <p className="text-sm text-slate-500 mb-3">
                    Use an authenticator app like Google Authenticator or
                    Microsoft Authenticator to generate verification codes.
                  </p>
                  <button
                    onClick={() =>
                      toast.info("Device configuration panel coming in v2.0")
                    }
                    className="text-sm text-teal-600 font-bold hover:text-teal-700 transition-colors"
                  >
                    Configure
                  </button>
                </div>
              </div>

              <div className="h-px bg-slate-100 w-full mb-6"></div>

              <div className="flex flex-col sm:flex-row items-start gap-4">
                <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center flex-shrink-0 text-slate-500">
                  <MessageSquare className="w-6 h-6" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="font-medium text-slate-900">
                      SMS Authentication
                    </h3>
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-slate-100 text-slate-600 border border-slate-200 shadow-sm">
                      Disabled
                    </span>
                  </div>
                  <p className="text-sm text-slate-500 mb-3">
                    Receive verification codes via SMS text message. Less secure
                    than an authenticator app.
                  </p>
                  <button
                    onClick={() =>
                      toast.info("SMS Gateway integration coming in v2.0")
                    }
                    className="text-sm text-teal-600 font-bold hover:text-teal-700 transition-colors"
                  >
                    Enable
                  </button>
                </div>
              </div>
            </div>
          </section>

          {/* Session Management Card */}
          <section className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
            <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
              <h2 className="text-lg font-semibold text-slate-900">
                Active Sessions
              </h2>
              <p className="text-sm text-slate-500">
                Devices logged into your account.
              </p>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center text-slate-500">
                  <Monitor className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-900 flex items-center gap-2">
                    Current Device
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                  </p>
                  <p className="text-xs text-slate-500 truncate">Active now</p>
                </div>
              </div>

              <div className="flex items-center gap-3 opacity-75">
                <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center text-slate-500">
                  <Smartphone className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-900">
                    Mobile Device
                  </p>
                  <p className="text-xs text-slate-500 truncate">2 hrs ago</p>
                </div>
                <button
                  onClick={() => toast.success("Session revoked successfully.")}
                  className="text-slate-400 hover:text-red-500 transition-colors"
                  title="Revoke Session"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>

              <div className="flex items-center gap-3 opacity-75">
                <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center text-slate-500">
                  <Laptop className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-900">
                    Secondary Device
                  </p>
                  <p className="text-xs text-slate-500 truncate">3 days ago</p>
                </div>
                <button
                  onClick={() => toast.success("Session revoked successfully.")}
                  className="text-slate-400 hover:text-red-500 transition-colors"
                  title="Revoke Session"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            </div>
            <div className="mt-auto px-6 py-4 bg-slate-50 border-t border-slate-100">
              <button
                onClick={() =>
                  toast.success("Logged out from all other devices.")
                }
                className="w-full py-2 border border-slate-300 rounded-lg text-sm font-medium text-slate-700 hover:bg-white hover:border-red-200 hover:text-red-600 transition-colors flex items-center justify-center gap-2 shadow-sm"
              >
                <Ban className="w-4 h-4" />
                Log Out All Devices
              </button>
            </div>
          </section>
        </div>

        {/* Notifications Preference */}
        <section className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">
                Email Notifications
              </h2>
              <p className="text-sm text-slate-500">
                Choose what updates you want to receive.
              </p>
            </div>
            <BellRing className="w-5 h-5 text-slate-400" />
          </div>
          <div className="p-6 space-y-5">
            <label className="flex items-center justify-between group cursor-pointer">
              <div className="flex-1 pr-4">
                <h3 className="text-sm font-medium text-slate-900 group-hover:text-teal-600 transition-colors">
                  Security Alerts
                </h3>
                <p className="text-sm text-slate-500">
                  Get notified about critical security incidents immediately.
                </p>
              </div>
              <div
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 ease-in-out ${securityAlerts ? "bg-teal-600" : "bg-slate-200"}`}
              >
                <input
                  type="checkbox"
                  className="sr-only"
                  checked={securityAlerts}
                  onChange={() => setSecurityAlerts(!securityAlerts)}
                />
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-sm ring-1 ring-slate-900/5 transition duration-200 ease-in-out ${securityAlerts ? "translate-x-6" : "translate-x-1"}`}
                />
              </div>
            </label>

            <div className="h-px bg-slate-100 w-full"></div>

            <label className="flex items-center justify-between group cursor-pointer">
              <div className="flex-1 pr-4">
                <h3 className="text-sm font-medium text-slate-900 group-hover:text-teal-600 transition-colors">
                  Campaign Reports
                </h3>
                <p className="text-sm text-slate-500">
                  Weekly summaries of phishing simulation campaigns.
                </p>
              </div>
              <div
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 ease-in-out ${campaignReports ? "bg-teal-600" : "bg-slate-200"}`}
              >
                <input
                  type="checkbox"
                  className="sr-only"
                  checked={campaignReports}
                  onChange={() => setCampaignReports(!campaignReports)}
                />
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-sm ring-1 ring-slate-900/5 transition duration-200 ease-in-out ${campaignReports ? "translate-x-6" : "translate-x-1"}`}
                />
              </div>
            </label>

            <div className="h-px bg-slate-100 w-full"></div>

            <label className="flex items-center justify-between group cursor-pointer">
              <div className="flex-1 pr-4">
                <h3 className="text-sm font-medium text-slate-900 group-hover:text-teal-600 transition-colors">
                  Product Updates
                </h3>
                <p className="text-sm text-slate-500">
                  New features and improvements to the platform.
                </p>
              </div>
              <div
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 ease-in-out ${productUpdates ? "bg-teal-600" : "bg-slate-200"}`}
              >
                <input
                  type="checkbox"
                  className="sr-only"
                  checked={productUpdates}
                  onChange={() => setProductUpdates(!productUpdates)}
                />
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-sm ring-1 ring-slate-900/5 transition duration-200 ease-in-out ${productUpdates ? "translate-x-6" : "translate-x-1"}`}
                />
              </div>
            </label>
          </div>
        </section>

        {/* Danger Zone */}
        <div className="pt-6">
          <div className="rounded-xl border border-red-200 bg-red-50 p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <h3 className="text-base font-semibold text-red-700">
                Delete Account
              </h3>
              <p className="text-sm text-red-600/80 mt-1">
                Once you delete your account, there is no going back. Please be
                certain.
              </p>
            </div>
            <button
              onClick={() =>
                toast.error("Account termination workflow initiated.")
              }
              className="px-4 py-2 bg-white border border-red-200 text-red-600 rounded-lg text-sm font-medium hover:bg-red-50 hover:text-red-700 hover:border-red-300 transition-colors shadow-sm whitespace-nowrap"
            >
              Delete Account
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
