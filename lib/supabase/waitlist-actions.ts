'use server'
import { createClient } from '@/lib/supabase/server'

export async function joinWaitlist(email: string, tier: 'soc_pro' | 'command_control') {
  if (!email || !email.includes('@')) {
    return { error: 'Please enter a valid email address.' }
  }

  const supabase = await createClient()

  const { error } = await supabase
    .from('waitlist')
    .insert({ email: email.toLowerCase().trim(), tier })

  if (error) {
    if (error.code === '23505') {
      return { error: "You're already on the waitlist!" }
    }
    return { error: 'Something went wrong. Please try again.' }
  }

  return { success: true }
}
