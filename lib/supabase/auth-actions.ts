'use server';

import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { headers } from 'next/headers';

// ─── Email / Password ────────────────────────────────────────────

export async function signInWithEmail(formData: { email: string; password: string }) {
  const supabase = await createClient();

  const { error } = await supabase.auth.signInWithPassword({
    email: formData.email,
    password: formData.password,
  });

  if (error) {
    return { error: error.message };
  }

  redirect('/dashboard');
}

export async function signUpWithEmail(formData: {
  email: string;
  password: string;
  fullName?: string;
  orgName?: string;
}) {
  const supabase = await createClient();

  const { error } = await supabase.auth.signUp({
    email: formData.email,
    password: formData.password,
    options: {
      data: {
        full_name: formData.fullName || '',
        org_name: formData.orgName || '',
      },
    },
  });

  if (error) {
    return { error: error.message };
  }

  // Supabase sends a confirmation email by default.
  return { success: 'Check your email to confirm your account.' };
}

// ─── Social / OAuth ──────────────────────────────────────────────

export async function signInWithSocial(provider: 'google' | 'github') {
  const supabase = await createClient();
  const origin = (await headers()).get('origin') || 'http://localhost:3000';

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider,
    options: {
      redirectTo: `${origin}/auth/callback`,
    },
  });

  if (error) {
    return { error: error.message };
  }

  if (data?.url) {
    redirect(data.url);
  }

  return { error: 'Could not initiate OAuth flow.' };
}

// ─── Get Current User ────────────────────────────────────────────

export async function getUser() {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) return null;
  return {
    id: user.id,
    email: user.email || '',
    fullName: (user.user_metadata?.full_name as string) || '',
    orgName: (user.user_metadata?.org_name as string) || '',
    phone: (user.user_metadata?.phone as string) || '',
    department: (user.user_metadata?.department as string) || 'Security Operations',
    avatarUrl: user.user_metadata?.avatar_url as string | undefined,
    // Notification prefs
    securityAlerts: user.user_metadata?.security_alerts !== false,
    campaignReports: user.user_metadata?.campaign_reports !== false,
    productUpdates: user.user_metadata?.product_updates === true,
    // Settings prefs
    twoFactor: user.user_metadata?.two_factor !== false,
    sessionTimeout: user.user_metadata?.session_timeout === true,
    ipWhitelisting: user.user_metadata?.ip_whitelisting === true,
    supportEmail: (user.user_metadata?.support_email as string) || '',
  };
}

// ─── Update Profile ──────────────────────────────────────────────

export async function updateProfile(data: {
  fullName: string;
  phone: string;
  department: string;
  securityAlerts: boolean;
  campaignReports: boolean;
  productUpdates: boolean;
}) {
  const supabase = await createClient();

  const { error } = await supabase.auth.updateUser({
    data: {
      full_name: data.fullName,
      phone: data.phone,
      department: data.department,
      security_alerts: data.securityAlerts,
      campaign_reports: data.campaignReports,
      product_updates: data.productUpdates,
    },
  });

  if (error) return { error: error.message };
  return { success: 'Profile updated successfully.' };
}

// ─── Update Settings ─────────────────────────────────────────────

export async function updateSettings(data: {
  orgName: string;
  supportEmail: string;
  twoFactor: boolean;
  sessionTimeout: boolean;
  ipWhitelisting: boolean;
}) {
  const supabase = await createClient();

  const { error } = await supabase.auth.updateUser({
    data: {
      org_name: data.orgName,
      support_email: data.supportEmail,
      two_factor: data.twoFactor,
      session_timeout: data.sessionTimeout,
      ip_whitelisting: data.ipWhitelisting,
    },
  });

  if (error) return { error: error.message };
  return { success: 'Settings saved successfully.' };
}
